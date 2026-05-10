/**
 * JanaDhristi — Your District. Your Data. Your Right.
 * JanaDhristi — MIT License with Attribution.
 * https://github.com/Balasubramani2004/JanaDhristi
 */

import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "kn", "hi"],   // English + Kannada + Hindi
  defaultLocale: "en",
  localePrefix: "always",  // /en/... /kn/... /hi/...
});

export type Locale = (typeof routing.locales)[number];
