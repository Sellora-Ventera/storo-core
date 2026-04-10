import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Mapping Biteship order status → our order status.
 * Only statuses that should trigger an update are mapped.
 */
const STATUS_MAP: Record<string, { orderStatus: string; setTimestamp?: 'shipped_at' | 'delivered_at' }> = {
  confirmed:    { orderStatus: 'processing' },
  allocated:    { orderStatus: 'processing' },
  picking_up:   { orderStatus: 'processing' },
  picked:       { orderStatus: 'shipped', setTimestamp: 'shipped_at' },
  dropping_off: { orderStatus: 'shipped', setTimestamp: 'shipped_at' },
  delivered:    { orderStatus: 'delivered', setTimestamp: 'delivered_at' },
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
  order_id: string
  status?: string
  price?: number
  shippment_fee?: number
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

async function findOrderByBiteshipId(
  supabase: SupabaseClient,
  biteshipOrderId: string,
): Promise<OrderRow | null> {
  const { data, error } = await supabase
    .from('orders')
    .select('id, status, metadata, shipped_at, delivered_at')
    .filter('metadata->biteship->>order_id', 'eq', biteshipOrderId)
    .limit(1)

  if (error) {
    console.error('[webhook/biteship] DB query error:', error)
    return null
  }
  return data && data.length > 0 ? (data[0] as OrderRow) : null
}

/**
 * Returns updateData fragments for status advancement, or empty object if status
 * should not change. Enforces monotonic progression (never moves backward).
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
  const biteshipPatch: Record<string, unknown> = {}
  if (body.price !== undefined) biteshipPatch.price_total = body.price
  if (body.shippment_fee !== undefined) biteshipPatch.shipment_fee = body.shippment_fee
  if (body.cash_on_delivery_fee !== undefined) biteshipPatch.cash_on_delivery_fee = body.cash_on_delivery_fee
  if (body.proof_of_delivery_fee !== undefined) biteshipPatch.proof_of_delivery_fee = body.proof_of_delivery_fee
  if (body.status) biteshipPatch.status = body.status

  const updateData: Record<string, unknown> = {
    metadata: mergeBiteshipMeta(order.metadata, biteshipPatch),
  }

  // Use shippment_fee as canonical shipping_cost; fallback to price (total).
  const newShippingCost = body.shippment_fee ?? body.price
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
    `[webhook/biteship] order ${order.id} price updated: shipping_cost=${newShippingCost}, total=${body.price}`,
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
 * POST /api/webhooks/biteship
 * Receives webhook events from Biteship: order.status, order.price, order.waybill_id.
 *
 * This is the CENTRAL platform webhook — Biteship sends all tracking events here
 * regardless of which client store the shipment belongs to. Orders are located
 * across all stores by matching metadata->biteship->>order_id.
 *
 * Configure this URL in the Biteship dashboard:
 *   https://storo.id/api/webhooks/biteship
 *
 * If BITESHIP_WEBHOOK_SECRET is set, the request must include a matching
 * x-biteship-signature (or x-callback-token / signature) header.
 */
export async function POST(request: NextRequest) {
  try {
    if (!verifySignature(request)) {
      console.error('[webhook/biteship] Invalid or missing signature')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = (await request.json()) as BiteshipWebhookBody
    console.log('[webhook/biteship] received', JSON.stringify(body))

    const biteshipOrderId = body.order_id as string | undefined
    if (!biteshipOrderId) {
      console.warn('[webhook/biteship] Missing order_id in payload')
      return NextResponse.json({ status: 'ignored' })
    }

    const supabase = (await createSupabaseServiceClient()) as unknown as SupabaseClient
    const order = await findOrderByBiteshipId(supabase, biteshipOrderId)

    if (!order) {
      console.warn(`[webhook/biteship] No order found for Biteship order_id: ${biteshipOrderId}`)
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
