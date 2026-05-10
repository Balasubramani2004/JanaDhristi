/**
 * JanaDhristi — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

/** GeoJSON positions: [lng, lat] */
export function ringCentroid(ring: number[][]): { lng: number; lat: number } {
  if (!ring?.length) return { lng: 0, lat: 0 };
  let n = ring.length;
  const last = ring[n - 1];
  const first = ring[0];
  if (last[0] === first[0] && last[1] === first[1]) n -= 1;
  if (n < 1) return { lng: first[0], lat: first[1] };
  let sx = 0;
  let sy = 0;
  for (let i = 0; i < n; i++) {
    sx += ring[i][0];
    sy += ring[i][1];
  }
  return { lng: sx / n, lat: sy / n };
}

export function polygonCentroid(coords: number[][][]): { lng: number; lat: number } {
  const outer = coords[0];
  return ringCentroid(outer);
}

export function multiPolygonCentroid(coords: number[][][][]): { lng: number; lat: number } {
  const parts = coords.map((poly) => polygonCentroid(poly));
  if (parts.length === 1) return parts[0];
  let sx = 0;
  let sy = 0;
  for (const p of parts) {
    sx += p.lng;
    sy += p.lat;
  }
  return { lng: sx / parts.length, lat: sy / parts.length };
}
