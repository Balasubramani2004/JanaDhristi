/**
 * JanaDhristi — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
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
        <Header locale={locale} />
        {children}
        <Footer />
      </QueryProvider>
    </NextIntlClientProvider>
  );
}
