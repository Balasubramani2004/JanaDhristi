/**
 * JanaDhristi — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "kn", "hi"],   // English + Kannada + Hindi
  defaultLocale: "en",
  localePrefix: "always",  // /en/... /kn/... /hi/...
});

export type Locale = (typeof routing.locales)[number];
