import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Star, TrendingUp, TrendingDown, WifiOff } from "lucide-react";
import { theme, fonts } from "../lib/theme.js";
import { STOCK_UNIVERSE, CATEGORIES, stocksByCategory, recommendedFor } from "../lib/stocks.js";
import { fmtGBP } from "../lib/format.js";
import { Spinner } from "./ui.jsx";

const SEARCH_DEBOUNCE_MS = 250;

function Sparkline({ data, positive }) {
  // Tiny inline sparkline built from plain SVG so this component has no
  // recharts dependency of its own (Dashboard already renders the big ones).
  if (!data || data.length < 2) return <div style={{ width: 64, height: 32 }} />;
  const values = data.map((d) => d.v);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * 64;
      const y = 32 - ((v - min) / range) * 28 - 2;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg width={64} height={32}>
      <polyline points={points} fill="none" stroke={positive ? theme.green : theme.red} strokeWidth={1.5} />
    </svg>
  );
}

function StockRow({ stock, isWatched, onToggleWatch, onSelect }) {
  const positive = stock.chg >= 0;
  return (
    <div className="flex items-center justify-between py-3" style={{ borderBottom: `1px solid ${theme.border}` }}>
      <button onClick={() => onSelect(stock)} className="flex items-center gap-3 text-left flex-1 min-w-0">
        <div
          style={{ background: theme.surface2, border: `1px solid ${theme.border}`, color: theme.accent }}
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        >
          <span style={{ fontFamily: fonts.mono, fontSize: 10.5 }}>{stock.symbol.slice(0, 4)}</span>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span style={{ color: theme.text, fontFamily: fonts.body, fontSize: 13.5 }}>{stock.symbol}</span>
            {stock.live && <span style={{ width: 5, height: 5, borderRadius: 999, background: theme.green }} title="Live price" />}
          </div>
          <div style={{ color: theme.textFaint, fontFamily: fonts.body, fontSize: 11.5 }} className="truncate">
            {stock.name}
          </div>
        </div>
      </button>
      <Sparkline data={stock.history} positive={positive} />
      <div className="text-right ml-2" style={{ minWidth: 64 }}>
        <div style={{ color: theme.text, fontFamily: fonts.mono, fontSize: 13 }}>
          £{stock.price.toLocaleString("en-GB", { maximumFractionDigits: 2 })}
        </div>
        <div
          style={{ color: positive ? theme.green : theme.red, fontFamily: fonts.mono, fontSize: 11 }}
          className="flex items-center justify-end gap-0.5"
        >
          {positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {Math.abs(stock.chg).toFixed(1)}%
        </div>
      </div>
      <button onClick={() => onToggleWatch(stock.symbol)} aria-label={isWatched ? `Remove ${stock.symbol} from watchlist` : `Add ${stock.symbol} to watchlist`} className="ml-2 shrink-0">
        <Star size={16} fill={isWatched ? theme.accent : "none"} color={isWatched ? theme.accent : theme.textFaint} />
      </button>
    </div>
  );
}

/**
 * The Invest tab body: cash/portfolio summary, watchlist strip,
 * recommendations, and the full category-filterable market list.
 */
export default function MarketTab({
  watchlist,
  toggleWatch,
  portfolio,
  investCash,
  portfolioValue,
  hideBalance,
  liveQuotes,
  quotesLoading,
  liveDataUnavailable,
  onOpenStock,
}) {
  const [category, setCategory] = useState("All");
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");

  // Debounce the search box so filtering (and, if this were wired to a
  // remote search API, network calls) don't fire on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setQuery(searchInput), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  const withLive = useCallback(
    (stock) => {
      const live = liveQuotes?.[stock.symbol];
      return live ? { ...stock, price: live.price, chg: live.chg, live: true } : stock;
    },
    [liveQuotes]
  );

  const recommended = useMemo(() => recommendedFor(portfolio).map(withLive), [portfolio, withLive]);

  const watchlistStocks = useMemo(
    () => STOCK_UNIVERSE.filter((s) => watchlist.includes(s.symbol)).map(withLive),
    [watchlist, withLive]
  );

  const filtered = useMemo(() => {
    const categoryList = stocksByCategory(category).map(withLive);
    if (!query) return categoryList;
    const q = query.toLowerCase();
    return categoryList.filter((s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q));
  }, [category, query, withLive]);

  const showInitialLoading = quotesLoading && Object.keys(liveQuotes || {}).length === 0;

  return (
    <>
      <div className="px-5 mt-3 flex gap-3">
        <div style={{ background: theme.surface, border: `1px solid ${theme.border}` }} className="rounded-2xl p-4 flex-1">
          <div style={{ color: theme.textFaint, fontFamily: fonts.body, fontSize: 11 }}>Invest cash</div>
          <div style={{ color: theme.text, fontFamily: fonts.mono, fontSize: 18, marginTop: 2 }}>
            {fmtGBP(investCash, hideBalance)}
          </div>
        </div>
        <div style={{ background: theme.surface, border: `1px solid ${theme.border}` }} className="rounded-2xl p-4 flex-1">
          <div style={{ color: theme.textFaint, fontFamily: fonts.body, fontSize: 11 }}>Portfolio value</div>
          <div style={{ color: theme.text, fontFamily: fonts.mono, fontSize: 18, marginTop: 2 }}>
            {fmtGBP(portfolioValue, hideBalance)}
          </div>
        </div>
      </div>

      {showInitialLoading && (
        <div className="px-5 mt-3 flex items-center gap-2">
          <Spinner size={13} />
          <span style={{ color: theme.textFaint, fontFamily: fonts.body, fontSize: 11.5 }}>Fetching live prices…</span>
        </div>
      )}

      {!showInitialLoading && liveDataUnavailable && (
        <div className="px-5 mt-3 flex items-center gap-1.5" title="Couldn't reach live pricing — showing simulated prices instead">
          <WifiOff size={12} color={theme.textFaint} />
          <span style={{ color: theme.textFaint, fontFamily: fonts.body, fontSize: 11.5 }}>Live data unavailable — showing simulated prices</span>
        </div>
      )}

      {watchlist.length > 0 && (
        <div className="mt-6">
          <div style={{ color: theme.textDim, fontFamily: fonts.body, fontSize: 13, marginBottom: 8 }} className="px-5">
            Your watchlist
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar px-5 pb-1">
            {watchlistStocks.map((s) => {
              const positive = s.chg >= 0;
              return (
                <button
                  key={s.symbol}
                  onClick={() => onOpenStock(s)}
                  style={{ background: theme.surface, border: `1px solid ${theme.border}` }}
                  className="rounded-2xl p-3 shrink-0 text-left"
                >
                  <div style={{ color: theme.text, fontFamily: fonts.mono, fontSize: 12 }}>{s.symbol}</div>
                  <div style={{ color: theme.text, fontFamily: fonts.mono, fontSize: 14, marginTop: 4 }}>
                    £{s.price.toLocaleString("en-GB", { maximumFractionDigits: 2 })}
                  </div>
                  <div
                    style={{ color: positive ? theme.green : theme.red, fontFamily: fonts.mono, fontSize: 11 }}
                    className="flex items-center gap-0.5 mt-0.5"
                  >
                    {positive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    {Math.abs(s.chg).toFixed(1)}%
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-6">
        <div style={{ color: theme.textDim, fontFamily: fonts.body, fontSize: 13, marginBottom: 2 }} className="px-5">
          Recommended for you
        </div>
        <div style={{ color: theme.textFaint, fontFamily: fonts.body, fontSize: 11.5, marginBottom: 8 }} className="px-5">
          {Object.keys(portfolio).length > 0 ? "Based on what you already hold" : "Popular picks to get started"}
        </div>
        <div className="flex flex-col px-5">
          {recommended.map((s) => (
            <StockRow key={s.symbol} stock={s} isWatched={watchlist.includes(s.symbol)} onToggleWatch={toggleWatch} onSelect={onOpenStock} />
          ))}
        </div>
      </div>

      <div className="px-5 mt-6">
        <div style={{ color: theme.textDim, fontFamily: fonts.body, fontSize: 13, marginBottom: 8 }}>Market</div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 mb-4">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              style={{
                background: category === c ? theme.accentSoft : theme.surface2,
                color: category === c ? theme.accent : theme.textDim,
                border: `1px solid ${theme.border}`,
              }}
              className="px-3.5 py-1.5 rounded-full text-[12.5px] shrink-0"
            >
              {c}
            </button>
          ))}
        </div>

        <div
          style={{ background: theme.surface2, border: `1px solid ${theme.border}` }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full mb-4"
        >
          <Search size={16} color={theme.textFaint} />
          <input
            placeholder="Search the market, e.g. NVDA"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{ background: "transparent", color: theme.text, fontSize: 13.5 }}
            className="w-full outline-none"
          />
        </div>

        <div className="flex flex-col">
          {filtered.map((s) => (
            <StockRow key={s.symbol} stock={s} isWatched={watchlist.includes(s.symbol)} onToggleWatch={toggleWatch} onSelect={onOpenStock} />
          ))}
          {filtered.length === 0 && (
            <div style={{ color: theme.textFaint, fontFamily: fonts.body, fontSize: 13 }} className="mt-4 text-center">
              No matches{query ? ` for "${query}"` : ""}. Try a different symbol or name.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
