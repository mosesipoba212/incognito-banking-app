# incognito-banking-app
A concept mobile banking app with live market data, built with React"

## Live market data (optional)

The Invest tab uses the [Finnhub](https://finnhub.io) free-tier API for real stock/ETF/crypto quotes and price history. Without a key, the app falls back to bundled mock data and shows a "live data unavailable" indicator.

To enable live data:

1. Sign up for a free API key at https://finnhub.io/register.
2. Copy `.env.example` to `.env` in the project root.
3. Set `VITE_FINNHUB_API_KEY=<your key>` in `.env`.
4. Restart the dev server so Vite picks up the new env var.

`.env` is gitignored — never commit your API key.
