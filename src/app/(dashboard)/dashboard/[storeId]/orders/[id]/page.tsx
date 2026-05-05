import { ArrowLeft, MapPin, User, Package } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStoreForUser } from "@/lib/store/context";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import {
  StorePageHeader,
  StoreCard,
  StatusBadge,
  ChipButton,
  formatIDR,
  formatDate,
} from "@/components/dashboard/store/ui";

const STATUS_TONE: Record<string, "success" | "danger" | "warning" | "info" | "neutral"> = {
  pending: "warning",
  awaiting_payment: "warning",
  paid: "info",
  processing: "info",
  shipped: "success",
  delivered: "success",
  cancelled: "danger",
  refunded: "neutral",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  awaiting_payment: "Menunggu Pembayaran",
  paid: "Dibayar",
  processing: "Diproses",
  shipped: "Dikirim",
  delivered: "Selesai",
  cancelled: "Dibatalkan",
  refunded: "Dikembalikan",
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ storeId: string; id: string }>;
}) {
  const { storeId, id } = await params;
  await getStoreForUser(storeId);

  const supabase = await createSupabaseServiceClient();
  const { data: order } = await supabase
    .from("orders")
    .select(
      `id, order_number, status, customer_name, customer_email, customer_phone,
       subtotal, shipping_cost, discount, tax, total_amount, payment_method, payment_status,
       shipping_address, shipping_method, shipping_tracking_number, shipping_courier,
       notes, created_at, updated_at, shipped_at, delivered_at,
       order_items(id, product_id, product_name, variant_name, sku, quantity, unit_price, subtotal, image_url)`
    )
    .eq("id", id)
    .eq("store_id", storeId)
    .maybeSingle();

  if (!order) notFound();

  const items =
    (order.order_items as
      | {
          id: string;
          product_id: string | null;
          product_name: string;
          variant_name: string | null;
          sku: string | null;
          quantity: number;
          unit_price: number;
          subtotal: number;
          image_url: string | null;
        }[]
      | null) ?? [];

  const shippingAddr =
    typeof order.shipping_address === "object" && order.shipping_address !== null
      ? (order.shipping_address as Record<string, string | undefined>)
      : null;

  return (
    <div>
      <StorePageHeader
        title={order.order_number ?? `Pesanan #${id.slice(0, 8)}`}
        description={`Dipesan ${formatDate(order.created_at as string)}`}
        actions={
          <ChipButton
            href={`/dashboard/${storeId}/orders`}
            variant="default"
            icon={<ArrowLeft className="size-3.5" />}
          >
            Kembali
          </ChipButton>
        }
      />

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <StoreCard>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-[#0F172A]">Item Pesanan</h2>
              <StatusBadge tone={STATUS_TONE[order.status as string] ?? "neutral"}>
                {STATUS_LABEL[order.status as string] ?? (order.status as string)}
              </StatusBadge>
            </div>
            <div className="divide-y divide-[#F1F4FA]">
              {items.map((it) => (
                <div key={it.id} className="flex items-start gap-3 py-3">
                  {it.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={it.image_url}
                      alt=""
                      className="w-14 h-14 object-cover rounded-lg border border-[#E5E8EF]"
                    />
                  ) : (
                    <div className="w-14 h-14 bg-[#F1F4FA] rounded-lg border border-[#E5E8EF] grid place-items-center">
                      <Package className="size-5 text-[#94A3B8]" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0F172A] line-clamp-1">
                      {it.product_name}
                    </p>
                    {it.variant_name ? (
                      <p className="text-xs text-[#64748B]">{it.variant_name}</p>
                    ) : null}
                    {it.sku ? (
                      <p className="text-[11px] font-mono text-[#94A3B8]">SKU: {it.sku}</p>
                    ) : null}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-[#64748B]">
                      {it.quantity} × {formatIDR(it.unit_price)}
                    </p>
                    <p className="text-sm font-semibold text-[#0F172A] tabular-nums">
                      {formatIDR(it.subtotal)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-[#F1F4FA] pt-4 mt-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-[#64748B]">
                <span>Subtotal</span>
                <span className="tabular-nums">{formatIDR(order.subtotal as number)}</span>
              </div>
              {Number(order.shipping_cost) > 0 ? (
                <div className="flex justify-between text-[#64748B]">
                  <span>Ongkir</span>
                  <span className="tabular-nums">{formatIDR(order.shipping_cost as number)}</span>
                </div>
              ) : null}
              {Number(order.discount) > 0 ? (
                <div className="flex justify-between text-emerald-700">
                  <span>Diskon</span>
                  <span className="tabular-nums">- {formatIDR(order.discount as number)}</span>
                </div>
              ) : null}
              {Number(order.tax) > 0 ? (
                <div className="flex justify-between text-[#64748B]">
                  <span>Pajak</span>
                  <span className="tabular-nums">{formatIDR(order.tax as number)}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-[#0F172A] font-bold pt-2 border-t border-[#F1F4FA]">
                <span>Total</span>
                <span className="tabular-nums">{formatIDR(order.total_amount as number)}</span>
              </div>
            </div>
          </StoreCard>

          {order.notes ? (
            <StoreCard>
              <h2 className="text-sm font-semibold text-[#0F172A] mb-2">Catatan Pelanggan</h2>
              <p className="text-sm text-[#64748B] whitespace-pre-wrap">{order.notes as string}</p>
            </StoreCard>
          ) : null}
        </div>

        <div className="space-y-5">
          <StoreCard>
            <div className="flex items-center gap-2 mb-3">
              <User className="size-4 text-[#64748B]" />
              <h2 className="text-sm font-semibold text-[#0F172A]">Pelanggan</h2>
            </div>
            <p className="text-sm font-medium text-[#0F172A]">
              {order.customer_name ?? "—"}
            </p>
            {order.customer_email ? (
              <p className="text-xs text-[#64748B] mt-0.5">{order.customer_email as string}</p>
            ) : null}
            {order.customer_phone ? (
              <p className="text-xs text-[#64748B]">{order.customer_phone as string}</p>
            ) : null}
          </StoreCard>

          <StoreCard>
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="size-4 text-[#64748B]" />
              <h2 className="text-sm font-semibold text-[#0F172A]">Alamat Kirim</h2>
            </div>
            {shippingAddr ? (
              <div className="text-sm text-[#0F172A] space-y-0.5">
                <p>{shippingAddr.recipient_name ?? shippingAddr.name ?? "—"}</p>
                <p className="text-[#64748B]">{shippingAddr.phone ?? ""}</p>
                <p className="text-[#64748B]">{shippingAddr.address ?? ""}</p>
                <p className="text-[#64748B]">
                  {[
                    shippingAddr.subdistrict,
                    shippingAddr.city,
                    shippingAddr.province,
                    shippingAddr.postal_code,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>
            ) : (
              <p className="text-sm text-[#94A3B8]">Tidak ada alamat tersedia.</p>
            )}
          </StoreCard>

          <StoreCard>
            <h2 className="text-sm font-semibold text-[#0F172A] mb-3">Pengiriman</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-[#64748B]">Kurir</dt>
                <dd className="text-[#0F172A] text-right">
                  {order.shipping_courier ?? "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[#64748B]">Layanan</dt>
                <dd className="text-[#0F172A] text-right">
                  {order.shipping_method ?? "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[#64748B]">Resi</dt>
                <dd className="text-[#0F172A] font-mono text-xs text-right">
                  {order.shipping_tracking_number ?? "—"}
                </dd>
              </div>
              {order.shipped_at ? (
                <div className="flex justify-between gap-2">
                  <dt className="text-[#64748B]">Dikirim</dt>
                  <dd className="text-[#0F172A] text-right">
                    {formatDate(order.shipped_at as string)}
                  </dd>
                </div>
              ) : null}
              {order.delivered_at ? (
                <div className="flex justify-between gap-2">
                  <dt className="text-[#64748B]">Diterima</dt>
                  <dd className="text-[#0F172A] text-right">
                    {formatDate(order.delivered_at as string)}
                  </dd>
                </div>
              ) : null}
            </dl>
          </StoreCard>

          <StoreCard>
            <h2 className="text-sm font-semibold text-[#0F172A] mb-3">Pembayaran</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-[#64748B]">Metode</dt>
                <dd className="text-[#0F172A] text-right">{order.payment_method ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[#64748B]">Status</dt>
                <dd>
                  <StatusBadge
                    tone={
                      order.payment_status === "paid"
                        ? "success"
                        : order.payment_status === "failed"
                        ? "danger"
                        : "warning"
                    }
                  >
                    {(order.payment_status as string) ?? "—"}
                  </StatusBadge>
                </dd>
              </div>
            </dl>
          </StoreCard>
        </div>
      </div>
    </div>
  );
}
