/**
 * JanaDhristi — Your District. Your Data. Your Right.
 * JanaDhristi — MIT License with Attribution.
 * https://github.com/Balasubramani2004/JanaDhristi
 */

// ═══════════════════════════════════════════════════════════
// JanaDhristi — Base district data hook
// All module-specific hooks build on this
// ═══════════════════════════════════════════════════════════
"use client";

import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import {
  getDistrictModuleRefetchIntervalMs,
  getDistrictModuleStaleTimeMs,
} from "@/lib/module-freshness";

export interface ApiMeta {
  module: string;
  district: string;
  updatedAt: string;
  fromCache: boolean;
  error?: string;
  lastUpdated?: string | null;
}

export interface ApiResponse<T> {
  data: T;
  meta: ApiMeta;
}

async function fetchDistrictData<T>(
  module: string,
  district: string,
  state: string,
  locale: string,
  taluk?: string
): Promise<ApiResponse<T>> {
  const params = new URLSearchParams({ district, state });
  params.set("locale", locale);
  if (taluk) params.set("taluk", taluk);

  const res = await fetch(`/api/data/${module}?${params.toString()}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function useDistrictData<T>(
  module: string,
  district: string,
  state: string,
  options?: Partial<UseQueryOptions<ApiResponse<T>, Error>>,
  taluk?: string
) {
  const locale = useLocale();
  return useQuery<ApiResponse<T>, Error>({
    queryKey: ["district", district, module, taluk, locale],
    queryFn: () => fetchDistrictData<T>(module, district, state, locale, taluk),
    enabled: Boolean(district && state),
    staleTime: getDistrictModuleStaleTimeMs(module),
    refetchInterval: getDistrictModuleRefetchIntervalMs(module),
    ...options,
  });
}

