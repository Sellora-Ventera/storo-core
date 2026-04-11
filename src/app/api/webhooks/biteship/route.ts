import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Mapping Biteship order status → our order status.
 * Covers all 13 Biteship statuses. Biteship sends snake_case in webhook body
 * (dashboard displays camelCase: pickingUp, droppingOff, returnInTransit, etc.).
 *
 * Terminal states (return_in_transit, rejected, courier_not_found, returned,
 * cancelled, disposed) bypass monotonic progression and can be applied from
 * any current state — Biteship is the source of truth for cancellation.
 */
const STATUS_MAP: Record<
  string,
  {
    orderStatus: string
    setTimestamp?: 'shipped_at' | 'delivered_at'
    terminal?: boolean
  }
> = {
  // Forward progression — processing
  confirmed:         { orderStatus: 'processing' },
  allocated:         { orderStatus: 'processing' },
  picking_up:        { orderStatus: 'processing' },
  on_hold:           { orderStatus: 'processing' }, // temporary pause, not terminal

  // Forward progression — shipped
  picked:            { orderStatus: 'shipped', setTimestamp: 'shipped_at' },
  dropping_off:      { orderStatus: 'shipped', setTimestamp: 'shipped_at' },

  // Forward progression — delivered
  delivered:         { orderStatus: 'delivered', setTimestamp: 'delivered_at' },

  // Terminal / cancellation states — bypass monotonic progression
  return_in_transit: { orderStatus: 'cancelled', terminal: true },
  rejected:          { orderStatus: 'cancelled', terminal: true },
  courier_not_found: { orderStatus: 'cancelled', terminal: true },
  returned:          { orderStatus: 'cancelled', terminal: true },
  cancelled:         { orderStatus: 'cancelled', terminal: true },
  disposed:          { orderStatus: 'cancelled', terminal: true },
}

const STATUS_ORDER = ['pending', 'awaiting_payment', 'paid', 'processing', 'shipped', 'delivered']

// ─── Payload types ──────────────────────────────────────────────────────────

interface BiteshipStatusEvent {
  event: 'order.status'
  order_id: string
  status: string
  courier_waybill_id?: string
  courier_tracking_id?: string
  courier_company?: string
  courier_type?: string
  courier_driver_name?: string
  courier_driver_phone?: string
  courier_driver_photo_url?: string
  courier_driver_plate_number?: string
  courier_link?: string
  order_price?: number
}

interface BiteshipPriceEvent {
  event: 'order.price'
  order_id?: string
  status?: string
  // Biteship uses inconsistent field names across docs and production payloads.
  // Accept both variants; prefer the order_* version when both present.
  price?: number
  order_price?: number
  shippment_fee?: number       // note: typo is Biteship's, not ours
  order_shipment_fee?: number
  cash_on_delivery_fee?: number
  proof_of_delivery_fee?: number
  courier_waybill_id?: string
  courier_tracking_id?: string
}

interface BiteshipWaybillEvent {
  event: 'order.waybill_id'
  order_id: string
  status?: string
  courier_waybill_id?: string
  courier_tracking_id?: string
}

type BiteshipWebhookBody =
  | BiteshipStatusEvent
  | BiteshipPriceEvent
  | BiteshipWaybillEvent
  | (Record<string, unknown> & { order_id?: string; event?: string; status?: string })

interface OrderRow {
  id: string
  status: string
  metadata: Record<string, unknown> | null
  shipped_at: string | null
  delivered_at: string | null
}

// ─── Helpers ────────────────────────────────────────────────────────────────

let warnedMissingSecret = false

function verifySignature(request: NextRequest): boolean {
  const secret = process.env.BITESHIP_WEBHOOK_SECRET
  if (!secret) {
    if (!warnedMissingSecret) {
      console.warn('[webhook/biteship] BITESHIP_WEBHOOK_SECRET not set — accepting all webhooks (dev mode)')
      warnedMissingSecret = true
    }
    return true
  }
  // Biteship dashboard "Headers Signature Secret" — sent as a static token header.
  // Try common header names; reject if none match.
  const candidates = [
    request.headers.get('x-biteship-signature'),
    request.headers.get('x-callback-token'),
    request.headers.get('signature'),
  ]
  return candidates.some((h) => h && h === secret)
}

/**
 * Locate an order from a Biteship webhook payload.
 *
 * Strategy (2-tier, NEVER uses `order_id` — Biteship does NOT send `order_id`
 * in webhook body in production, even though test payloads in the Biteship
 * dashboard include it):
 *
 *   1. **Primary**: `shipping_tracking_number = courier_waybill_id` — handles
 *      the normal case where the waybill in the payload matches what's in DB.
 *
 *   2. **Fallback**: `metadata->biteship->>tracking_id = courier_tracking_id` —
 *      handles `order.waybill_id` events where Biteship re-allocates the
 *      courier and the waybill in the payload is DIFFERENT from the one
 *      stored in DB. `tracking_id` is Biteship's stable per-order identifier
 *      that does NOT change on re-allocation. Stored by storoengine at
 *      shipping order creation time (see storoengine shipping/orders route).
 */
async function findOrderByWaybillOrTracking(
  supabase: SupabaseClient,
  waybillId: string | undefined,
  trackingId: string | undefined,
): Promise<OrderRow | null> {
  // Primary: by waybill
  if (waybillId) {
    const { data, error } = await supabase
      .from('orders')
      .select('id, status, metadata, shipped_at, delivered_at')
      .eq('shipping_tracking_number', waybillId)
      .limit(1)

    if (error) {
      console.error('[webhook/biteship] DB query error (waybill):', error)
    } else if (data && data.length > 0) {
      return data[0] as OrderRow
    }
  }

  // Fallback: by Biteship tracking_id stored in metadata
  if (trackingId) {
    const { data, error } = await supabase
      .from('orders')
      .select('id, status, metadata, shipped_at, delivered_at')
      .eq('metadata->biteship->>tracking_id', trackingId)
      .limit(1)

    if (error) {
      console.error('[webhook/biteship] DB query error (tracking_id):', error)
      return null
    }
    if (data && data.length > 0) {
      console.log(`[webhook/biteship] Matched order via tracking_id fallback (waybill ${waybillId ?? 'null'} did not match)`)
      return data[0] as OrderRow
    }
  }

  return null
}

/**
 * Returns updateData fragments for status advancement, or empty object if status
 * should not change.
 *
 * - Terminal states (cancelled etc) apply from ANY current state — Biteship is
 *   the source of truth for cancellation. Only no-op if already in that terminal.
 * - Non-terminal states enforce monotonic progression (never move backward).
 */
function buildStatusAdvance(
  currentStatus: string,
  shipped_at: string | null,
  delivered_at: string | null,
  newBiteshipStatus: string | undefined,
): Record<string, unknown> {
  if (!newBiteshipStatus) return {}
  const mapping = STATUS_MAP[newBiteshipStatus]
  if (!mapping) {
    console.log(`[webhook/biteship] Unmapped status "${newBiteshipStatus}" — not auto-updating order status`)
    return {}
  }

  // Terminal states bypass monotonic check
  if (mapping.terminal) {
    if (currentStatus === mapping.orderStatus) return {}
    return { status: mapping.orderStatus }
  }

  const currentIdx = STATUS_ORDER.indexOf(currentStatus)
  const newIdx = STATUS_ORDER.indexOf(mapping.orderStatus)
  if (newIdx <= currentIdx) return {}

  const update: Record<string, unknown> = { status: mapping.orderStatus }
  if (mapping.setTimestamp === 'shipped_at' && !shipped_at) {
    update.shipped_at = new Date().toISOString()
  } else if (mapping.setTimestamp === 'delivered_at' && !delivered_at) {
    update.delivered_at = new Date().toISOString()
  }
  return update
}

function mergeBiteshipMeta(
  existing: Record<string, unknown> | null,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  const metadata = (existing ?? {}) as Record<string, unknown>
  const biteship = (metadata.biteship ?? {}) as Record<string, unknown>
  return {
    ...metadata,
    biteship: {
      ...biteship,
      ...patch,
      last_webhook_at: new Date().toISOString(),
    },
  }
}

// ─── Event handlers ─────────────────────────────────────────────────────────

async function handleStatusEvent(
  supabase: SupabaseClient,
  order: OrderRow,
  body: BiteshipStatusEvent,
): Promise<void> {
  const driver: Record<string, string> = {}
  if (body.courier_driver_name) driver.name = body.courier_driver_name
  if (body.courier_driver_phone) driver.phone = body.courier_driver_phone
  if (body.courier_driver_photo_url) driver.photo_url = body.courier_driver_photo_url
  if (body.courier_driver_plate_number) driver.plate_number = body.courier_driver_plate_number

  const biteshipPatch: Record<string, unknown> = {
    status: body.status,
  }
  if (Object.keys(driver).length > 0) biteshipPatch.driver = driver
  if (body.courier_link) biteshipPatch.courier_link = body.courier_link
  if (body.courier_company) biteshipPatch.courier_company = body.courier_company
  if (body.courier_type) biteshipPatch.courier_type = body.courier_type
  if (body.courier_waybill_id) biteshipPatch.waybill_id = body.courier_waybill_id
  if (body.courier_tracking_id) biteshipPatch.tracking_id = body.courier_tracking_id

  const updateData: Record<string, unknown> = {
    metadata: mergeBiteshipMeta(order.metadata, biteshipPatch),
  }

  if (body.courier_waybill_id) {
    updateData.shipping_tracking_number = body.courier_waybill_id
    updateData.shipping_tracking = body.courier_waybill_id
  }
  if (body.courier_company) {
    updateData.shipping_courier = body.courier_company
  }

  Object.assign(
    updateData,
    buildStatusAdvance(order.status, order.shipped_at, order.delivered_at, body.status),
  )

  const { error } = await supabase.from('orders').update(updateData).eq('id', order.id)
  if (error) {
    console.error('[webhook/biteship] Failed to update order (status event):', error)
    throw error
  }
  console.log(
    `[webhook/biteship] order ${order.id} status updated: biteship=${body.status}, order_status=${updateData.status ?? order.status}`,
  )
}

async function handlePriceEvent(
  supabase: SupabaseClient,
  order: OrderRow,
  body: BiteshipPriceEvent,
): Promise<void> {
  // Biteship uses inconsistent field names — accept both variants
  const priceTotal = body.order_price ?? body.price
  const shipmentFee = body.order_shipment_fee ?? body.shippment_fee

  const biteshipPatch: Record<string, unknown> = {}
  if (priceTotal !== undefined) biteshipPatch.price_total = priceTotal
  if (shipmentFee !== undefined) biteshipPatch.shipment_fee = shipmentFee
  if (body.cash_on_delivery_fee !== undefined) biteshipPatch.cash_on_delivery_fee = body.cash_on_delivery_fee
  if (body.proof_of_delivery_fee !== undefined) biteshipPatch.proof_of_delivery_fee = body.proof_of_delivery_fee
  if (body.status) biteshipPatch.status = body.status

  const updateData: Record<string, unknown> = {
    metadata: mergeBiteshipMeta(order.metadata, biteshipPatch),
  }

  // Canonical shipping cost: prefer shipment_fee (courier fee), fallback to total price
  const newShippingCost = shipmentFee ?? priceTotal
  if (newShippingCost !== undefined) {
    updateData.shipping_cost = newShippingCost
  }

  Object.assign(
    updateData,
    buildStatusAdvance(order.status, order.shipped_at, order.delivered_at, body.status),
  )

  const { error } = await supabase.from('orders').update(updateData).eq('id', order.id)
  if (error) {
    console.error('[webhook/biteship] Failed to update order (price event):', error)
    throw error
  }
  console.log(
    `[webhook/biteship] order ${order.id} price updated: shipping_cost=${newShippingCost}, total=${priceTotal}`,
  )
}

async function handleWaybillEvent(
  supabase: SupabaseClient,
  order: OrderRow,
  body: BiteshipWaybillEvent,
): Promise<void> {
  const biteshipPatch: Record<string, unknown> = {}
  if (body.courier_waybill_id) biteshipPatch.waybill_id = body.courier_waybill_id
  if (body.courier_tracking_id) biteshipPatch.tracking_id = body.courier_tracking_id
  if (body.status) biteshipPatch.status = body.status

  const updateData: Record<string, unknown> = {
    metadata: mergeBiteshipMeta(order.metadata, biteshipPatch),
  }

  if (body.courier_waybill_id) {
    updateData.shipping_tracking_number = body.courier_waybill_id
    updateData.shipping_tracking = body.courier_waybill_id
  }

  Object.assign(
    updateData,
    buildStatusAdvance(order.status, order.shipped_at, order.delivered_at, body.status),
  )

  const { error } = await supabase.from('orders').update(updateData).eq('id', order.id)
  if (error) {
    console.error('[webhook/biteship] Failed to update order (waybill event):', error)
    throw error
  }
  console.log(
    `[webhook/biteship] order ${order.id} waybill updated: ${body.courier_waybill_id}`,
  )
}

// ─── Route ──────────────────────────────────────────────────────────────────

/**
 * GET /api/webhooks/biteship
 * Health-check / installation probe. Biteship may GET this URL during webhook
 * installation to verify reachability. Always returns 200 OK.
 */
export async function GET() {
  return NextResponse.json({ status: 'ok' })
}

/**
 * POST /api/webhooks/biteship
 * Receives webhook events from Biteship: order.status, order.price, order.waybill_id.
 *
 * This is the CENTRAL platform webhook — Biteship sends all tracking events here
 * regardless of which client store the shipment belongs to. Orders are located
 * across all stores by matching shipping_tracking_number (waybill / nomor resi).
 *
 * Configure this URL in the Biteship dashboard:
 *   https://storo.id/api/webhooks/biteship
 *
 * During installation Biteship sends a validation ping with an empty body and
 * no signature header — we accept it with 200 OK so installation can succeed.
 * Once installed, real events MUST include a matching signature header.
 */
export async function POST(request: NextRequest) {
  try {
    // Read raw body first so we can detect Biteship's installation validation ping
    // (empty body, no signature). Real events have a JSON body.
    const rawBody = await request.text()
    if (!rawBody || rawBody.trim() === '' || rawBody.trim() === '{}') {
      console.log('[webhook/biteship] installation validation ping — replying ok')
      return NextResponse.json({ status: 'ok' })
    }

    if (!verifySignature(request)) {
      console.error('[webhook/biteship] Invalid or missing signature')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let body: BiteshipWebhookBody
    try {
      body = JSON.parse(rawBody) as BiteshipWebhookBody
    } catch (parseError) {
      console.error('[webhook/biteship] Invalid JSON body:', parseError)
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }
    console.log('[webhook/biteship] received', JSON.stringify(body))

    const waybillId = (body as { courier_waybill_id?: string }).courier_waybill_id
    const trackingId = (body as { courier_tracking_id?: string }).courier_tracking_id

    if (!waybillId && !trackingId) {
      console.warn('[webhook/biteship] Payload has no courier_waybill_id or courier_tracking_id — ignoring')
      return NextResponse.json({ status: 'ignored' })
    }

    const supabase = (await createSupabaseServiceClient()) as unknown as SupabaseClient
    const order = await findOrderByWaybillOrTracking(supabase, waybillId, trackingId)

    if (!order) {
      console.warn(
        `[webhook/biteship] Order not found (waybill=${waybillId ?? 'null'}, tracking_id=${trackingId ?? 'null'})`,
      )
      // Return 200 to prevent Biteship from retrying
      return NextResponse.json({ status: 'not_found' })
    }

    const event = body.event
    switch (event) {
      case 'order.status':
        await handleStatusEvent(supabase, order, body as BiteshipStatusEvent)
        break
      case 'order.price':
        await handlePriceEvent(supabase, order, body as BiteshipPriceEvent)
        break
      case 'order.waybill_id':
        await handleWaybillEvent(supabase, order, body as BiteshipWaybillEvent)
        break
      default:
        // Backward-compat: legacy payloads without an `event` field — assume order.status.
        if (typeof body.status === 'string') {
          console.log('[webhook/biteship] no event field, treating as order.status (legacy)')
          await handleStatusEvent(supabase, order, body as BiteshipStatusEvent)
        } else {
          console.warn('[webhook/biteship] unknown event type:', event)
        }
    }

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('[webhook/biteship] Unexpected error:', error)
    return NextResponse.json({ status: 'error' }, { status: 500 })
  }
}
