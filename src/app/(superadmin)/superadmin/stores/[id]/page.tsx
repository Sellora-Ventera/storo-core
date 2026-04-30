import { redirect, notFound } from "next/navigation";
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
} from "@/lib/supabase/server";
import Link from "next/link";
import {
  ArrowLeft,
  Store,
  User,
  Phone,
  Calendar,
  Globe,
  LayoutTemplate,
  UserCog,
  Upload,
  MessageSquare,
  FileText,
  Download,
  ExternalLink,
  Receipt,
  CheckCircle2,
  Clock,
  Loader2,
  AlertCircle,
  ShoppingBag,
  MapPin,
  MessageCircle,
  CreditCard,
  Package,
  Users,
  Archive,
} from "lucide-react";
import StatusUpdateForm from "@/components/dashboard/superadmin/StatusUpdateForm";
import { PLANS } from "@/lib/plans";

type StatusKey = "pending" | "reviewing" | "in_progress" | "live" | "rejected";

const STATUS_CONFIG: Record<
  StatusKey,
  { label: string; color: string; icon: typeof Clock; spin: boolean }
> = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock, spin: false },
  reviewing: { label: "Reviewing", color: "bg-blue-100 text-blue-700 border-blue-200", icon: Loader2, spin: true },
  in_progress: { label: "In Progress", color: "bg-orange-100 text-orange-700 border-orange-200", icon: Loader2, spin: true },
  live: { label: "Live", color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2, spin: false },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-700 border-red-200", icon: AlertCircle, spin: false },
};

const PLAN_NAME_MAP = Object.fromEntries(PLANS.map((p) => [p.id, p.name]));
const PLAN_SETUP_MAP = Object.fromEntries(PLANS.map((p) => [p.id, p.setup]));

const INVOICE_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: typeof Clock }
> = {
  paid: { label: "Lunas", color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2 },
  unpaid: { label: "Belum Bayar", color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock },
  overdue: { label: "Lewat Tempo", color: "bg-red-100 text-red-700 border-red-200", icon: AlertCircle },
  cancelled: { label: "Dibatalkan", color: "bg-gray-100 text-gray-600 border-gray-200", icon: AlertCircle },
};

const ORDER_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-gray-100 text-gray-700 border-gray-200" },
  awaiting_payment: { label: "Menunggu Bayar", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  paid: { label: "Dibayar", color: "bg-blue-100 text-blue-700 border-blue-200" },
  processing: { label: "Diproses", color: "bg-blue-100 text-blue-700 border-blue-200" },
  shipped: { label: "Dikirim", color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  delivered: { label: "Selesai", color: "bg-green-100 text-green-700 border-green-200" },
  cancelled: { label: "Dibatalkan", color: "bg-red-100 text-red-700 border-red-200" },
  refunded: { label: "Refund", color: "bg-gray-100 text-gray-600 border-gray-200" },
};

const formatDate = (value: string | null) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatDateTime = (value: string | null) => {
  if (!value) return "—";
  return new Date(value).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatIDR = (amount: number | null) => {
  if (amount == null) return "—";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
};

interface UploadedFile {
  name?: string;
  url?: string;
  size?: number;
}

export default async function StoreDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const authClient = await createSupabaseServerClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) redirect("/sign-in");
  const { id } = await params;

  // Service client supaya superadmin bisa lihat detail toko manapun (RLS
  // membatasi onboarding_requests/invoices/products/orders ke owner saja).
  const supabase = await createSupabaseServiceClient();

  const { data: store } = await supabase
    .from("onboarding_requests")
    .select(
      `id, status, plan, template_name, template_id, store_url, created_at, live_at, updated_at,
       requested_slug, custom_domain, status_note, assigned_engineer, files_uploaded, upload_method,
       client_id, store_id,
       clients(id, full_name, phone, user_id, shopee_store_name, shopee_store_link, address)`
    )
    .eq("id", id)
    .single();

  if (!store) notFound();

  const status = (store.status as StatusKey) ?? "pending";
  const statusCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const StatusIcon = statusCfg.icon;

  const client = store.clients as {
    id?: string;
    full_name?: string;
    phone?: string;
    user_id?: string;
    shopee_store_name?: string;
    shopee_store_link?: string;
    address?: string;
  } | null;

  const { data: invoice } = client?.id
    ? await supabase
        .from("invoices")
        .select("id, amount, status, paid_at, invoice_url, type, provider, due_date, created_at")
        .eq("client_id", client.id)
        .eq("type", "setup")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null };

  const storeId = store.store_id as string | null;

  const [productsResult, customersResult, ordersResult] = storeId
    ? await Promise.all([
        supabase
          .from("products")
          .select("id, name, price, stock, is_active, created_at", { count: "exact" })
          .eq("store_id", storeId)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("customers")
          .select("id, name, email, phone, total_orders, total_spent, created_at", { count: "exact" })
          .eq("store_id", storeId)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("orders")
          .select(
            "id, order_number, status, payment_status, total, created_at, customers(name, email)",
            { count: "exact" }
          )
          .eq("store_id", storeId)
          .order("created_at", { ascending: false })
          .limit(5),
      ])
    : [
        { data: null, count: 0 },
        { data: null, count: 0 },
        { data: null, count: 0 },
      ];

  const products = (productsResult.data ?? []) as Array<{
    id: string;
    name: string;
    price: number | null;
    stock: number | null;
    is_active: boolean | null;
    created_at: string;
  }>;
  const customers = (customersResult.data ?? []) as Array<{
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    total_orders: number | null;
    total_spent: number | null;
    created_at: string;
  }>;
  const orders = ((ordersResult.data ?? []) as unknown) as Array<{
    id: string;
    order_number: string;
    status: string;
    payment_status: string;
    total: number | null;
    created_at: string;
    customers: { name: string | null; email: string | null } | Array<{ name: string | null; email: string | null }> | null;
  }>;
  const productCount = productsResult.count ?? 0;
  const customerCount = customersResult.count ?? 0;
  const orderCount = ordersResult.count ?? 0;

  const planName = PLAN_NAME_MAP[store.plan] ?? store.plan ?? "—";
  const planSetup = PLAN_SETUP_MAP[store.plan] ?? null;
  const subdomainPreview = store.requested_slug ? `${store.requested_slug}.storo.id` : null;
  const storeName = store.requested_slug ?? store.custom_domain ?? client?.full_name ?? "Store";
  const waLink = client?.phone
    ? `https://wa.me/${client.phone.replace(/[^0-9]/g, "").replace(/^0/, "62")}`
    : null;

  const filesRaw = (store.files_uploaded ?? []) as unknown;
  const files: UploadedFile[] = Array.isArray(filesRaw) ? (filesRaw as UploadedFile[]) : [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back */}
      <Link
        href="/superadmin/stores"
        className="inline-flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Semua Store
      </Link>

      {/* Header */}
      <div className="bg-background border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4 min-w-0 flex-1">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
              <Store className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-foreground capitalize truncate">
                {storeName}
              </h1>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-100">
                  Paket {planName}
                </span>
                {store.template_name && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full border bg-muted text-foreground/70 border-border capitalize">
                    <LayoutTemplate className="w-3 h-3" />
                    {store.template_name}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 text-xs text-foreground/60">
                  <Calendar className="w-3.5 h-3.5" />
                  Didaftar {formatDate(store.created_at)}
                </span>
                {store.updated_at && store.updated_at !== store.created_at && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-foreground/40">
                    · Update terakhir {formatDateTime(store.updated_at)}
                  </span>
                )}
              </div>
              <p className="text-xs text-foreground/40 font-mono mt-2 truncate">
                ID: {store.id}
              </p>
            </div>
          </div>
          <span className={`inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-full border flex-shrink-0 ${statusCfg.color}`}>
            <StatusIcon className={`w-4 h-4 ${statusCfg.spin ? "animate-spin" : ""}`} />
            {statusCfg.label}
          </span>
        </div>
      </div>

      {/* Info Grid: Store + Client */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Store Info */}
        <div className="bg-background border border-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-xs font-semibold text-foreground/60 uppercase tracking-wide mb-5 flex items-center gap-2">
            <Store className="w-3.5 h-3.5" />
            Informasi Store
          </h2>
          <dl className="space-y-4">
            <InfoRow icon={Receipt} label="Paket">
              {planName}
              {planSetup != null && (
                <span className="text-foreground/40 text-xs font-normal ml-2">
                  · setup {formatIDR(planSetup)}
                </span>
              )}
            </InfoRow>
            <InfoRow icon={LayoutTemplate} label="Template">
              {store.template_name ? (
                <span className="capitalize">{store.template_name}</span>
              ) : (
                <span className="text-foreground/40 italic">Belum ditentukan</span>
              )}
            </InfoRow>
            <InfoRow icon={Globe} label="Subdomain">
              {subdomainPreview ?? <span className="text-foreground/40 italic">—</span>}
            </InfoRow>
            <InfoRow icon={Globe} label="Custom Domain">
              {store.custom_domain ?? <span className="text-foreground/40 italic">Tidak ada</span>}
            </InfoRow>
            <InfoRow icon={ExternalLink} label="URL Live">
              {store.store_url ? (
                <a
                  href={store.store_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-mono text-xs truncate block"
                >
                  {store.store_url}
                </a>
              ) : (
                <span className="text-foreground/40 italic">Belum di-deploy</span>
              )}
            </InfoRow>
            <InfoRow icon={UserCog} label="Engineer">
              {store.assigned_engineer ?? (
                <span className="text-foreground/40 italic">Belum di-assign</span>
              )}
            </InfoRow>
            <InfoRow icon={store.upload_method === "whatsapp" ? MessageSquare : Upload} label="Metode Upload">
              {store.upload_method === "whatsapp" ? "Via WhatsApp" : "Via Platform"}
            </InfoRow>
            {store.live_at && (
              <InfoRow icon={CheckCircle2} label="Go-live">
                <span className="text-green-600 font-medium">{formatDate(store.live_at)}</span>
              </InfoRow>
            )}
          </dl>
        </div>

        {/* Client Info */}
        <div className="bg-background border border-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-xs font-semibold text-foreground/60 uppercase tracking-wide mb-5 flex items-center gap-2">
            <User className="w-3.5 h-3.5" />
            Informasi Klien
          </h2>
          <dl className="space-y-4">
            <InfoRow icon={User} label="Nama">
              {client?.full_name ?? <span className="text-foreground/40 italic">—</span>}
            </InfoRow>
            <InfoRow icon={Phone} label="WhatsApp">
              {client?.phone ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono">{client.phone}</span>
                  {waLink && (
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium cursor-pointer"
                    >
                      <MessageCircle className="w-3 h-3" />
                      Chat
                    </a>
                  )}
                </div>
              ) : (
                <span className="text-foreground/40 italic">—</span>
              )}
            </InfoRow>
            <InfoRow icon={ShoppingBag} label="Shopee">
              {client?.shopee_store_link ? (
                <a
                  href={client.shopee_store_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-xs truncate block"
                >
                  {client.shopee_store_name ?? client.shopee_store_link}
                </a>
              ) : (
                <span className="text-foreground/40 italic">Belum terhubung</span>
              )}
            </InfoRow>
            {client?.address && (
              <InfoRow icon={MapPin} label="Alamat">
                <span className="text-xs">{client.address}</span>
              </InfoRow>
            )}
            <InfoRow icon={User} label="User ID">
              <span className="text-xs text-foreground/40 font-mono truncate block">
                {client?.user_id ?? "—"}
              </span>
            </InfoRow>
          </dl>
        </div>
      </div>

      {/* Invoice */}
      {invoice && (
        <div className="bg-background border border-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-xs font-semibold text-foreground/60 uppercase tracking-wide mb-4 flex items-center gap-2">
            <CreditCard className="w-3.5 h-3.5" />
            Invoice Setup
          </h2>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-4 min-w-0 flex-1">
              <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Receipt className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground text-lg">{formatIDR(invoice.amount)}</p>
                <p className="text-xs text-foreground/60 mt-0.5">
                  Provider: <span className="font-mono">{invoice.provider}</span>
                </p>
                {invoice.paid_at && (
                  <p className="text-xs text-foreground/40 mt-0.5">
                    Dibayar {formatDateTime(invoice.paid_at)}
                  </p>
                )}
                {!invoice.paid_at && invoice.due_date && (
                  <p className="text-xs text-foreground/40 mt-0.5">
                    Jatuh tempo {formatDate(invoice.due_date)}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {(() => {
                const invCfg = INVOICE_STATUS_CONFIG[invoice.status] ?? INVOICE_STATUS_CONFIG.unpaid;
                const InvIcon = invCfg.icon;
                return (
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${invCfg.color}`}>
                    <InvIcon className="w-3.5 h-3.5" />
                    {invCfg.label}
                  </span>
                );
              })()}
              {invoice.invoice_url && (
                <a
                  href={invoice.invoice_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground/60 hover:text-foreground cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Buka Invoice
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Store Activity: Produk, Pelanggan, Pesanan */}
      {storeId ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Aktivitas Toko</h2>
            <span className="text-xs text-foreground/40 font-mono truncate max-w-[60%]">
              store_id: {storeId}
            </span>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {/* Produk */}
            <div className="bg-background border border-border rounded-2xl p-6 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Package className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">Produk</h3>
                </div>
                <span className="text-2xl font-bold text-foreground">{productCount}</span>
              </div>
              {products.length > 0 ? (
                <ul className="space-y-2 flex-1">
                  {products.map((p) => (
                    <li key={p.id} className="flex items-start justify-between gap-3 py-2 border-b border-border last:border-0">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                        <p className="text-xs text-foreground/40 mt-0.5">
                          Stok: {p.stock ?? 0}
                          {p.is_active === false && (
                            <span className="ml-2 text-red-500">· Nonaktif</span>
                          )}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-foreground/70 flex-shrink-0">
                        {formatIDR(p.price)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-foreground/40 italic flex-1 flex items-center">Belum ada produk</p>
              )}
            </div>

            {/* Pelanggan */}
            <div className="bg-background border border-border rounded-2xl p-6 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-emerald-600" />
                  </div>
                  <h3 className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">Pelanggan</h3>
                </div>
                <span className="text-2xl font-bold text-foreground">{customerCount}</span>
              </div>
              {customers.length > 0 ? (
                <ul className="space-y-2 flex-1">
                  {customers.map((c) => (
                    <li key={c.id} className="flex items-start justify-between gap-3 py-2 border-b border-border last:border-0">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {c.name ?? c.email ?? "—"}
                        </p>
                        <p className="text-xs text-foreground/40 mt-0.5 truncate">
                          {c.total_orders ?? 0} pesanan
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-foreground/70 flex-shrink-0">
                        {formatIDR(c.total_spent)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-foreground/40 italic flex-1 flex items-center">Belum ada pelanggan</p>
              )}
            </div>

            {/* Pesanan */}
            <div className="bg-background border border-border rounded-2xl p-6 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-orange-50 rounded-lg flex items-center justify-center">
                    <Archive className="w-4 h-4 text-orange-600" />
                  </div>
                  <h3 className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">Pesanan</h3>
                </div>
                <span className="text-2xl font-bold text-foreground">{orderCount}</span>
              </div>
              {orders.length > 0 ? (
                <ul className="space-y-2 flex-1">
                  {orders.map((o) => {
                    const customer = Array.isArray(o.customers) ? o.customers[0] : o.customers;
                    const orderCfg = ORDER_STATUS_CONFIG[o.status] ?? ORDER_STATUS_CONFIG.pending;
                    return (
                      <li key={o.id} className="py-2 border-b border-border last:border-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground truncate font-mono">
                              {o.order_number}
                            </p>
                            <p className="text-xs text-foreground/40 mt-0.5 truncate">
                              {customer?.name ?? customer?.email ?? "Guest"}
                            </p>
                          </div>
                          <span className="text-xs font-semibold text-foreground/70 flex-shrink-0">
                            {formatIDR(o.total)}
                          </span>
                        </div>
                        <span className={`mt-1.5 inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full border ${orderCfg.color}`}>
                          {orderCfg.label}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-xs text-foreground/40 italic flex-1 flex items-center">Belum ada pesanan</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-muted border border-border rounded-2xl p-5 text-center">
          <p className="text-xs text-foreground/60">
            Aktivitas toko (produk, pelanggan, pesanan) akan muncul setelah toko di-provisioning di storoengine.
          </p>
        </div>
      )}

      {/* Files uploaded */}
      {files.length > 0 && (
        <div className="bg-background border border-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-xs font-semibold text-foreground/60 uppercase tracking-wide mb-4 flex items-center gap-2">
            <FileText className="w-3.5 h-3.5" />
            File Upload dari Klien ({files.length})
          </h2>
          <div className="space-y-2">
            {files.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-3 p-3 border border-border rounded-xl hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-foreground/60" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {file.name ?? `File ${idx + 1}`}
                    </p>
                    {file.size != null && (
                      <p className="text-xs text-foreground/40">{(file.size / 1024).toFixed(1)} KB</p>
                    )}
                  </div>
                </div>
                {file.url && (
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 cursor-pointer flex-shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current status note (read-only highlight) */}
      {store.status_note && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
          <h2 className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-2">
            Catatan Saat Ini (dilihat klien)
          </h2>
          <p className="text-sm text-amber-900 whitespace-pre-wrap">{store.status_note}</p>
        </div>
      )}

      {/* Status Update Form */}
      <div className="bg-background border border-border rounded-2xl p-6 shadow-sm">
        <h2 className="font-semibold text-foreground mb-1">Update Status Store</h2>
        <p className="text-xs text-foreground/60 mb-5">
          Perubahan akan langsung terlihat di dashboard klien.
          Set ke <strong>Live</strong> akan mengirim notifikasi otomatis + auto-stamp tanggal go-live.
        </p>
        <StatusUpdateForm
          storeId={store.id}
          currentStatus={store.status ?? "pending"}
          currentStatusNote={store.status_note ?? ""}
          currentAssignedEngineer={store.assigned_engineer ?? ""}
          currentStoreUrl={store.store_url ?? ""}
        />
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Clock;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-xs text-foreground/60 flex items-center gap-1.5 flex-shrink-0 pt-0.5">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </dt>
      <dd className="text-sm font-medium text-foreground text-right min-w-0 max-w-[65%]">
        {children}
      </dd>
    </div>
  );
}
