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

// TLD list — price will be fetched from Namecheap API, fallback values used if API fails
const EXTENSIONS = [
  ".com", ".id", ".co.id", ".net", ".store",
  ".shop", ".online", ".site", ".xyz", ".org",
];

// Fallback prices (IDR) if Namecheap pricing API fails
const FALLBACK_PRICES: Record<string, number> = {
  ".com":    97000,
  ".id":     316000,
  ".co.id":  327000,
  ".net":    210000,
  ".store":  320000,
  ".shop":   165000,
  ".online": 120000,
  ".site":   110000,
  ".xyz":    50000,
  ".org":    180000,
};

const USD_TO_IDR = 16500;

// ── Namecheap helpers ───────────────────────────────────────────────────

function getApiConfig() {
  const apiUser  = process.env.NAMECHEAP_API_USER;
  const apiKey   = process.env.NAMECHEAP_API_KEY;
  const clientIp = process.env.NAMECHEAP_CLIENT_IP ?? "127.0.0.1";
  const sandbox  = process.env.NAMECHEAP_SANDBOX === "true";
  const base     = sandbox
    ? "https://api.sandbox.namecheap.com/xml.response"
    : "https://api.namecheap.com/xml.response";

  if (!apiUser || !apiKey) return null;
  return { apiUser, apiKey, clientIp, base };
}

// ── Check availability ──────────────────────────────────────────────────

async function checkNamecheap(baseDomain: string): Promise<Map<string, boolean>> {
  const config = getApiConfig();
  if (!config) return new Map();

  const domainList = EXTENSIONS.map((ext) => baseDomain + ext).join(",");
  const url = `${config.base}?ApiUser=${config.apiUser}&ApiKey=${config.apiKey}&UserName=${config.apiUser}&ClientIp=${config.clientIp}&Command=namecheap.domains.check&DomainList=${domainList}`;

  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    const xml = await res.text();
    const parsed = await parseStringPromise(xml, { explicitArray: false });

    const availMap = new Map<string, boolean>();
    const checkResults = parsed?.ApiResponse?.CommandResponse?.DomainCheckResult;
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

// ── Get pricing ─────────────────────────────────────────────────────────

let priceCache: { data: Map<string, number>; ts: number } | null = null;
const PRICE_CACHE_TTL = 60 * 60 * 1000; // 1 hour

async function getNamecheapPrices(): Promise<Map<string, number>> {
  // Return cached if still fresh
  if (priceCache && Date.now() - priceCache.ts < PRICE_CACHE_TTL) {
    return priceCache.data;
  }

  const config = getApiConfig();
  if (!config) return new Map();

  const url = `${config.base}?ApiUser=${config.apiUser}&ApiKey=${config.apiKey}&UserName=${config.apiUser}&ClientIp=${config.clientIp}&Command=namecheap.users.getPricing&ProductType=DOMAIN&ActionName=REGISTER`;

  try {
    const res = await fetch(url);
    const xml = await res.text();
    const parsed = await parseStringPromise(xml, { explicitArray: false });

    const priceMap = new Map<string, number>();
    const productType = parsed?.ApiResponse?.CommandResponse?.UserGetPricingResult?.ProductType;
    if (!productType) return priceMap;

    const categories = productType.ProductCategory;
    const catArray = Array.isArray(categories) ? categories : categories ? [categories] : [];

    for (const cat of catArray) {
      const products = cat?.Product;
      const prodArray = Array.isArray(products) ? products : products ? [products] : [];

      for (const prod of prodArray) {
        const tld = prod?.$.Name as string | undefined;
        if (!tld) continue;

        const priceData = prod?.Price;
        const priceArray = Array.isArray(priceData) ? priceData : priceData ? [priceData] : [];

        // Find 1-year registration price
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const yearOne = priceArray.find(
          (p: any) => p?.$.Duration === "1" && p?.$.DurationType === "YEAR"
        );

        if (yearOne) {
          const usd = parseFloat(yearOne.$.Price ?? yearOne.$.YourPrice ?? "0");
          if (usd > 0) {
            const ext = `.${tld}`;
            priceMap.set(ext, Math.round(usd * USD_TO_IDR));
          }
        }
      }
    }

    if (priceMap.size > 0) {
      priceCache = { data: priceMap, ts: Date.now() };
    }

    return priceMap;
  } catch (e) {
    console.error("[domains/search] Pricing API error:", e);
    return new Map();
  }
}

// ── Deterministic mock fallback ─────────────────────────────────────────

function mockAvailable(baseDomain: string, ext: string): boolean {
  const hash = (baseDomain + ext).split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return (hash % 100) < 70;
}

// ── Route handler ───────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "";

  const baseDomain = query
    .toLowerCase()
    .trim()
    .replace(/\.(com|id|co\.id|net|store|shop|online|site|xyz|org|info)$/i, "")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/--+/g, "-")
    .replace(/^-|-$/g, "");

  if (!baseDomain) {
    return NextResponse.json({ results: [] });
  }

  // Fetch availability and pricing in parallel
  const [availMap, priceMap] = await Promise.all([
    checkNamecheap(baseDomain),
    getNamecheapPrices(),
  ]);

  const usingReal = availMap.size > 0;
  const usingRealPricing = priceMap.size > 0;

  const results: DomainResult[] = EXTENSIONS.map((ext) => {
    const fullDomain = baseDomain + ext;
    const available = usingReal
      ? (availMap.get(fullDomain) ?? false)
      : mockAvailable(baseDomain, ext);

    const basePrice = usingRealPricing
      ? (priceMap.get(ext) ?? FALLBACK_PRICES[ext] ?? 100000)
      : (FALLBACK_PRICES[ext] ?? 100000);
    const price = Math.round(basePrice * 1.2);

    return { domain: baseDomain, extension: ext, fullDomain, price, available };
  });

  return NextResponse.json({
    results,
    source: usingReal ? "namecheap" : "mock",
    pricing: usingRealPricing ? "namecheap" : "fallback",
  });
}
