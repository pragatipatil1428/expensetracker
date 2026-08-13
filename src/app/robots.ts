import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.AUTH_URL ?? "http://localhost:3000";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard", "/transactions", "/budgets", "/categories", "/recurring", "/analytics", "/reports", "/settings", "/profile"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
