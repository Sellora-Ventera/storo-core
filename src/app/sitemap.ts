import type { MetadataRoute } from "next";

const BASE_URL = "https://storo.id";

// Blog post IDs from the hardcoded list (1–20)
const blogPostIds = Array.from({ length: 20 }, (_, i) => i + 1);

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];

  const blogRoutes: MetadataRoute.Sitemap = blogPostIds.map((id) => ({
    url: `${BASE_URL}/blog/${id}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...blogRoutes];
}
