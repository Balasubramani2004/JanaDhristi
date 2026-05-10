/**
 * JanaDhristi — Your District. Your Data. Your Right.
 * JanaDhristi — MIT License with Attribution.
 * https://github.com/Balasubramani2004/JanaDhristi
 */

"use client";
import dynamic from "next/dynamic";

const MarketTicker = dynamic(() => import("./MarketTicker"), { ssr: false });

export default function MarketTickerClient() {
  return <MarketTicker />;
}
