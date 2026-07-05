"use client";

import { useEffect, useRef, useState, useCallback } from "react";

type Ticker = {
  symbol: string;
  price: number;
  change24h: number;
  change24hPct: number;
};

type UseBinanceTickerOptions = {
  symbols: string[]; // lower-case binance pairs, e.g. ["btcusdt", "ethusdt"]
};

type UseBinanceTickerReturn = {
  tickers: Map<string, Ticker>;
  connected: boolean;
};

/* ──────────────────────────────────────────────────────────────────────────
 * useBinanceTicker — live ticker prices via Binance WebSocket.
 *
 * Single WebSocket connection subscribes to multiple miniTicker streams.
 * Updates tickers in real-time every ~1s (Binance default push interval).
 *
 * Symbols auto-uppercased for REST fallback, kept lowercase for WS stream.
 * ────────────────────────────────────────────────────────────────────────── */
export function useBinanceTicker({ symbols }: UseBinanceTickerOptions): UseBinanceTickerReturn {
  const [tickers, setTickers] = useState<Map<string, Ticker>>(new Map());
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const symbolsKey = symbols.join(",");

  useEffect(() => {
    if (!symbols.length) return;

    let active = true;

    // ── 1. Fetch 24hr ticker snapshot via REST ──
    const restUrl = `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(
      JSON.stringify(symbols.map((s) => s.toUpperCase()))
    )}`;

    fetch(restUrl)
      .then((r) => r.json())
      .then((data: any[]) => {
        if (!active || !Array.isArray(data)) return;
        const map = new Map<string, Ticker>();
        for (const t of data) {
          map.set(t.symbol.toLowerCase(), {
            symbol: t.symbol,
            price: parseFloat(t.lastPrice),
            change24h: parseFloat(t.priceChange),
            change24hPct: parseFloat(t.priceChangePercent),
          });
        }
        setTickers(map);
      })
      .catch(() => {});

    // ── 2. Connect WebSocket miniTicker stream ──
    const streams = symbols.map((s) => `${s}@miniTicker`).join("/");
    const wsUrl = `wss://stream.binance.com:9443/stream?streams=${streams}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      if (active) setConnected(true);
    };

    ws.onmessage = (e) => {
      if (!active) return;
      try {
        const msg = JSON.parse(e.data);
        if (!msg?.data) return;
        const t = msg.data;
        setTickers((prev) => {
          const next = new Map(prev);
          next.set(t.s.toLowerCase(), {
            symbol: t.s,
            price: parseFloat(t.c),
            change24h: parseFloat(t.p),
            change24hPct: parseFloat(t.P),
          });
          return next;
        });
      } catch {
        // ignore malformed
      }
    };

    ws.onclose = () => {
      if (active) setConnected(false);
    };

    wsRef.current = ws;

    return () => {
      active = false;
      ws.close();
      wsRef.current = null;
    };
  }, [symbolsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return { tickers, connected };
}

/* ── Helper: format price with appropriate decimals ── */
export function formatPrice(symbol: string, price: number): string {
  if (price >= 1000) return price.toFixed(2);
  if (price >= 1) return price.toFixed(4);
  if (price >= 0.01) return price.toFixed(6);
  return price.toFixed(8);
}

/* ── Helper: color tone for price change ── */
export function priceTone(change: number): "bull" | "bear" | "neutral" {
  if (change > 0) return "bull";
  if (change < 0) return "bear";
  return "neutral";
}