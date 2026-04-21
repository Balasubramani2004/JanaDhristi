/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/people
 *
 * Admin dashboard entry. Content is switched client-side by AdminClient
 * based on the ?tab= query param. All data fetching happens in the sub-tabs
 * (each via its own API route), so this page does no server-side queries.
 */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { FactChecker } from "./FactChecker";
import AdminClient from "./AdminClient";
import DashboardView from "./DashboardView";

const COOKIE = "ftp_admin_v1";
type Params = Promise<{ locale: string }>;

export default async function AdminDashboardPage({ params }: { params: Params }) {
  const { locale } = await params;
  const authed = (await cookies()).get(COOKIE)?.value === "ok";
  if (!authed) redirect(`/${locale}/admin?error=1`);

  return (
    <AdminClient locale={locale}>
      <DashboardView locale={locale} />
      <FactChecker />
    </AdminClient>
  );
}
