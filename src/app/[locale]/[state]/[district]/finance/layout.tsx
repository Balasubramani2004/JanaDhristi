/**
 * JanaDhristi — Your District. Your Data. Your Right.
 * JanaDhristi — MIT License with Attribution.
 * https://github.com/Balasubramani2004/JanaDhristi
 */

import type { Metadata } from "next";
import Script from "next/script";
import { generateModuleMetadata, generateModuleJsonLd } from "@/lib/seo";

type Params = Promise<{ locale: string; state: string; district: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { state, district } = await params;
  return generateModuleMetadata("finance", state, district);
}

export default async function Layout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string; state: string; district: string }> }) {
  const { state, district } = await params;
  const jsonLd = generateModuleJsonLd({
    module: "finance",
    districtName: district,
    stateName: state,
    stateSlug: state,
    districtSlug: district,
  });
  return (
    <>
      {jsonLd && (
        <Script
          id="module-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}
