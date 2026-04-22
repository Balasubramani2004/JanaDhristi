/**
 * JanaDhristi — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

import type { Metadata } from "next";
import HomeDrilldown from "@/components/layout/HomeDrilldown";
import MarketTickerClient from "@/components/layout/MarketTickerClient";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://janadhristi.in";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const url = `${BASE_URL}/${locale}`;
  return {
    alternates: {
      canonical: url,
      languages: {
        "en": `${BASE_URL}/en`,
        "kn": `${BASE_URL}/kn`,
        "hi": `${BASE_URL}/hi`,
        "x-default": `${BASE_URL}/en`,
      },
    },
    openGraph: { url },
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <>
      {/* SEO H1 — visually hidden, essential for page identity */}
      <h1 className="sr-only">
        JanaDhristi — India&apos;s Citizen Transparency Platform. District-level government data: crop prices, dam levels, schemes, budget, and more.
      </h1>
      <MarketTickerClient />
      <HomeDrilldown locale={locale} tickerShown />
    </>
  );
}
