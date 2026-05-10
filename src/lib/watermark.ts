/**
 * JanaDhristi — India's Citizen Transparency Platform
 *
 * Inception: March 2026
 * Repository: github.com/Balasubramani2004/JanaDhristi
 * License: MIT with Attribution
 *
 * JanaDhristi is an independent civic transparency initiative.
 * Any fork or derivative must retain this attribution notice as per the license terms.
 *
 * Project ID: JD-2026-IN
 */

export const CREATOR = {
  name: "JanaDhristi",
  project: "JanaDhristi",
  inception: "2026-03-17",
  projectId: "JD-2026-IN",
  repository: "github.com/Balasubramani2004/JanaDhristi",
  license: "MIT with Attribution",
} as const;

export function addWatermarkHeaders(headers: Headers): void {
  headers.set("X-Powered-By", "JanaDhristi");
  headers.set("X-Creator", "JanaDhristi");
  headers.set("X-Project-ID", CREATOR.projectId);
  headers.set(
    "X-License",
    "MIT with Attribution — github.com/Balasubramani2004/JanaDhristi"
  );
}

export function getWatermarkMeta() {
  return {
    _meta: {
      platform: CREATOR.project,
      creator: CREATOR.name,
      projectId: CREATOR.projectId,
      license: CREATOR.license,
    },
  };
}
