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
