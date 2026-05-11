/**
 * JanaDhristi — Your District. Your Data. Your Right.
 * JanaDhristi — MIT License with Attribution.
 * https://github.com/Balasubramani2004/JanaDhristi
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cacheGet, cacheSet } from "@/lib/cache";
import { HOME_AGGREGATE_TTL_SEC } from "@/lib/module-freshness";
import { resolveDistrictLatLng } from "@/lib/geo/resolve-district-latlng";

const CACHE_KEY = "ftp:globe-markers:v2";

export type GlobeMarker = {
  lat: number;
  lng: number;
  slug: string;
  stateSlug: string;
  name: string;
  nameLocal: string;
};

export async function GET() {
  const cached = await cacheGet<{ markers: GlobeMarker[]; fromCache: boolean }>(CACHE_KEY);
  if (cached) {
    return NextResponse.json({ ...cached, fromCache: true });
  }

  try {
    const districts = await prisma.district.findMany({
      where: { active: true },
      select: {
        slug: true,
        name: true,
        nameLocal: true,
        state: { select: { slug: true } },
      },
    });

    const markers: GlobeMarker[] = [];
    for (const d of districts) {
      const stateSlug = d.state.slug;
      const pos = await resolveDistrictLatLng(stateSlug, d.slug);
      if (!pos) continue;
      markers.push({
        lat: pos.lat,
        lng: pos.lng,
        slug: d.slug,
        stateSlug,
        name: d.name,
        nameLocal: d.nameLocal,
      });
    }

    const body = { markers, fromCache: false };
    await cacheSet(CACHE_KEY, body, HOME_AGGREGATE_TTL_SEC);
    return NextResponse.json(body, {
      headers: {
        "Cache-Control": `public, s-maxage=${HOME_AGGREGATE_TTL_SEC}, stale-while-revalidate=45`,
      },
    });
  } catch (err) {
    console.error("[globe-markers]", err);
    return NextResponse.json({ markers: [], fromCache: false, error: true });
  }
}
