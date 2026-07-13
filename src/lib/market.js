// ---------------------------------------------------------------------------
// Live market data via the Finnhub free tier (https://finnhub.io).
//
// Set VITE_FINNHUB_API_KEY in a .env file to enable it — see .env.example.
// Every call here fails soft: on a missing key, network error, rate limit,
// or an unexpected/empty response we resolve to `null` so callers can fall
// back to the bundled mock data (see lib/stocks.js) without extra plumbing.
// ---------------------------------------------------------------------------

const API_KEY = import.meta.env.VITE_FINNHUB_API_KEY;
const BASE_URL = "https://finnhub.io/api/v1";
const TIMEOUT_MS = 6000;

// Short in-memory TTL cache so switching tabs, re-opening a stock, or the
// periodic refresh (see Dashboard) don't all fire a fresh network call for
// data that's still fresh. Cleared automatically on page reload.
const QUOTE_TTL_MS = 30_000;
const HISTORY_TTL_MS = 60_000;
const cache = new Map();

async function cached(key, ttlMs, load) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.value;
  const value = await load();
  cache.set(key, { value, at: Date.now() });
  return value;
}

async function fetchJson(path) {
  if (!API_KEY) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE_URL}${path}${path.includes("?") ? "&" : "?"}token=${API_KEY}`, {
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export function hasLiveDataKey() {
  return Boolean(API_KEY);
}

/**
 * Latest quote for a Finnhub-formatted symbol, cached for `QUOTE_TTL_MS`.
 * @param {string} finnhubSymbol
 * @returns {Promise<{price: number, chg: number} | null>} `chg` is percent
 *   change since previous close. Resolves to `null` on any failure — callers
 *   fall back to the bundled mock price.
 */
export async function fetchQuote(finnhubSymbol) {
  return cached(`quote:${finnhubSymbol}`, QUOTE_TTL_MS, async () => {
    const data = await fetchJson(`/quote?symbol=${encodeURIComponent(finnhubSymbol)}`);
    if (!data || typeof data.c !== "number" || data.c <= 0) return null;
    const chg = data.pc ? ((data.c - data.pc) / data.pc) * 100 : 0;
    return { price: data.c, chg };
  });
}

/**
 * Daily close price history for a Finnhub-formatted symbol, cached for
 * `HISTORY_TTL_MS`.
 * @param {string} finnhubSymbol
 * @param {number} [days=22]
 * @returns {Promise<Array<{i: number, v: number}> | null>} Oldest to
 *   newest, or `null` on any failure (free-tier candle access is often
 *   restricted) — callers fall back to the bundled mock series.
 */
export async function fetchHistory(finnhubSymbol, days = 22) {
  return cached(`history:${finnhubSymbol}:${days}`, HISTORY_TTL_MS, async () => {
    const to = Math.floor(Date.now() / 1000);
    const from = to - days * 24 * 60 * 60;
    const data = await fetchJson(
      `/stock/candle?symbol=${encodeURIComponent(finnhubSymbol)}&resolution=D&from=${from}&to=${to}`
    );
    if (!data || data.s !== "ok" || !Array.isArray(data.c) || data.c.length === 0) return null;
    return data.c.map((v, i) => ({ i, v }));
  });
}
