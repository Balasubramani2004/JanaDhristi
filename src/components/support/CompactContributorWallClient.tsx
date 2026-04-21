/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

import dynamic from "next/dynamic";

const CompactContributorWall = dynamic(() => import("./CompactContributorWall"), { ssr: false });

export default function CompactContributorWallClient() {
  return <CompactContributorWall />;
}
