/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

// API client for data fetching — used by React Query hooks
const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "";

export async function apiFetch<T>(
  endpoint: string,
  params: Record<string, string> = {}
): Promise<T> {
  const url = new URL(`${BASE}/api/data/${endpoint}`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), {
    next: { revalidate: 60 }, // 1-min ISR for server components
  });

  if (!res.ok) {
    throw new Error(`API ${endpoint} failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// Standard API response shape
export interface ApiResponse<T> {
  data: T;
  meta: {
    district: string;
    taluk?: string;
    lastUpdated: string;
    source: string;
    refreshInterval: number; // seconds
    recordCount: number;
  };
}
