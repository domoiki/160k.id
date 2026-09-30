import type { MetadataRoute } from "next";
import { products, site } from "@/lib/content";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes = ["", "/products", "/api", "/about", "/contact"];

  return [
    ...routes.map((r) => ({
      url: `${site.url}${r}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: r === "" ? 1 : 0.8,
    })),
    ...products.map((p) => ({
      url: `${site.url}${p.href}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
