"use client";

import { useState, useEffect, useCallback } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Package,
  Plus,
  X,
  Loader2,
  ShoppingBag,
  ImageIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  description: string | null;
  image_url: string | null;
  created_at: string;
}

function formatIDR(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function ProductsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [hasLiveStore, setHasLiveStore] = useState<boolean | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const fetchProducts = useCallback(async (sid: string) => {
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase
      .from("products")
      .select("id, name, price, stock, description, image_url, created_at")
      .eq("store_id", sid)
      .order("created_at", { ascending: false });
    setProducts(data ?? []);
  }, []);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/sign-in");
        return;
      }
      setUserId(user.id);

      const { data: client } = await supabase
        .from("clients")
        .select("id")
        .eq("clerk_user_id", user.id)
        .single();

      if (!client) {
        setHasLiveStore(false);
        setLoading(false);
        return;
      }
      setClientId(client.id);

      // Find live store
      const { data: liveRequest } = await supabase
        .from("onboarding_requests")
        .select("id, store_id")
        .eq("client_id", client.id)
        .eq("status", "live")
        .single();

      if (!liveRequest || !liveRequest.store_id) {
        setHasLiveStore(false);
        setLoading(false);
        return;
      }

      setHasLiveStore(true);
      setStoreId(liveRequest.store_id);
      await fetchProducts(liveRequest.store_id);
      setLoading(false);
    }

    init();
  }, [router, fetchProducts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId || !userId) return;

    setSubmitting(true);
    setError(null);

    const supabase = getSupabaseBrowserClient();
    const { error: insertError } = await supabase.from("products").insert({
      name,
      price: parseInt(price, 10),
      stock: parseInt(stock, 10),
      description: description || null,
      image_url: imageUrl || null,
      store_id: storeId,
      created_by: userId,
    });

    if (insertError) {
      setError(insertError.message);
      setSubmitting(false);
      return;
    }

    setSuccess(true);
    setName("");
    setPrice("");
    setStock("");
    setDescription("");
    setImageUrl("");
    setShowForm(false);
    setSubmitting(false);

    await fetchProducts(storeId);
    setTimeout(() => setSuccess(false), 3000);
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produk Saya</h1>
          <p className="text-gray-500 mt-1">Kelola katalog produk toko Anda.</p>
        </div>
        {hasLiveStore && (
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-primary hover:bg-primary/90 text-white cursor-pointer"
          >
            {showForm ? (
              <>
                <X className="w-4 h-4 mr-2" />
                Batal
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Tambah Produk
              </>
            )}
          </Button>
        )}
      </div>

      {/* Success toast */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-700 text-sm font-medium">
          Produk berhasil ditambahkan!
        </div>
      )}

      {/* No live store */}
      {!hasLiveStore && (
        <div className="bg-white border border-gray-100 rounded-2xl p-12 shadow-sm text-center">
          <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Toko belum aktif</h2>
          <p className="text-gray-500 text-sm max-w-sm mx-auto">
            Produk hanya dapat ditambahkan setelah toko Anda aktif. Selesaikan proses onboarding terlebih dahulu.
          </p>
        </div>
      )}

      {/* Add product form */}
      {hasLiveStore && showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Form Tambah Produk
          </h2>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="name">Nama Produk</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Kaos Polos Premium"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="price">Harga (IDR)</Label>
              <Input
                id="price"
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="75000"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="stock">Stok</Label>
              <Input
                id="stock"
                type="number"
                min={0}
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="100"
                required
              />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Deskripsi singkat produk..."
                rows={3}
              />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="image_url">URL Gambar</Label>
              <Input
                id="image_url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowForm(false)}
              className="cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-primary hover:bg-primary/90 text-white cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Produk"
              )}
            </Button>
          </div>
        </form>
      )}

      {/* Product list */}
      {hasLiveStore && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Daftar Produk {products.length > 0 && `(${products.length})`}
          </h2>

          {products.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-2xl p-12 shadow-sm text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-base font-semibold text-gray-900 mb-1">Belum ada produk</h3>
              <p className="text-gray-500 text-sm">
                Klik "Tambah Produk" untuk menambahkan produk pertama Anda.
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  {product.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-40 object-cover rounded-xl mb-3 bg-gray-50"
                    />
                  ) : (
                    <div className="w-full h-40 bg-gray-50 rounded-xl mb-3 flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-gray-300" />
                    </div>
                  )}
                  <h3 className="font-semibold text-gray-900 text-sm mb-1 truncate">{product.name}</h3>
                  <p className="text-primary font-bold text-base mb-2">{formatIDR(product.price)}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Stok: {product.stock}</span>
                    <span>
                      {new Date(product.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  {product.description && (
                    <p className="text-xs text-gray-500 mt-2 line-clamp-2">{product.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
