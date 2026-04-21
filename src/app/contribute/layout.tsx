import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://janadhristi.in";

export const metadata: Metadata = {
  title: "Contribute — JanaDhristi",
  description:
    "Help expand JanaDhristi to your district — report errors, suggest data sources, request your district, or contribute code.",
  alternates: { canonical: `${BASE_URL}/en/contribute` },
};

export default function ContributeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
