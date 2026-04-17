/**
 * Cloudflare DNS API wrapper for template preview subdomain management.
 *
 * Docs: https://developers.cloudflare.com/api/operations/dns-records-for-a-zone-list-dns-records
 */

const CF_API = "https://api.cloudflare.com/client/v4";

export class CloudflareApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body: unknown,
  ) {
    super(message);
    this.name = "CloudflareApiError";
  }
}

interface CloudflareConfig {
  token: string;
  zoneId: string;
}

function getConfig(): CloudflareConfig | null {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;
  if (!token || !zoneId) return null;
  return { token, zoneId };
}

async function cfFetch<T>(
  config: CloudflareConfig,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${CF_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

  let body: { success?: boolean; result?: unknown; errors?: Array<{ message: string }> } | null =
    null;
  try {
    body = await response.json();
  } catch {
    /* no-op */
  }

  if (!response.ok || !body?.success) {
    const message = body?.errors?.[0]?.message ?? `Cloudflare API error ${response.status}`;
    throw new CloudflareApiError(message, response.status, body);
  }

  return body.result as T;
}

export interface DnsRecord {
  id: string;
  name: string;
  type: string;
  content: string;
  proxied: boolean;
}

export interface CreateDnsRecordInput {
  /** Subdomain part only — e.g. "fashion.preview" for "fashion.preview.storo.id" */
  name: string;
  /** Target hostname for CNAME or raw value for TXT */
  content: string;
  type?: "CNAME" | "A" | "TXT" | "AAAA";
  proxied?: boolean;
  ttl?: number;
}

export async function createDnsRecord(input: CreateDnsRecordInput): Promise<DnsRecord> {
  const config = getConfig();
  if (!config)
    throw new CloudflareApiError("CLOUDFLARE_API_TOKEN/ZONE_ID not configured", 500, null);

  const body = {
    type: input.type ?? "CNAME",
    name: input.name,
    content: input.content,
    proxied: input.proxied ?? false,
    ttl: input.ttl ?? 1, // 1 = automatic
  };

  return cfFetch<DnsRecord>(config, `/zones/${config.zoneId}/dns_records`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function deleteDnsRecord(recordId: string): Promise<void> {
  const config = getConfig();
  if (!config)
    throw new CloudflareApiError("CLOUDFLARE_API_TOKEN/ZONE_ID not configured", 500, null);

  try {
    await cfFetch(config, `/zones/${config.zoneId}/dns_records/${encodeURIComponent(recordId)}`, {
      method: "DELETE",
    });
  } catch (err) {
    if (err instanceof CloudflareApiError && err.status === 404) return;
    throw err;
  }
}

export async function findDnsRecordByName(fullName: string): Promise<DnsRecord | null> {
  const config = getConfig();
  if (!config)
    throw new CloudflareApiError("CLOUDFLARE_API_TOKEN/ZONE_ID not configured", 500, null);

  const records = await cfFetch<DnsRecord[]>(
    config,
    `/zones/${config.zoneId}/dns_records?name=${encodeURIComponent(fullName)}`,
    { method: "GET" },
  );

  return records.length > 0 ? records[0] : null;
}
