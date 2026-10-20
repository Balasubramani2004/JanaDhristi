/**
 * JanaDhristi — Your District. Your Data. Your Right.
 * JanaDhristi — MIT License with Attribution.
 * https://github.com/Balasubramani2004/JanaDhristi
 */

import QueryProvider from "@/components/providers/QueryProvider";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import DisclaimerBar from "@/components/layout/DisclaimerBar";
import MigrationBanner from "@/components/layout/MigrationBanner";
import { NextIntlClientProvider } from "next-intl";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await (async () => {
    try {
      return (await import(`@/dictionaries/${locale}.json`)).default;
    } catch {
      return (await import("@/dictionaries/en.json")).default;
    }
  })();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <QueryProvider>
        <MigrationBanner />
        <DisclaimerBar />
        <a href="#main-content" className="skip-nav">Skip to main content</a>
        <Header locale={locale} />
        <div id="main-content">{children}</div>
        <Footer />
      </QueryProvider>
    </NextIntlClientProvider>
  );
}
