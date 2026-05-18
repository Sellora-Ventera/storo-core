/**
 * Thin server-side HTTP client untuk Sharelink.id Referral API.
 *
 * Auth: Bearer token (mrs_sk_...) — NEVER expose to browser.
 * All functions di file ini WAJIB dipanggil dari server (Server Component,
 * Route Handler, Server Action, Edge Function). Kalau perlu di client,
 * proxy lewat /api/referral/*.
 *
 * Env vars required:
 *   SHARELINK_BASE_URL       e.g. https://sharelink.id  (root, tanpa /api/v1)
 *   SHARELINK_SECRET_KEY     mrs_sk_xxx (key milik tenant Ventera AI / rafli-t1tan)
 *   SHARELINK_TENANT_ID      UUID tenant Ventera AI di Sharelink (untuk webhook path)
 *
 * Storo TIDAK punya tenant Sharelink terpisah. Storo + Salesmetrix share satu
 * tenant Ventera AI; merchant Storo dibedakan dengan
 * metadata.referrer_source = "storo_merchant".
 *
 * Pola yang dipakai mirror Sharelink REST surface yang sudah ada
 * (d:\Project\sharelink.id\src\app\api\v1\*). Jangan tambah endpoint baru
 * di sini tanpa cek Sharelink dulu.
 */

export type RewardType =
  | "cash"
  | "credit"
  | "discount"
  | "plan_extension"
  | "feature_unlock"
  | "custom_webhook";

export type RewardStatus =
  | "pending"
  | "held"
  | "approved"
  | "distributed"
  | "clawed_back"
  | "failed";

export type EventType = "signup" | "purchase" | "click" | "custom" | string;

export interface RewardOverride {
  reward_type: RewardType;
  calculation: {
    flat?: { amount: number; currency?: string };
    percentage?: { rate: number; baseField: string };
    tiered?: { tiers: Array<{ minCount: number; maxCount: number; rate: number }>; baseField: string };
    capped?: { rate: number; cap: number; baseField: string };
  };
  currency?: string;
  hold_days?: number;
  connector_id?: string;
  cap?: { per_referrer_per_month?: number };
}

export interface ReferralCodeRow {
  id: string;
  tenant_id: string;
  code: string;
  referrer_id: string | null;
  referrer_email: string | null;
  referrer_name: string | null;
  type: string;
  status: "active" | "expired" | "disabled" | "exhausted";
  max_uses: number | null;
  current_uses: number;
  expires_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface RewardRow {
  id: string;
  tenant_id: string;
  event_id: string;
  referral_code_id: string;
  recipient_id: string;
  recipient_type: "referrer" | "referee";
  reward_type: RewardType;
  amount: number | null;
  currency: string;
  status: RewardStatus;
  hold_until: string | null;
  distributed_at: string | null;
  level: 1 | 2;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface SharelinkError {
  code: string;
  message: string;
  status: number;
  details?: unknown;
}

export interface PublicValidateResult {
  valid: boolean;
  tenant_id?: string;
  referrer_email?: string;
  referrer_name?: string;
  redeemer_discount?: unknown;
}

class SharelinkClientImpl {
  private baseUrl: string;
  private secretKey: string;

  constructor() {
    const base = process.env.SHARELINK_BASE_URL;
    const key = process.env.SHARELINK_SECRET_KEY;
    if (!base) throw new Error("SHARELINK_BASE_URL env var is required");
    if (!key) throw new Error("SHARELINK_SECRET_KEY env var is required");
    this.baseUrl = base.replace(/\/+$/, "");
    this.secretKey = key;
  }

  private async request<T>(
    path: string,
    init: RequestInit & { searchParams?: Record<string, string | number | undefined> } = {},
  ): Promise<T> {
    const { searchParams, ...fetchInit } = init;
    let url = `${this.baseUrl}/api/v1${path}`;
    if (searchParams) {
      const qs = new URLSearchParams();
      for (const [k, v] of Object.entries(searchParams)) {
        if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
      }
      const s = qs.toString();
      if (s) url += `?${s}`;
    }

    const res = await fetch(url, {
      ...fetchInit,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.secretKey}`,
        ...(fetchInit.headers ?? {}),
      },
    });

    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      // non-JSON response
    }

    if (!res.ok) {
      const errObj = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
      const error: SharelinkError = {
        code: (errObj.code as string) ?? "SHARELINK_HTTP_ERROR",
        message: (errObj.message as string) ?? `Sharelink ${res.status}`,
        status: res.status,
        details: errObj.details,
      };
      throw error;
    }

    const envelope = body as { data?: T; success?: boolean } | null;
    return (envelope?.data ?? body) as T;
  }

  // ─── Referral codes ────────────────────────────────────────────────────

  async createReferral(params: {
    code?: string;
    referrerId: string;
    referrerEmail?: string;
    referrerName?: string;
    type?: "standard" | "vanity" | "campaign";
    maxUses?: number;
    expiresAt?: string;
    metadata?: Record<string, unknown>;
    parentCodeId?: string;
    discountConfig?: { type: "percentage" | "fixed"; value: number; max_discount?: number };
  }): Promise<ReferralCodeRow> {
    return this.request<ReferralCodeRow>("/referrals", {
      method: "POST",
      body: JSON.stringify({
        code: params.code,
        referrerId: params.referrerId,
        referrerEmail: params.referrerEmail,
        referrerName: params.referrerName,
        type: params.type ?? "standard",
        maxUses: params.maxUses,
        expiresAt: params.expiresAt,
        metadata: params.metadata,
        parentCodeId: params.parentCodeId,
        discount_config: params.discountConfig,
      }),
    });
  }

  /**
   * Merge metadata patch ke existing metadata kode (read-modify-write).
   *
   * Sharelink PATCH /referrals/[code] me-REPLACE metadata (lihat route.ts:64),
   * jadi kita harus baca metadata existing dulu lalu kirim merged object.
   * Ada race condition kalau dua client concurrent update — acceptable untuk
   * MVP karena hanya admin Storo yang panggil ini.
   */
  async updateReferralMetadata(
    code: string,
    metadataPatch: Record<string, unknown>,
  ): Promise<ReferralCodeRow> {
    const existing = await this.getReferral(code);
    const merged = {
      ...(existing.metadata ?? {}),
      ...metadataPatch,
    };
    return this.request<ReferralCodeRow>(`/referrals/${encodeURIComponent(code)}`, {
      method: "PATCH",
      body: JSON.stringify({ metadata: merged }),
    });
  }

  async getReferral(code: string): Promise<ReferralCodeRow> {
    return this.request<ReferralCodeRow>(`/referrals/${encodeURIComponent(code)}`);
  }

  async listReferrals(filters: {
    referrerId?: string;
    status?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ data: ReferralCodeRow[]; total: number; page: number; limit: number }> {
    return this.request("/referrals", {
      searchParams: {
        referrerId: filters.referrerId,
        status: filters.status,
        page: filters.page,
        limit: filters.limit,
      },
    });
  }

  // ─── Public validate (no auth needed, CORS-open) ──────────────────────

  async validateCodePublic(code: string): Promise<PublicValidateResult> {
    const url = `${this.baseUrl}/api/public/codes/${encodeURIComponent(code)}/validate`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return { valid: false };
    return (await res.json()) as PublicValidateResult;
  }

  // ─── Events ────────────────────────────────────────────────────────────

  async triggerEvent(params: {
    referralCode: string;
    eventType: EventType;
    eventName?: string;
    refereeId: string;
    refereeEmail?: string;
    refereeName?: string;
    refereeIp?: string;
    refereeDeviceFingerprint?: string;
    metadata?: Record<string, unknown>;
  }): Promise<{
    event: { id: string; status: string };
    rewards?: Array<{ id: string; recipientId: string; amount: number | null; level: 1 | 2 }>;
    riskAssessment?: { riskScore: number; blocked: boolean };
  }> {
    return this.request("/events", {
      method: "POST",
      body: JSON.stringify({
        referralCode: params.referralCode,
        eventType: params.eventType,
        eventName: params.eventName,
        refereeId: params.refereeId,
        refereeEmail: params.refereeEmail,
        refereeName: params.refereeName,
        refereeIp: params.refereeIp,
        refereeDeviceFingerprint: params.refereeDeviceFingerprint,
        metadata: params.metadata,
      }),
    });
  }

  // ─── Rewards ───────────────────────────────────────────────────────────

  async listRewards(filters: {
    recipientId?: string;
    status?: RewardStatus;
    rewardType?: RewardType;
    page?: number;
    limit?: number;
  } = {}): Promise<{ data: RewardRow[]; total: number; page: number; limit: number }> {
    return this.request("/rewards", {
      searchParams: {
        recipientId: filters.recipientId,
        status: filters.status,
        rewardType: filters.rewardType,
        page: filters.page,
        limit: filters.limit,
      },
    });
  }

  async getReward(rewardId: string): Promise<RewardRow> {
    return this.request<RewardRow>(`/rewards/${encodeURIComponent(rewardId)}`);
  }

  async actionReward(
    rewardId: string,
    action: "approve" | "distribute" | "clawback",
    opts: { reason?: string; connectorId?: string } = {},
  ): Promise<RewardRow> {
    return this.request<RewardRow>(`/rewards/${encodeURIComponent(rewardId)}`, {
      method: "PATCH",
      body: JSON.stringify({ action, reason: opts.reason, connectorId: opts.connectorId }),
    });
  }
}

// Lazy singleton — avoids env-var read at module-load (Next.js may import
// during static analysis when env vars aren't available yet).
let _client: SharelinkClientImpl | null = null;

export function sharelinkClient(): SharelinkClientImpl {
  if (!_client) _client = new SharelinkClientImpl();
  return _client;
}

/**
 * Build a `metadata.reward_override` payload for createReferral().
 * Mirrors Sharelink's pipeline.ts `readRewardOverride` shape (line 441-460).
 *
 * Example:
 *   buildFlatCreditOverride({ amountIDR: 100_000 })
 *   → { reward_type: 'credit', calculation: { flat: { amount: 100000, currency: 'IDR' } } }
 */
export function buildFlatCreditOverride(opts: {
  amountIDR: number;
  holdDays?: number;
}): RewardOverride {
  return {
    reward_type: "credit",
    calculation: { flat: { amount: opts.amountIDR, currency: "IDR" } },
    currency: "IDR",
    hold_days: opts.holdDays ?? 0,
  };
}
