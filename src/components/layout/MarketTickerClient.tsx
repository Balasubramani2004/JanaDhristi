/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";
import dynamic from "next/dynamic";

const MarketTicker = dynamic(() => import("./MarketTicker"), { ssr: false });

export default function MarketTickerClient() {
  return <MarketTicker />;
}
