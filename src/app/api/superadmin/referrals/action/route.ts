import { NextRequest, NextResponse } from "next/server";
import { requireSuperadmin } from "@/lib/auth/superadmin";
import {
  sharelinkClient,
  buildFlatCreditOverride,
} from "@/lib/sharelink/client";

export const dynamic = "force-dynamic";

/**
 * Superadmin actions untuk referral program:
 *
 *   POST /api/superadmin/referrals/action
 *   body:
 *     - { action: 'update_reward_amount', code: 'STORO-XXX', amountIDR: 250000 }
 *     - { action: 'approve_reward', rewardId: 'uuid' }
 *     - { action: 'distribute_reward', rewardId: 'uuid', connectorId?: 'uuid' }
 *     - { action: 'clawback_reward', rewardId: 'uuid', reason: 'string' }
 *
 * Semua dilakukan via Sharelink REST API. Auth: superadmin Storo (cookie session).
 */
export async function POST(request: NextRequest) {
  const auth = await requireSuperadmin();
  if (!auth.ok) return auth.errorResponse;

  let body: {
    action?: string;
    code?: string;
    amountIDR?: number;
    rewardId?: string;
    connectorId?: string;
    reason?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const sl = sharelinkClient();

  try {
    switch (body.action) {
      case "update_reward_amount": {
        if (!body.code || typeof body.amountIDR !== "number") {
          return NextResponse.json(
            { error: "code and amountIDR required" },
            { status: 400 },
          );
        }
        if (body.amountIDR < 0) {
          return NextResponse.json(
            { error: "amountIDR must be >= 0" },
            { status: 400 },
          );
        }
        // PATCH metadata.reward_override on the code. Sharelink merges metadata
        // on the server side (see PATCH route handler in referrals/[code]).
        const updated = await sl.updateReferralMetadata(body.code, {
          reward_override: buildFlatCreditOverride({ amountIDR: body.amountIDR }),
        });
        return NextResponse.json({ ok: true, code: updated });
      }

      case "approve_reward": {
        if (!body.rewardId) {
          return NextResponse.json({ error: "rewardId required" }, { status: 400 });
        }
        const updated = await sl.actionReward(body.rewardId, "approve");
        return NextResponse.json({ ok: true, reward: updated });
      }

      case "distribute_reward": {
        if (!body.rewardId) {
          return NextResponse.json({ error: "rewardId required" }, { status: 400 });
        }
        const updated = await sl.actionReward(body.rewardId, "distribute", {
          connectorId: body.connectorId,
        });
        return NextResponse.json({ ok: true, reward: updated });
      }

      case "clawback_reward": {
        if (!body.rewardId) {
          return NextResponse.json({ error: "rewardId required" }, { status: 400 });
        }
        const updated = await sl.actionReward(body.rewardId, "clawback", {
          reason: body.reason ?? "Superadmin clawback",
        });
        return NextResponse.json({ ok: true, reward: updated });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${body.action}` },
          { status: 400 },
        );
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Sharelink error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
