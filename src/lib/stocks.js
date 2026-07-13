// ---------------------------------------------------------------------------
// Mock market universe. Prices/history here are the fallback used whenever
// live data (see market.js) isn't available.
// ---------------------------------------------------------------------------

export function genHistory(base, vol = 0.018, points = 22) {
  let v = base;
  const arr = [];
  for (let i = 0; i < points; i++) {
    v = v * (1 + (Math.random() - 0.48) * vol);
    arr.push({ i, v: Math.max(v, 0.01) });
  }
  return arr;
}

export const CATEGORIES = ["All", "Tech", "ETFs", "Crypto", "UK Stocks"];

// Maps our internal symbol to a Finnhub-compatible symbol for live quotes.
export const FINNHUB_SYMBOL_MAP = {
  VWRP: "VWRL.L",
  VUAG: "VUAG.L",
  AAPL: "AAPL",
  NVDA: "NVDA",
  TSLA: "TSLA",
  GOOGL: "GOOGL",
  AMZN: "AMZN",
  MSFT: "MSFT",
  META: "META",
  NFLX: "NFLX",
  BP: "BP.L",
  HSBA: "HSBA.L",
  BTC: "BINANCE:BTCUSDT",
  ETH: "BINANCE:ETHUSDT",
  GLD: "GLD",
};

const RAW_UNIVERSE = [
  { symbol: "VWRP", name: "Vanguard FTSE All-World", price: 118.42, chg: 0.4, category: "ETFs" },
  { symbol: "VUAG", name: "Vanguard S&P 500", price: 92.15, chg: 0.9, category: "ETFs" },
  { symbol: "AAPL", name: "Apple Inc.", price: 195.32, chg: 0.8, category: "Tech" },
  { symbol: "NVDA", name: "NVIDIA Corp.", price: 118.75, chg: 2.4, category: "Tech" },
  { symbol: "TSLA", name: "Tesla Inc.", price: 248.5, chg: -1.2, category: "Tech" },
  { symbol: "GOOGL", name: "Alphabet Inc.", price: 178.2, chg: 0.3, category: "Tech" },
  { symbol: "AMZN", name: "Amazon.com", price: 198.4, chg: -0.5, category: "Tech" },
  { symbol: "MSFT", name: "Microsoft Corp.", price: 445.1, chg: 0.6, category: "Tech" },
  { symbol: "META", name: "Meta Platforms", price: 512.3, chg: 1.1, category: "Tech" },
  { symbol: "NFLX", name: "Netflix Inc.", price: 685.2, chg: -0.3, category: "Tech" },
  { symbol: "BP", name: "BP plc", price: 4.82, chg: 0.2, category: "UK Stocks" },
  { symbol: "HSBA", name: "HSBC Holdings", price: 6.94, chg: -0.1, category: "UK Stocks" },
  { symbol: "BTC", name: "Bitcoin", price: 58230, chg: 3.2, category: "Crypto" },
  { symbol: "ETH", name: "Ethereum", price: 3145, chg: 1.8, category: "Crypto" },
  { symbol: "GLD", name: "Gold Trust", price: 198.6, chg: 0.5, category: "ETFs" },
];

export const STOCK_UNIVERSE = RAW_UNIVERSE.map((s) => ({ ...s, history: genHistory(s.price) }));

export function stocksByCategory(category) {
  if (!category || category === "All") return STOCK_UNIVERSE;
  return STOCK_UNIVERSE.filter((s) => s.category === category);
}

// Suggests stocks the user doesn't already hold, weighted toward categories
// they already have exposure to (falls back to a diversified default).
export function recommendedFor(portfolio) {
  const heldSymbols = Object.keys(portfolio || {});
  if (heldSymbols.length === 0) {
    return STOCK_UNIVERSE.filter((s) => ["VWRP", "VUAG", "GLD"].includes(s.symbol));
  }
  const heldCategories = new Set(
    heldSymbols
      .map((sym) => STOCK_UNIVERSE.find((s) => s.symbol === sym)?.category)
      .filter(Boolean)
  );
  const candidates = STOCK_UNIVERSE.filter(
    (s) => !heldSymbols.includes(s.symbol) && heldCategories.has(s.category)
  );
  const pool = candidates.length > 0 ? candidates : STOCK_UNIVERSE.filter((s) => !heldSymbols.includes(s.symbol));
  return pool.slice(0, 4);
}
