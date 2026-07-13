# Incognito

A dark, gold-accented mobile banking + investing concept app, built as a portfolio project. Incognito simulates the core experience of a modern banking app — accounts, transfers, savings, card management, budgeting — alongside an investing tab with live market data.

> **Note:** This is a demo/portfolio project. No real money moves, no real bank accounts are connected, and no real card numbers are shown. All financial data is simulated and stored locally in the browser.

---

## Features

**Home**
- Total balance with an "Incognito mode" toggle that masks every amount across the whole app
- Multiple accounts (Checking, Savings, Joint) with balances and quick actions
- Savings Pot with goal progress and gross interest rate
- Recent activity feed, auto-categorized transactions
- Monthly spending breakdown and balance trend charts

**Payments**
- Searchable contacts and saved payees
- Send / request money
- Pay someone new (name, sort code, account number)
- Standing orders / recurring payments
- Direct debit management with block/unblock

**Invest**
- Live market data (stocks, ETFs, crypto) via the Finnhub API
- Watchlist with real-time price updates and mini charts
- Full market browser filterable by category (Tech, ETFs, Crypto, UK Stocks)
- "Recommended for you" based on current holdings
- Buy flow with portfolio tracking

**Card**
- Virtual card with tap-to-reveal number, CVC, and expiry (mock data, hidden by default)
- Freeze/unfreeze card
- Per-card spending limits and merchant category blocking
- Subscription management (e.g. block/unblock Amazon Prime)

**Account & Security**
- Sign-up / login flow with per-user generated data
- Mock PIN lock screen
- Settings: profile, PIN, connected payees
- Notification feed for account activity
- Statements with date range filtering and CSV export

---

## Tech stack

- **React** (Vite)
- **Tailwind CSS** for layout
- **Recharts** for charts and sparklines
- **lucide-react** for icons
- **Finnhub API** for live market data
- Local persistence via `window.storage` (no backend/database)

---

## Getting started

### Prerequisites
- [Node.js](https://nodejs.org) 18 or later
- A free [Finnhub](https://finnhub.io/register) API key (for live market data)

### Installation

```bash
git clone https://github.com/mosesipoba212/incognito-banking-app.git
cd incognito-banking-app
npm install
```

### Environment variables

Create a `.env` file in the project root:
Get a free key by signing up at [finnhub.io](https://finnhub.io/register) — the free tier covers this project's needs. If no key is set, the app falls back to simulated market data automatically.

### Run locally

```bash
npm run dev
```

Then open the local URL shown in your terminal (usually `http://localhost:5173`).

### Build for production

```bash
npm run build
```

Output is generated in the `dist/` folder.

---

## Deployment (Vercel)

**Via dashboard:**
1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. **Add New → Project** → select this repository
3. Vercel auto-detects the Vite build settings
4. Add `VITE_FINNHUB_API_KEY` under Environment Variables
5. Deploy

**Via CLI:**
```bash
npm install -g vercel
vercel
```

Every push to `main` will auto-redeploy once the GitHub repo is linked.

---

## Project structure
incognito/
├── src/
│   ├── components/     # UI components (sheets, cards, nav, etc.)
│   ├── hooks/           # Custom hooks (market data polling, storage, etc.)
│   ├── utils/            # Formatting, theme tokens, constants
│   └── App.jsx           # Main app entry
├── public/
├── .env                 # Local environment variables (not committed)
├── vite.config.js
└── package.json

---

## Limitations

This is a portfolio/demo project, not a production banking app. It intentionally does not include:
- Real money movement or bank account connections
- Identity verification (KYC) or regulatory compliance
- Server-side authentication or a real database
- Real card issuance

All balances, transactions, and card details are generated client-side for demonstration purposes.

---

## Author

Built by [Moses Ipoba](https://github.com/mosesipoba212) — [LinkedIn](https://linkedin.com/in/mosesipoba)
