/**
 * JanaDhristi — Your District. Your Data. Your Right.
 * JanaDhristi — MIT License with Attribution.
 * https://github.com/Balasubramani2004/JanaDhristi
 */

import { redirect } from "next/navigation";

// Root route: redirect to default locale
export default function RootPage() {
  redirect("/en");
}
