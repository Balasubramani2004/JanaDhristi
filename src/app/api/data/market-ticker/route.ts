/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// ForThePeople.in — Market Ticker API
// GET /api/data/market-ticker
// Free data: Yahoo Finance + open.er-api.com + goodreturns.in
// Redis cache: 5 min market hours, 30 min after hours
// ═══════════════════════════════════════════════════════════
import { NextResponse } from "next/server";
import { cacheGet, cacheSet } from "@/lib/cache";

const CACHE_KEY = "ftp:market-ticker:v3";
// Fuel prices removed — not universal across districts

export interface TickerItem {
  symbol: string;
  label: string;
  value: string;
  change: string;
  changePct: number;
  direction: "up" | "down" | "flat";
  unit: string;
}

// IST offset = UTC+5:30
function isMarketHours(): boolean {
  const now = new Date();
  const istHour = (now.getUTCHours() + 5) % 24;
  const istMin = (now.getUTCMinutes() + 30) % 60;
  const istTotalMin = istHour * 60 + istMin;
  const day = now.getUTCDay(); // 0=Sun, 6=Sat
  if (day === 0 || day === 6) return false;
  // 9:15 AM to 3:30 PM IST
  return istTotalMin >= 555 && istTotalMin <= 930;
}

function getCacheTTL(): number {
  return isMarketHours() ? 300 : 1800;
}

const YAHOO_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  Origin: "https://finance.yahoo.com",
  Referer: "https://finance.yahoo.com",
};

async function fetchYahooQuote(
  ticker: string
): Promise<{ price: number; change: number; changePct: number } | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`;
    const res = await fetch(url, {
      headers: YAHOO_HEADERS,
      next: { revalidate: 0 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const meta = json?.chart?.result?.[0]?.meta;
    if (!meta) return null;
    const price = meta.regularMarketPrice ?? meta.previousClose;
    const prev = meta.previousClose ?? meta.chartPreviousClose;
    const change = price - prev;
    const changePct = (change / prev) * 100;
    return { price, change, changePct };
  } catch {
    return null;
  }
}

async function fetchUSDINR(): Promise<{ rate: number; changePct: number } | null> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 0 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const rate = json?.rates?.INR;
    if (!rate) return null;
    // open.er-api doesn't give change, use small estimated variation
    return { rate, changePct: 0 };
  } catch {
    return null;
  }
}

// Fuel prices (petrol/LPG) removed — they are city-specific, not universal

// ── IBJA (India Bullion and Jewellers Association) — Official Indian gold/silver prices ──
async function fetchIBJAPrices(): Promise<{
  gold: { price: number; change: number; changePct: number } | null;
  silver: { price: number; change: number; changePct: number } | null;
}> {
  try {
    const res = await fetch("https://www.ibjarates.com/", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      next: { revalidate: 0 },
    });
    if (!res.ok) return { gold: null, silver: null };
    const html = await res.text();

    // IBJA hidden fields contain JSON with purity999 (24K gold per 10g) and silver per kg
    const goldRateMatch = html.match(/HdnGold[^"]*"[^"]*value="([^"]*)"/i);
    const silverRateMatch = html.match(/HdnSilver[^"]*"[^"]*value="([^"]*)"/i);

    let goldPrice: number | null = null;
    let goldPrevPrice: number | null = null;
    let silverPrice: number | null = null;
    let silverPrevPrice: number | null = null;

    // Parse JSON format: {"labels":[...], "purity999":[128596, 132710, ...]}
    if (goldRateMatch) {
      try {
        const decoded = goldRateMatch[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&');
        const data = JSON.parse(decoded);
        const vals: number[] = data.purity999 ?? data.purity995 ?? [];
        if (vals.length >= 2) {
          goldPrice = vals[vals.length - 1];
          goldPrevPrice = vals[vals.length - 2];
        } else if (vals.length === 1) {
          goldPrice = vals[0];
        }
      } catch {
        // Fallback: try comma-separated format
        const vals = goldRateMatch[1].split(",").map((v: string) => parseFloat(v.trim())).filter((v: number) => !isNaN(v) && v > 50000);
        if (vals.length >= 2) {
          goldPrice = vals[vals.length - 1];
          goldPrevPrice = vals[vals.length - 2];
        } else if (vals.length === 1) {
          goldPrice = vals[0];
        }
      }
    }
    if (silverRateMatch) {
      try {
        const decoded = silverRateMatch[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&');
        const data = JSON.parse(decoded);
        const vals: number[] = data.purity999 ?? [];
        if (vals.length >= 2) {
          silverPrice = vals[vals.length - 1];
          silverPrevPrice = vals[vals.length - 2];
        } else if (vals.length === 1) {
          silverPrice = vals[0];
        }
      } catch {
        const vals = silverRateMatch[1].split(",").map((v: string) => parseFloat(v.trim())).filter((v: number) => !isNaN(v) && v > 50000);
        if (vals.length >= 2) {
          silverPrice = vals[vals.length - 1];
          silverPrevPrice = vals[vals.length - 2];
        } else if (vals.length === 1) {
          silverPrice = vals[0];
        }
      }
    }

    const goldChange = goldPrice && goldPrevPrice ? goldPrice - goldPrevPrice : 0;
    const goldChangePct = goldPrice && goldPrevPrice ? (goldChange / goldPrevPrice) * 100 : 0;
    const silverChange = silverPrice && silverPrevPrice ? silverPrice - silverPrevPrice : 0;
    const silverChangePct = silverPrice && silverPrevPrice ? (silverChange / silverPrevPrice) * 100 : 0;

    return {
      gold: goldPrice ? { price: goldPrice, change: goldChange, changePct: goldChangePct } : null,
      silver: silverPrice ? { price: silverPrice, change: silverChange, changePct: silverChangePct } : null,
    };
  } catch {
    return { gold: null, silver: null };
  }
}

// Fallback static data (last known realistic values — used when all sources fail)
// Fallback: last known values (April 2026) — used when all live sources fail
const FALLBACK: TickerItem[] = [
  { symbol: "GOLD", label: "Gold (24K)", value: "₹15,033", change: "–", changePct: 0, direction: "flat", unit: "/g" },
  { symbol: "SILVER", label: "Silver", value: "₹260", change: "–", changePct: 0, direction: "flat", unit: "/g" },
  { symbol: "PETROL", label: "Petrol", value: "₹104.61", change: "–", changePct: 0, direction: "flat", unit: "/L" },
  { symbol: "DIESEL", label: "Diesel", value: "₹92.27", change: "–", changePct: 0, direction: "flat", unit: "/L" },
  { symbol: "USD_INR", label: "USD/INR", value: "₹85.50", change: "–", changePct: 0, direction: "flat", unit: "" },
  { symbol: "SENSEX", label: "Sensex", value: "74,248", change: "+312", changePct: 0.42, direction: "up", unit: "" },
  { symbol: "NIFTY50", label: "Nifty 50", value: "22,519", change: "+87", changePct: 0.39, direction: "up", unit: "" },
  { symbol: "CRUDE", label: "Crude", value: "$62.50", change: "-0.90", changePct: -1.14, direction: "down", unit: "/bbl" },
];

function fmt(n: number, decimals = 0): string {
  return n.toLocaleString("en-IN", { maximumFractionDigits: decimals, minimumFractionDigits: decimals });
}

export async function GET() {
  // Check cache first
  const cached = await cacheGet<{ items: TickerItem[]; asOf: string; fromCache: boolean }>(CACHE_KEY);
  if (cached) {
    return NextResponse.json({ ...cached, fromCache: true });
  }

  const items: TickerItem[] = [];
  let fetchedAny = false;

  // Sensex
  const sensex = await fetchYahooQuote("^BSESN");
  if (sensex) {
    fetchedAny = true;
    items.push({
      symbol: "SENSEX",
      label: "Sensex",
      value: fmt(Math.round(sensex.price)),
      change: `${sensex.change >= 0 ? "+" : ""}${fmt(Math.round(sensex.change))}`,
      changePct: sensex.changePct,
      direction: sensex.change > 0 ? "up" : sensex.change < 0 ? "down" : "flat",
      unit: "",
    });
  }

  // Nifty 50
  const nifty = await fetchYahooQuote("^NSEI");
  if (nifty) {
    fetchedAny = true;
    items.push({
      symbol: "NIFTY50",
      label: "Nifty 50",
      value: fmt(Math.round(nifty.price)),
      change: `${nifty.change >= 0 ? "+" : ""}${fmt(Math.round(nifty.change))}`,
      changePct: nifty.changePct,
      direction: nifty.change > 0 ? "up" : nifty.change < 0 ? "down" : "flat",
      unit: "",
    });
  }

  // USD/INR — try Yahoo Finance first (real-time), fall back to open.er-api
  const usdYahoo = await fetchYahooQuote("USDINR=X");
  if (usdYahoo) {
    fetchedAny = true;
    items.push({
      symbol: "USD_INR",
      label: "USD/INR",
      value: `₹${fmt(usdYahoo.price, 2)}`,
      change: usdYahoo.change !== 0
        ? `${usdYahoo.change >= 0 ? "+" : ""}${fmt(usdYahoo.change, 2)}`
        : "–",
      changePct: usdYahoo.changePct,
      direction: usdYahoo.change > 0 ? "up" : usdYahoo.change < 0 ? "down" : "flat",
      unit: "",
    });
  } else {
    const usd = await fetchUSDINR();
    if (usd) {
      fetchedAny = true;
      items.push({
        symbol: "USD_INR",
        label: "USD/INR",
        value: `₹${fmt(usd.rate, 2)}`,
        change: "–",
        changePct: 0,
        direction: "flat",
        unit: "",
      });
    }
  }

  // Crude oil
  const crude = await fetchYahooQuote("CL=F");
  if (crude) {
    fetchedAny = true;
    items.push({
      symbol: "CRUDE",
      label: "Crude",
      value: `$${fmt(crude.price, 2)}`,
      change: `${crude.change >= 0 ? "+" : ""}${fmt(crude.change, 2)}`,
      changePct: crude.changePct,
      direction: crude.change > 0 ? "up" : crude.change < 0 ? "down" : "flat",
      unit: "/bbl",
    });
  }

  // Gold & Silver — IBJA (India Bullion and Jewellers Association) official Indian rates
  const ibja = await fetchIBJAPrices();
  if (ibja.gold) {
    fetchedAny = true;
    // IBJA gives price per 10g — convert to per gram
    const goldPerGram = ibja.gold.price / 10;
    const goldChangePerGram = ibja.gold.change / 10;
    items.push({
      symbol: "GOLD",
      label: "Gold (24K)",
      value: `₹${fmt(Math.round(goldPerGram))}`,
      change: goldChangePerGram !== 0
        ? `${goldChangePerGram >= 0 ? "+" : ""}₹${fmt(Math.round(Math.abs(goldChangePerGram)))}`
        : "–",
      changePct: ibja.gold.changePct,
      direction: ibja.gold.change > 0 ? "up" : ibja.gold.change < 0 ? "down" : "flat",
      unit: "/g",
    });
  }
  if (ibja.silver) {
    fetchedAny = true;
    // IBJA gives silver price per kg — convert to per gram
    const silverPerGram = ibja.silver.price / 1000;
    const silverChangePerGram = ibja.silver.change / 1000;
    items.push({
      symbol: "SILVER",
      label: "Silver",
      value: `₹${fmt(silverPerGram, 2)}`,
      change: silverChangePerGram !== 0
        ? `${silverChangePerGram >= 0 ? "+" : ""}₹${fmt(Math.abs(silverChangePerGram), 2)}`
        : "–",
      changePct: ibja.silver.changePct,
      direction: ibja.silver.change > 0 ? "up" : ibja.silver.change < 0 ? "down" : "flat",
      unit: "/g",
    });
  }

  // Petrol & Diesel — static India averages
  // TODO: Make dynamic via fuel price API when a reliable free source is available
  items.push({
    symbol: "PETROL",
    label: "Petrol",
    value: "₹104.61",
    change: "–",
    changePct: 0,
    direction: "flat",
    unit: "/L",
  });
  items.push({
    symbol: "DIESEL",
    label: "Diesel",
    value: "₹92.27",
    change: "–",
    changePct: 0,
    direction: "flat",
    unit: "/L",
  });

  // Order: Gold, Silver, Petrol, Diesel, USD/INR, Sensex, Nifty, Crude
  const ordered: TickerItem[] = [
    items.find((i) => i.symbol === "GOLD"),
    items.find((i) => i.symbol === "SILVER"),
    items.find((i) => i.symbol === "PETROL"),
    items.find((i) => i.symbol === "DIESEL"),
    items.find((i) => i.symbol === "USD_INR"),
    items.find((i) => i.symbol === "SENSEX"),
    items.find((i) => i.symbol === "NIFTY50"),
    items.find((i) => i.symbol === "CRUDE"),
  ].filter(Boolean) as TickerItem[];

  // Use fallback if nothing fetched
  const finalItems = fetchedAny && ordered.length >= 2 ? ordered : FALLBACK;

  const result = {
    items: finalItems,
    asOf: new Date().toISOString(),
    isMarketHours: isMarketHours(),
    fromCache: false,
    usingFallback: !fetchedAny,
  };

  await cacheSet(CACHE_KEY, result, getCacheTTL());
  return NextResponse.json(result, {
    headers: { "Cache-Control": `public, s-maxage=${getCacheTTL()}, stale-while-revalidate=60` },
  });
}
