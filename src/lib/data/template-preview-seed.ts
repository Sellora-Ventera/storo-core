/**
 * Hardcoded dummy data for template preview deployments.
 * Used by template-seeder.ts to populate Supabase with sample products,
 * categories, and banners under a dedicated preview store_id.
 */

export interface DummyCategory {
  name: string;
  slug: string;
  description: string;
  sort_order: number;
}

export interface DummyProduct {
  name: string;
  slug: string;
  description: string;
  short_description: string;
  price: number;
  compare_at_price?: number;
  stock: number;
  sku: string;
  category_slug: string;
  images: string[];
}

export interface DummyBanner {
  title: string;
  subtitle: string;
  image_url: string;
  link_url: string;
  sort_order: number;
}

export const DUMMY_CATEGORIES: DummyCategory[] = [
  {
    name: "Pakaian",
    slug: "pakaian",
    description: "Koleksi pakaian terbaru",
    sort_order: 1,
  },
  {
    name: "Aksesoris",
    slug: "aksesoris",
    description: "Aksesoris fashion pilihan",
    sort_order: 2,
  },
  {
    name: "Sepatu",
    slug: "sepatu",
    description: "Sepatu pria & wanita",
    sort_order: 3,
  },
];

const PLACEHOLDER_IMG = (seed: string) =>
  `https://picsum.photos/seed/${encodeURIComponent(seed)}/800/800`;

export const DUMMY_PRODUCTS: DummyProduct[] = [
  {
    name: "Kemeja Linen Premium",
    slug: "kemeja-linen-premium",
    description: "Kemeja linen berkualitas tinggi dengan potongan modern. Cocok untuk acara santai maupun semi-formal.",
    short_description: "Kemeja linen modern, breathable, dan stylish",
    price: 285000,
    compare_at_price: 350000,
    stock: 50,
    sku: "DEMO-KMJ-001",
    category_slug: "pakaian",
    images: [PLACEHOLDER_IMG("kemeja-1"), PLACEHOLDER_IMG("kemeja-2")],
  },
  {
    name: "Celana Chino Slim Fit",
    slug: "celana-chino-slim-fit",
    description: "Celana chino dengan potongan slim fit yang menyempurnakan penampilan.",
    short_description: "Chino slim fit nyaman dipakai harian",
    price: 195000,
    stock: 75,
    sku: "DEMO-CEL-002",
    category_slug: "pakaian",
    images: [PLACEHOLDER_IMG("chino-1")],
  },
  {
    name: "Dress Casual Bunga",
    slug: "dress-casual-bunga",
    description: "Dress casual dengan motif bunga yang feminim dan elegant.",
    short_description: "Dress feminim untuk hari santai",
    price: 245000,
    compare_at_price: 320000,
    stock: 40,
    sku: "DEMO-DRS-003",
    category_slug: "pakaian",
    images: [PLACEHOLDER_IMG("dress-1"), PLACEHOLDER_IMG("dress-2")],
  },
  {
    name: "Tas Selempang Kanvas",
    slug: "tas-selempang-kanvas",
    description: "Tas selempang berbahan kanvas tebal dengan banyak kompartemen.",
    short_description: "Tas kanvas multifungsi",
    price: 175000,
    stock: 60,
    sku: "DEMO-TAS-004",
    category_slug: "aksesoris",
    images: [PLACEHOLDER_IMG("tas-1")],
  },
  {
    name: "Topi Bucket Vintage",
    slug: "topi-bucket-vintage",
    description: "Topi bucket dengan desain vintage yang sedang trending.",
    short_description: "Topi bucket trending",
    price: 89000,
    stock: 100,
    sku: "DEMO-TPI-005",
    category_slug: "aksesoris",
    images: [PLACEHOLDER_IMG("topi-1")],
  },
  {
    name: "Jam Tangan Klasik",
    slug: "jam-tangan-klasik",
    description: "Jam tangan dengan desain klasik dan strap kulit asli.",
    short_description: "Jam tangan klasik dengan strap kulit",
    price: 425000,
    compare_at_price: 550000,
    stock: 30,
    sku: "DEMO-JAM-006",
    category_slug: "aksesoris",
    images: [PLACEHOLDER_IMG("jam-1"), PLACEHOLDER_IMG("jam-2")],
  },
  {
    name: "Sneakers Putih Klasik",
    slug: "sneakers-putih-klasik",
    description: "Sneakers putih klasik yang cocok untuk berbagai outfit.",
    short_description: "Sneakers putih timeless",
    price: 385000,
    stock: 45,
    sku: "DEMO-SPT-007",
    category_slug: "sepatu",
    images: [PLACEHOLDER_IMG("sepatu-1"), PLACEHOLDER_IMG("sepatu-2")],
  },
  {
    name: "Sandal Slip-On Casual",
    slug: "sandal-slip-on-casual",
    description: "Sandal slip-on yang nyaman untuk dipakai sehari-hari.",
    short_description: "Sandal nyaman dan ringan",
    price: 145000,
    stock: 80,
    sku: "DEMO-SDL-008",
    category_slug: "sepatu",
    images: [PLACEHOLDER_IMG("sandal-1")],
  },
  {
    name: "Boots Kulit Premium",
    slug: "boots-kulit-premium",
    description: "Boots kulit premium dengan kualitas terbaik.",
    short_description: "Boots kulit premium tahan lama",
    price: 685000,
    compare_at_price: 850000,
    stock: 20,
    sku: "DEMO-BOT-009",
    category_slug: "sepatu",
    images: [PLACEHOLDER_IMG("boots-1"), PLACEHOLDER_IMG("boots-2")],
  },
  {
    name: "Kalung Liontin Minimalis",
    slug: "kalung-liontin-minimalis",
    description: "Kalung dengan liontin desain minimalis yang elegan.",
    short_description: "Kalung minimalis elegant",
    price: 125000,
    stock: 65,
    sku: "DEMO-KAL-010",
    category_slug: "aksesoris",
    images: [PLACEHOLDER_IMG("kalung-1")],
  },
];

export const DUMMY_BANNERS: DummyBanner[] = [
  {
    title: "Koleksi Musim Baru",
    subtitle: "Diskon hingga 30% untuk produk pilihan",
    image_url: PLACEHOLDER_IMG("banner-1"),
    link_url: "/products",
    sort_order: 1,
  },
  {
    title: "Free Ongkir Jabodetabek",
    subtitle: "Pembelian minimum Rp 200rb",
    image_url: PLACEHOLDER_IMG("banner-2"),
    link_url: "/products",
    sort_order: 2,
  },
];
