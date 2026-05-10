/**
 * JanaDhristi — Your District. Your Data. Your Right.
 * JanaDhristi — MIT License with Attribution.
 * https://github.com/Balasubramani2004/JanaDhristi
 */

import { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://janadhristi.in";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // General crawlers
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
      // AI crawlers — explicitly allowed for GEO visibility
      { userAgent: "GPTBot", allow: "/" },
      { userAgent: "ChatGPT-User", allow: "/" },
      { userAgent: "ClaudeBot", allow: "/" },
      { userAgent: "anthropic-ai", allow: "/" },
      { userAgent: "PerplexityBot", allow: "/" },
      { userAgent: "Google-Extended", allow: "/" },
      { userAgent: "Googlebot", allow: "/" },
      { userAgent: "Bingbot", allow: "/" },
      { userAgent: "cohere-ai", allow: "/" },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
