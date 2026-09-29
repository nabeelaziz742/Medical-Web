import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://saadmedicalstore.com";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/admin/*",
        "/account",
        "/account/*",
        "/checkout",
        "/checkout/*",
        "/api",
        "/api/*",
        "/orders",
        "/orders/*",
        "/forgot-password",
        "/reset-password",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
