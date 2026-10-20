/**
 * JanaDhristi — Your District. Your Data. Your Right.
 * JanaDhristi — MIT License with Attribution.
 * https://github.com/Balasubramani2004/JanaDhristi
 */

import { MetadataRoute } from "next";

/** Web app manifest: icons come from Next metadata routes `src/app/icon.tsx` and `apple-icon.tsx` (no PNGs in /public). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "JanaDhristi",
    short_name: "JanaDhristi",
    description: "Your District. Your Data. Your Right.",
    start_url: "/",
    display: "standalone",
    background_color: "#f1f5f9",
    theme_color: "#0f766e",
    orientation: "portrait-primary",
    categories: ["government", "news", "utilities"],
    lang: "en-IN",
    dir: "ltr",
    scope: "/",
    prefer_related_applications: false,
  };
}
