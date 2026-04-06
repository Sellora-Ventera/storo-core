import { NextRequest, NextResponse } from "next/server";
import { parseStringPromise } from "xml2js";

export interface DomainResult {
  domain: string;
  extension: string;
  fullDomain: string;
  price: number;
  priceOriginal?: number;
  available: boolean;
}

// Approximate Namecheap retail prices (IDR), updated periodically
const EXTENSIONS: { ext: string; price: number; priceOriginal: number }[] = [
  { ext: ".com",   price:  97000, priceOriginal: 245000 },
  { ext: ".id",    price: 316000, priceOriginal: 355000 },
  { ext: ".co.id", price: 327000, priceOriginal: 400000 },
  { ext: ".net",   price: 210000, priceOriginal: 280000 },
  { ext: ".store", price: 320000, priceOriginal: 420000 },
];

// ── Namecheap real check ─────────────────────────────────────────────────
async function checkNamecheap(baseDomain: string): Promise<Map<string, boolean>> {
  const apiUser  = process.env.NAMECHEAP_API_USER;
  const apiKey   = process.env.NAMECHEAP_API_KEY;
  const clientIp = process.env.NAMECHEAP_CLIENT_IP ?? "127.0.0.1";

  if (!apiUser || !apiKey) return new Map();

  const domainList = EXTENSIONS.map(({ ext }) => baseDomain + ext).join(",");
  const sandbox = process.env.NAMECHEAP_SANDBOX === "true";
  const base = sandbox
    ? "https://api.sandbox.namecheap.com/xml.response"
    : "https://api.namecheap.com/xml.response";

  const url = `${base}?ApiUser=${apiUser}&ApiKey=${apiKey}&UserName=${apiUser}&ClientIp=${clientIp}&Command=namecheap.domains.check&DomainList=${domainList}`;

  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    const xml = await res.text();
    const parsed = await parseStringPromise(xml, { explicitArray: false });

    const availMap = new Map<string, boolean>();
    const commandResponse = parsed?.ApiResponse?.CommandResponse;
    const checkResults = commandResponse?.DomainCheckResult;

    // May be array or single object
    const items = Array.isArray(checkResults) ? checkResults : checkResults ? [checkResults] : [];
    for (const item of items) {
      const domain: string = item?.$.Domain ?? "";
      const available: boolean = item?.$.Available === "true";
      availMap.set(domain.toLowerCase(), available);
    }
    return availMap;
  } catch {
    return new Map();
  }
}

// ── Deterministic mock fallback ──────────────────────────────────────────
function mockAvailable(baseDomain: string, ext: string): boolean {
  const hash = (baseDomain + ext).split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return (hash % 100) < 70; // ~70% available in mock
}

// ── Route handler ────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "";

  const baseDomain = query
    .toLowerCase()
    .trim()
    // strip any existing extension the user may have typed
    .replace(/\.(com|id|co\.id|net|store|org|info)$/i, "")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/--+/g, "-")
    .replace(/^-|-$/g, "");

  if (!baseDomain) {
    return NextResponse.json({ results: [] });
  }

  // Try real Namecheap API
  const availMap = await checkNamecheap(baseDomain);
  const usingReal = availMap.size > 0;

  const results: DomainResult[] = EXTENSIONS.map(({ ext, price, priceOriginal }) => {
    const fullDomain = baseDomain + ext;
    const available = usingReal
      ? (availMap.get(fullDomain) ?? false)
      : mockAvailable(baseDomain, ext);

    return { domain: baseDomain, extension: ext, fullDomain, price, priceOriginal, available };
  });

  return NextResponse.json({ results, source: usingReal ? "namecheap" : "mock" });
}
