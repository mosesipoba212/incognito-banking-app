import React, { Suspense, lazy, useEffect, useMemo, useState } from "react";
import {
  ArrowRightLeft, CreditCard,
  LineChart as LineChartIcon, Home as HomeIcon, Check,
} from "lucide-react";
import { theme, fonts } from "./lib/theme.js";
import { STOCK_UNIVERSE, FINNHUB_SYMBOL_MAP } from "./lib/stocks.js";
import { fetchQuote, fetchHistory } from "./lib/market.js";
import { fmtGBP } from "./lib/format.js";
import { categorize } from "./lib/categorize.js";
import { monthlySpendByCategory } from "./lib/spend.js";
import { runDueRecurring } from "./lib/recurring.js";
import {
  getSessionUser, saveUser, logOut, userInitials, checkPin,
  createAccount, createCard, makeNotification,
} from "./lib/storage.js";

import AuthScreen from "./components/AuthScreen.jsx";
import PinLock from "./components/PinLock.jsx";
import PaymentsTab from "./components/PaymentsTab.jsx";
import HomeTab from "./components/HomeTab.jsx";
import TransferSheets from "./components/TransferSheets.jsx";
import { Header, Spinner } from "./components/ui.jsx";

// Everything below is only needed once a user actually opens that tab/screen
// — Home (always visible right after login) stays a static import above so
// there's no loading flash on the most common path; these are all optional
// detours, so they're worth splitting into their own chunks.
const MarketTab = lazy(() => import("./components/MarketTab.jsx"));
const CardsTabContent = lazy(() => import("./components/screens/CardsTabContent.jsx"));
const AccountsScreen = lazy(() => import("./components/screens/AccountsScreen.jsx"));
const ScheduledPaymentsScreen = lazy(() => import("./components/screens/ScheduledPaymentsScreen.jsx"));
const DirectDebitsScreen = lazy(() => import("./components/screens/DirectDebitsScreen.jsx"));
const RequestsScreen = lazy(() => import("./components/screens/RequestsScreen.jsx"));
const BudgetsScreen = lazy(() => import("./components/screens/BudgetsScreen.jsx"));
const GoalsScreen = lazy(() => import("./components/screens/GoalsScreen.jsx"));
const SettingsScreen = lazy(() => import("./components/screens/SettingsScreen.jsx"));
const StatementsScreen = lazy(() => import("./components/screens/StatementsScreen.jsx"));
const HelpScreen = lazy(() => import("./components/screens/HelpScreen.jsx"));
const SupportChatScreen = lazy(() => import("./components/screens/SupportChatScreen.jsx"));
const NotificationsScreen = lazy(() => import("./components/screens/NotificationsScreen.jsx"));
const MoreMenu = lazy(() => import("./components/screens/MoreMenu.jsx"));

function LazyFallback() {
  return (
    <div className="absolute inset-0 z-[45] flex items-center justify-center" style={{ background: theme.bg }}>
      <Spinner size={22} />
    </div>
  );
}

function LazyTabFallback() {
  return (
    <div className="flex items-center justify-center py-16">
      <Spinner size={20} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Auth + PIN lock gate
// ---------------------------------------------------------------------------
/**
 * App root. Gates access in three stages: signed out → {@link AuthScreen},
 * signed in but no PIN set → {@link PinLock} in "set" mode, signed in and
 * locked → {@link PinLock} in "unlock" mode. Once past all three, renders
 * {@link Dashboard}. `unlocked` is session-only React state (not persisted),
 * so every fresh page load re-locks — that's the "shown on app open" PIN
 * behaviour.
 */
export default function IncognitoApp() {
  const [currentUser, setCurrentUser] = useState(() => getSessionUser());
  const [unlocked, setUnlocked] = useState(false);

  if (!currentUser) {
    return (
      <AuthScreen
        onAuth={(u) => {
          setCurrentUser(u);
          setUnlocked(false);
        }}
      />
    );
  }

  if (!currentUser.pin) {
    return (
      <PinLock
        mode="set"
        onSetPin={(pin) => {
          const updated = { ...currentUser, pin };
          saveUser(updated);
          setCurrentUser(updated);
          setUnlocked(true);
        }}
      />
    );
  }

  if (!unlocked) {
    return (
      <PinLock
        mode="unlock"
        userName={currentUser.name.split(/\s+/)[0]}
        onUnlock={(pin) => {
          const ok = checkPin(currentUser, pin);
          if (ok) setUnlocked(true);
          return ok;
        }}
      />
    );
  }

  return (
    <Dashboard
      user={currentUser}
      onLogout={() => {
        logOut();
        setCurrentUser(null);
        setUnlocked(false);
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Main dashboard (post-login, post-PIN)
// ---------------------------------------------------------------------------
/**
 * Owns all app state for a logged-in session (accounts, cards, activity,
 * payees, scheduled payments, direct debits, budgets, goals, notifications,
 * live market quotes, …) and every handler that mutates it. Presentational
 * pieces are split out — {@link HomeTab}, {@link PaymentsTab},
 * {@link TransferSheets}, and the lazy-loaded screens/tabs — and just
 * receive data + callbacks as props. Two independent navigation stacks
 * coexist: `tab` (the 4 bottom-nav tabs) and `screenStack` (push/pop full-
 * page views reached from the More menu or quick links).
 */
function Dashboard({ user, onLogout }) {
  const [tab, setTab] = useState("home");
  // A simple push/pop stack so "Back" always returns to wherever a screen
  // was actually opened from (e.g. Budgets opened from the More menu goes
  // back to More, not straight to the underlying tab).
  const [screenStack, setScreenStack] = useState([]);
  const screen = screenStack[screenStack.length - 1] || null;
  function pushScreen(name) {
    setScreenStack((s) => [...s, name]);
  }
  function popScreen() {
    setScreenStack((s) => s.slice(0, -1));
  }
  const [hideBalance, setHideBalance] = useState(false);

  const [profile, setProfile] = useState({ name: user.name, email: user.email });
  const [pin, setPin] = useState(user.pin);
  const [txnPinThreshold, setTxnPinThreshold] = useState(user.txnPinThreshold);

  const [accounts, setAccounts] = useState(user.accounts);
  const [cards, setCards] = useState(user.cards);
  const [activity, setActivity] = useState(user.activity);
  const [balanceHistory, setBalanceHistory] = useState(user.balanceHistory);
  const [payees, setPayees] = useState(user.payees);
  const [scheduledPayments, setScheduledPayments] = useState(user.scheduledPayments);
  const [directDebits, setDirectDebits] = useState(user.directDebits);
  const [requests, setRequests] = useState(user.requests);
  const [budgets, setBudgets] = useState(user.budgets);
  const [goals, setGoals] = useState(user.goals);
  const [roundUp, setRoundUp] = useState(user.roundUp);
  const [notifications, setNotifications] = useState(user.notifications);

  const [watchlist, setWatchlist] = useState(user.watchlist);
  const [portfolio, setPortfolio] = useState(user.portfolio);
  const [investCash, setInvestCash] = useState(user.investCash);

  const [sheet, setSheet] = useState(null); // 'add' | 'move' | 'send' | 'stock' | 'pinConfirm'
  const [amount, setAmount] = useState("");
  const [addToAccountId, setAddToAccountId] = useState(null);
  const [moveFromId, setMoveFromId] = useState(null);
  const [moveToId, setMoveToId] = useState(null);
  const [sendTarget, setSendTarget] = useState(null);
  const [sendFromId, setSendFromId] = useState(null);
  const [activeStock, setActiveStock] = useState(null);
  const [activeHistory, setActiveHistory] = useState(null);
  const [pendingConfirm, setPendingConfirm] = useState(null);
  const [pinConfirmError, setPinConfirmError] = useState("");
  const [sheetError, setSheetError] = useState("");

  const [toast, setToast] = useState(null);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  function fire(msg) {
    setToast(msg);
  }

  function notify(type, message) {
    setNotifications((n) => [makeNotification(type, message), ...n]);
  }

  function closeSheet() {
    setSheet(null);
    setAmount("");
    setSendTarget(null);
    setActiveStock(null);
    setPendingConfirm(null);
    setPinConfirmError("");
    setSheetError("");
  }

  const openAccounts = useMemo(() => accounts.filter((a) => !a.closedAt), [accounts]);
  const primaryAccountId = useMemo(
    () => openAccounts.find((a) => a.type === "current")?.id || openAccounts[0]?.id,
    [openAccounts]
  );
  const savingsAccounts = useMemo(() => openAccounts.filter((a) => a.type === "savings"), [openAccounts]);
  const totalBalance = useMemo(() => openAccounts.reduce((sum, a) => sum + a.balance, 0), [openAccounts]);

  const [liveQuotes, setLiveQuotes] = useState({});
  const [quotesLoading, setQuotesLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    async function refreshQuotes() {
      const results = await Promise.allSettled(
        STOCK_UNIVERSE.map(async (s) => {
          const finnhubSymbol = FINNHUB_SYMBOL_MAP[s.symbol];
          const quote = finnhubSymbol ? await fetchQuote(finnhubSymbol) : null;
          return [s.symbol, quote];
        })
      );
      if (cancelled) return;
      const next = {};
      for (const r of results) {
        if (r.status === "fulfilled" && r.value[1]) next[r.value[0]] = r.value[1];
      }
      if (Object.keys(next).length > 0) setLiveQuotes(next);
      setQuotesLoading(false);
    }
    refreshQuotes();
    // Quotes are cached for 30s in lib/market.js, so this interval is cheap:
    // it only ever produces a genuine network round-trip once the cache
    // for a given symbol has actually gone stale.
    const interval = setInterval(refreshQuotes, 45_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const [historyLoading, setHistoryLoading] = useState(false);
  useEffect(() => {
    if (!activeStock) {
      setActiveHistory(null);
      setHistoryLoading(false);
      return;
    }
    setActiveHistory(activeStock.history);
    const finnhubSymbol = FINNHUB_SYMBOL_MAP[activeStock.symbol];
    if (!finnhubSymbol) return;
    let cancelled = false;
    setHistoryLoading(true);
    fetchHistory(finnhubSymbol).then((history) => {
      if (cancelled) return;
      if (history) setActiveHistory(history);
      setHistoryLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [activeStock]);

  const portfolioValue = useMemo(
    () =>
      Object.entries(portfolio).reduce((sum, [sym, shares]) => {
        const stock = STOCK_UNIVERSE.find((s) => s.symbol === sym);
        const price = liveQuotes[sym]?.price ?? stock?.price;
        return sum + (price ? price * shares : 0);
      }, 0),
    [portfolio, liveQuotes]
  );

  // Run any due direct debits / scheduled payments once, on app open.
  useEffect(() => {
    const result = runDueRecurring({ accounts, activity, directDebits, scheduledPayments, cards });
    if (result.changed) {
      setAccounts(result.accounts);
      setActivity(result.activity);
      setDirectDebits(result.directDebits);
      setScheduledPayments(result.scheduledPayments);
      if (result.notifications.length) setNotifications((n) => [...result.notifications, ...n]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setBalanceHistory((h) => {
      if (!h.length) return h;
      const last = h[h.length - 1];
      const rounded = Math.round(totalBalance * 100) / 100;
      if (last.balance === rounded) return h;
      const copy = [...h];
      copy[copy.length - 1] = { ...last, balance: rounded };
      return copy;
    });
  }, [totalBalance]);

  // Persist everything back to this user's record whenever it changes.
  // `user` is deliberately not a dependency: it only supplies static fields
  // (id, card, account numbers) that never change during a session, and
  // including it here would just re-run this effect on every render.
  useEffect(() => {
    saveUser({
      ...user,
      name: profile.name,
      email: profile.email,
      pin,
      txnPinThreshold,
      accounts,
      cards,
      activity,
      payees,
      scheduledPayments,
      directDebits,
      requests,
      budgets,
      goals,
      roundUp,
      notifications,
      watchlist,
      portfolio,
      investCash,
      balanceHistory,
    });
  }, [
    profile, pin, txnPinThreshold, accounts, cards, activity, payees, scheduledPayments,
    directDebits, requests, budgets, goals, roundUp, notifications, watchlist, portfolio,
    investCash, balanceHistory,
  ]);

  function addActivity(entry) {
    const newEntry = { id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, date: "Today", createdAt: new Date().toISOString(), ...entry };
    const next = [newEntry, ...activity];
    setActivity(next);
    return next;
  }

  function maybeBudgetAlert(category, prevActivity, nextActivity) {
    const limit = budgets[category];
    if (!limit) return;
    const before = monthlySpendByCategory(prevActivity)[category] || 0;
    const after = monthlySpendByCategory(nextActivity)[category] || 0;
    if (before < limit && after >= limit) {
      notify("budget", `You've gone over your ${category} budget of ${fmtGBP(limit)} this month.`);
    } else if (before < limit * 0.8 && after >= limit * 0.8) {
      notify("budget", `You're close to your ${category} budget (${fmtGBP(limit)}) this month.`);
    }
  }

  function applyRoundUp(fromAccountId, spendAmount) {
    if (!roundUp.enabled || !roundUp.goalId) return;
    const diff = Math.round((Math.ceil(spendAmount) - spendAmount) * 100) / 100;
    if (diff <= 0) return;
    const goal = goals.find((g) => g.id === roundUp.goalId);
    if (!goal) return;
    setAccounts((accs) =>
      accs.map((a) => {
        if (a.id === fromAccountId) return { ...a, balance: Math.round((a.balance - diff) * 100) / 100 };
        if (a.id === goal.accountId) return { ...a, balance: Math.round((a.balance + diff) * 100) / 100 };
        return a;
      })
    );
    setGoals((gs) => gs.map((g) => (g.id === goal.id ? { ...g, saved: Math.round((g.saved + diff) * 100) / 100 } : g)));
    setActivity((a) => [
      {
        id: `act_${Date.now()}_ru`,
        accountId: fromAccountId,
        name: `Round-up to ${goal.name}`,
        sub: "Round-up savings",
        amount: -diff,
        kind: "transfer",
        category: "Savings",
        date: "Today",
        createdAt: new Date().toISOString(),
      },
      ...a,
    ]);
  }

  // Transfers above the threshold require a PIN confirmation step first.
  function confirmOrRun(amountValue, fn) {
    if (amountValue > txnPinThreshold) {
      setPendingConfirm(() => fn);
      setPinConfirmError("");
      setSheet("pinConfirm");
    } else {
      fn();
    }
  }

  function handlePinConfirm(enteredPin) {
    if (enteredPin !== pin) {
      setPinConfirmError("Incorrect PIN.");
      return;
    }
    const fn = pendingConfirm;
    closeSheet();
    if (fn) fn();
  }

  function handleAddMoney() {
    const v = parseFloat(amount);
    const targetId = addToAccountId || primaryAccountId;
    if (!v || v <= 0 || !targetId) return;
    setAccounts((accs) => accs.map((a) => (a.id === targetId ? { ...a, balance: Math.round((a.balance + v) * 100) / 100 } : a)));
    addActivity({ accountId: targetId, name: "Added money", sub: "Top-up", amount: v, kind: "credit", category: "Income" });
    fire(`Added ${fmtGBP(v)}`);
    closeSheet();
  }

  function handleMove() {
    setSheetError("");
    const v = parseFloat(amount);
    const fromId = moveFromId || primaryAccountId;
    const toId = moveToId;
    if (!v || v <= 0 || !toId || fromId === toId) return;
    const from = accounts.find((a) => a.id === fromId);
    if (!from || v > from.balance) return setSheetError(`You don't have enough in ${from?.name || "that account"} to move ${fmtGBP(v)}.`);
    const to = accounts.find((a) => a.id === toId);
    confirmOrRun(v, () => {
      setAccounts((accs) =>
        accs.map((a) => {
          if (a.id === fromId) return { ...a, balance: Math.round((a.balance - v) * 100) / 100 };
          if (a.id === toId) return { ...a, balance: Math.round((a.balance + v) * 100) / 100 };
          return a;
        })
      );
      addActivity({ accountId: fromId, name: `Transfer to ${to.name}`, sub: "Internal transfer", amount: -v, kind: "transfer", category: "Transfers" });
      addActivity({ accountId: toId, name: `Transfer from ${from.name}`, sub: "Internal transfer", amount: v, kind: "transfer", category: "Transfers" });
      fire(`Moved ${fmtGBP(v)}`);
      closeSheet();
    });
  }

  function handleSend() {
    setSheetError("");
    const v = parseFloat(amount);
    const fromId = sendFromId || primaryAccountId;
    if (!v || v <= 0 || !sendTarget || !fromId) return;
    const from = accounts.find((a) => a.id === fromId);
    if (!from || v > from.balance) return setSheetError(`You don't have enough in ${from?.name || "that account"} to send ${fmtGBP(v)}.`);
    confirmOrRun(v, () => {
      const category = categorize(sendTarget.name);
      const prevActivity = activity;
      const nextActivity = addActivity({ accountId: fromId, name: sendTarget.name, sub: "Payment sent", amount: -v, kind: "debit", category });
      setAccounts((accs) => accs.map((a) => (a.id === fromId ? { ...a, balance: Math.round((a.balance - v) * 100) / 100 } : a)));
      setPayees((ps) => ps.map((p) => (p.id === sendTarget.id ? { ...p, last: `You sent ${fmtGBP(v)}`, date: "Today" } : p)));
      maybeBudgetAlert(category, prevActivity, nextActivity);
      applyRoundUp(fromId, v);
      notify("payment", `Sent ${fmtGBP(v)} to ${sendTarget.name}`);
      fire(`Sent ${fmtGBP(v)} to ${sendTarget.name}`);
      closeSheet();
    });
  }

  function handleBuy() {
    setSheetError("");
    const v = parseFloat(amount);
    if (!v || v <= 0 || !activeStock) return;
    if (v > investCash) return setSheetError(`You only have ${fmtGBP(investCash)} of invest cash available.`);
    setInvestCash((c) => Math.round((c - v) * 100) / 100);
    setPortfolio((p) => ({ ...p, [activeStock.symbol]: (p[activeStock.symbol] || 0) + v / activeStock.price }));
    fire(`Bought ${fmtGBP(v)} of ${activeStock.symbol}`);
    closeSheet();
  }

  function toggleWatch(symbol) {
    setWatchlist((w) => (w.includes(symbol) ? w.filter((s) => s !== symbol) : [...w, symbol]));
  }

  // Accounts
  function handleOpenAccount({ type, name }) {
    const acc = createAccount({ type, name, balance: 0 });
    setAccounts((accs) => [...accs, acc]);
    fire(`${acc.name} opened`);
  }
  function handleRenameAccount(id, name) {
    setAccounts((accs) => accs.map((a) => (a.id === id ? { ...a, name } : a)));
    fire("Account renamed");
  }
  function handleCloseAccount(id) {
    const open = accounts.filter((a) => !a.closedAt);
    if (open.length <= 1) return;
    const closing = accounts.find((a) => a.id === id);
    const target = open.find((a) => a.id !== id);
    setAccounts((accs) =>
      accs.map((a) => {
        if (a.id === id) return { ...a, balance: 0, closedAt: new Date().toISOString() };
        if (a.id === target.id && closing.balance !== 0) return { ...a, balance: Math.round((a.balance + closing.balance) * 100) / 100 };
        return a;
      })
    );
    fire(`${closing.name} closed`);
  }

  // Cards
  function handleAddCard({ name, accountId }) {
    setCards((cs) => [...cs, createCard(accountId, name)]);
    fire("Virtual card created");
  }
  function handleToggleFreeze(cardId) {
    setCards((cs) => cs.map((c) => (c.id === cardId ? { ...c, frozen: !c.frozen } : c)));
    const card = cards.find((c) => c.id === cardId);
    fire(card?.frozen ? "Card unfrozen" : "Card frozen");
  }
  function handleSetCardLimit(cardId, limit) {
    setCards((cs) => cs.map((c) => (c.id === cardId ? { ...c, limit } : c)));
    fire("Spending limit updated");
  }
  function handleToggleBlockedCategory(cardId, category) {
    setCards((cs) =>
      cs.map((c) => {
        if (c.id !== cardId) return c;
        const has = c.blockedCategories.includes(category);
        return { ...c, blockedCategories: has ? c.blockedCategories.filter((x) => x !== category) : [...c.blockedCategories, category] };
      })
    );
  }

  // Payees
  function handleCreatePayee(data) {
    setPayees((ps) => [{ id: `payee_${Date.now()}`, last: "No payments yet", date: "", ...data }, ...ps]);
    fire("Payee added");
  }
  function handleDeletePayee(id) {
    setPayees((ps) => ps.filter((p) => p.id !== id));
    fire("Payee removed");
  }

  // Scheduled payments
  function handleCreateScheduled(payload) {
    setScheduledPayments((sp) => [...sp, { id: `sp_${Date.now()}`, accountId: primaryAccountId, active: true, ...payload }]);
    fire("Scheduled payment created");
  }
  function handleUpdateScheduled(id, payload) {
    setScheduledPayments((sp) => sp.map((s) => (s.id === id ? { ...s, ...payload } : s)));
    fire("Scheduled payment updated");
  }
  function handleCancelScheduled(id) {
    setScheduledPayments((sp) => sp.filter((s) => s.id !== id));
    fire("Scheduled payment cancelled");
  }

  // Direct debits
  function handleCreateDirectDebit(payload) {
    setDirectDebits((dds) => [...dds, { id: `dd_${Date.now()}`, accountId: primaryAccountId, blocked: false, lastCharged: null, ...payload }]);
    fire("Direct debit added");
  }
  function handleToggleBlockDD(id) {
    setDirectDebits((dds) => dds.map((d) => (d.id === id ? { ...d, blocked: !d.blocked } : d)));
  }

  // Requests
  function handleCreateRequest({ fromName, amount: reqAmount }) {
    setRequests((rs) => [{ id: `req_${Date.now()}`, fromName, amount: reqAmount, status: "pending", createdAt: new Date().toISOString() }, ...rs]);
    fire(`Requested ${fmtGBP(reqAmount)} from ${fromName}`);
  }
  function handleCancelRequest(id) {
    setRequests((rs) => rs.filter((r) => r.id !== id));
    fire("Request cancelled");
  }

  // Budgets
  function handleSetBudget(category, amountValue) {
    setBudgets((b) => {
      const next = { ...b };
      if (!amountValue) delete next[category];
      else next[category] = amountValue;
      return next;
    });
    fire("Budget saved");
  }

  // Goals
  function handleCreateGoal({ name, target, targetDate, accountId }) {
    setGoals((gs) => [...gs, { id: `goal_${Date.now()}`, name, target, targetDate, accountId, saved: 0 }]);
    fire("Goal created");
  }
  function handleAddFundsToGoal(goalId, v) {
    const goal = goals.find((g) => g.id === goalId);
    const from = accounts.find((a) => a.id === primaryAccountId);
    if (!goal || !from || v > from.balance) return fire("Insufficient balance");
    confirmOrRun(v, () => {
      setAccounts((accs) =>
        accs.map((a) => {
          if (a.id === primaryAccountId) return { ...a, balance: Math.round((a.balance - v) * 100) / 100 };
          if (a.id === goal.accountId) return { ...a, balance: Math.round((a.balance + v) * 100) / 100 };
          return a;
        })
      );
      setGoals((gs) => gs.map((g) => (g.id === goalId ? { ...g, saved: Math.round((g.saved + v) * 100) / 100 } : g)));
      addActivity({ accountId: primaryAccountId, name: `Added to ${goal.name}`, sub: "Savings goal", amount: -v, kind: "transfer", category: "Savings" });
      fire(`Added ${fmtGBP(v)} to ${goal.name}`);
    });
  }
  function handleDeleteGoal(id) {
    setGoals((gs) => gs.filter((g) => g.id !== id));
    fire("Goal deleted");
  }
  function handleToggleRoundUp(enabled, goalId) {
    setRoundUp({ enabled, goalId: goalId || null });
  }

  // Settings
  function handleSaveProfile(next) {
    setProfile(next);
    fire("Profile updated");
  }
  function handleChangePin(newPin) {
    setPin(newPin);
    fire("PIN changed");
  }
  function handleSetThreshold(v) {
    setTxnPinThreshold(v);
    fire("Threshold updated");
  }

  // Notifications
  function handleMarkRead(id) {
    setNotifications((ns) => ns.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }
  function handleMarkAllRead() {
    setNotifications((ns) => ns.map((n) => ({ ...n, read: true })));
  }

  const initials = userInitials(profile.name);
  const firstName = profile.name.trim().split(/\s+/)[0];
  const unreadCount = notifications.filter((n) => !n.read).length;

  const NAV = [
    { key: "home", label: "Home", icon: HomeIcon },
    { key: "payments", label: "Payments", icon: ArrowRightLeft },
    { key: "invest", label: "Invest", icon: LineChartIcon },
    { key: "card", label: "Card", icon: CreditCard },
  ];

  return (
    <div style={{ background: "#050509" }} className="min-h-screen w-full flex justify-center">
      <div style={{ background: theme.bg, fontFamily: fonts.body }} className="w-full max-w-[430px] min-h-screen flex flex-col relative">
        {/* Brand row */}
        <div className="flex items-center gap-1.5 px-5 pt-4">
          <div style={{ width: 7, height: 7, borderRadius: 999, background: theme.accent }} />
          <span style={{ color: theme.textFaint, fontFamily: fonts.mono, fontSize: 11, letterSpacing: 3 }}>INCOGNITO</span>
        </div>

        {/* ---------------- HOME ---------------- */}
        {tab === "home" && (
          <HomeTab
            firstName={firstName}
            initials={initials}
            hideBalance={hideBalance}
            setHideBalance={setHideBalance}
            unreadCount={unreadCount}
            totalBalance={totalBalance}
            openAccountsCount={openAccounts.length}
            activity={activity}
            balanceHistory={balanceHistory}
            budgets={budgets}
            onOpenMenu={() => pushScreen("more")}
            onOpenNotifications={() => pushScreen("notifications")}
            onOpenAdd={() => {
              setAddToAccountId(primaryAccountId);
              setSheet("add");
            }}
            onOpenMove={() => {
              setMoveFromId(primaryAccountId);
              setMoveToId(openAccounts.find((a) => a.id !== primaryAccountId)?.id || null);
              setSheet("move");
            }}
            onOpenSend={() => {
              setSendTarget(payees[0] || null);
              setSendFromId(primaryAccountId);
              setSheet("send");
            }}
            onViewAccounts={() => pushScreen("accounts")}
            onManageBudgets={() => pushScreen("budgets")}
          />
        )}

        {/* ---------------- PAYMENTS ---------------- */}
        {tab === "payments" && (
          <div className="flex-1 overflow-y-auto pb-28 tab-fade-in">
            <Header hideBalance={hideBalance} setHideBalance={setHideBalance} title="Payments" initials={initials} onAvatarClick={() => pushScreen("more")} onBellClick={() => pushScreen("notifications")} unreadCount={unreadCount} />
            <PaymentsTab
              payees={payees}
              onCreatePayee={handleCreatePayee}
              onSelectPayee={(p) => {
                setSendTarget(p);
                setSendFromId(primaryAccountId);
                setSheet("send");
              }}
              onNavigate={pushScreen}
            />
          </div>
        )}

        {/* ---------------- INVEST ---------------- */}
        {tab === "invest" && (
          <div className="flex-1 overflow-y-auto pb-28 tab-fade-in">
            <Header hideBalance={hideBalance} setHideBalance={setHideBalance} title="Invest" initials={initials} onAvatarClick={() => pushScreen("more")} onBellClick={() => pushScreen("notifications")} unreadCount={unreadCount} />
            <Suspense fallback={<LazyTabFallback />}>
              <MarketTab
                watchlist={watchlist}
                toggleWatch={toggleWatch}
                portfolio={portfolio}
                investCash={investCash}
                portfolioValue={portfolioValue}
                hideBalance={hideBalance}
                liveQuotes={liveQuotes}
                quotesLoading={quotesLoading}
                onOpenStock={(s) => {
                  setActiveStock(s);
                  setSheet("stock");
                }}
              />
            </Suspense>
          </div>
        )}

        {/* ---------------- CARD ---------------- */}
        {tab === "card" && (
          <div className="flex-1 overflow-y-auto pb-28 tab-fade-in">
            <Header hideBalance={hideBalance} setHideBalance={setHideBalance} title="Card" initials={initials} onAvatarClick={() => pushScreen("more")} onBellClick={() => pushScreen("notifications")} unreadCount={unreadCount} />
            <Suspense fallback={<LazyTabFallback />}>
              <CardsTabContent
                cards={cards}
                accounts={openAccounts}
                hideBalance={hideBalance}
                onAddCard={handleAddCard}
                onToggleFreeze={handleToggleFreeze}
                onSetLimit={handleSetCardLimit}
                onToggleBlockedCategory={handleToggleBlockedCategory}
              />
            </Suspense>
          </div>
        )}

        {/* ---------------- BOTTOM NAV ---------------- */}
        <div style={{ background: theme.bg, borderTop: `1px solid ${theme.border}` }} className="sticky bottom-0 w-full flex items-center justify-around py-3 z-40">
          {NAV.map((n) => {
            const Icon = n.icon;
            const active = tab === n.key;
            return (
              <button key={n.key} onClick={() => setTab(n.key)} className="flex flex-col items-center gap-1">
                <Icon size={20} color={active ? theme.accent : theme.textFaint} />
                <span style={{ color: active ? theme.accent : theme.textFaint, fontFamily: fonts.body, fontSize: 10.5 }}>{n.label}</span>
              </button>
            );
          })}
        </div>

        {/* ---------------- TOAST ---------------- */}
        {toast && (
          <div
            style={{ background: theme.surface2, border: `1px solid ${theme.border}`, color: theme.text }}
            className="fixed left-1/2 -translate-x-1/2 bottom-24 px-4 py-2.5 rounded-full text-sm z-[60] flex items-center gap-2"
          >
            <Check size={14} color={theme.green} />
            {toast}
          </div>
        )}

        {/* ---------------- SHEETS ---------------- */}
        <TransferSheets
          sheet={sheet}
          closeSheet={closeSheet}
          amount={amount}
          setAmount={setAmount}
          sheetError={sheetError}
          openAccounts={openAccounts}
          primaryAccountId={primaryAccountId}
          addToAccountId={addToAccountId}
          setAddToAccountId={setAddToAccountId}
          handleAddMoney={handleAddMoney}
          moveFromId={moveFromId}
          setMoveFromId={setMoveFromId}
          moveToId={moveToId}
          setMoveToId={setMoveToId}
          handleMove={handleMove}
          payees={payees}
          sendTarget={sendTarget}
          setSendTarget={setSendTarget}
          sendFromId={sendFromId}
          setSendFromId={setSendFromId}
          handleSend={handleSend}
          txnPinThreshold={txnPinThreshold}
          handlePinConfirm={handlePinConfirm}
          pinConfirmError={pinConfirmError}
          activeStock={activeStock}
          activeHistory={activeHistory}
          historyLoading={historyLoading}
          portfolio={portfolio}
          investCash={investCash}
          hideBalance={hideBalance}
          handleBuy={handleBuy}
        />

        {/* ---------------- FULL-PAGE SCREENS ---------------- */}
        <Suspense fallback={screen ? <LazyFallback /> : null}>
        {screen === "more" && <MoreMenu user={{ ...user, ...profile }} onBack={popScreen} onNavigate={pushScreen} />}

        {screen === "accounts" && (
          <AccountsScreen
            accounts={accounts}
            hideBalance={hideBalance}
            onBack={popScreen}
            onOpenAccount={handleOpenAccount}
            onRenameAccount={handleRenameAccount}
            onCloseAccount={handleCloseAccount}
          />
        )}

        {screen === "scheduled" && (
          <ScheduledPaymentsScreen
            scheduledPayments={scheduledPayments}
            payees={payees}
            hideBalance={hideBalance}
            onBack={popScreen}
            onCreate={handleCreateScheduled}
            onUpdate={handleUpdateScheduled}
            onCancel={handleCancelScheduled}
          />
        )}

        {screen === "directDebits" && (
          <DirectDebitsScreen
            directDebits={directDebits}
            cardBlockedCategories={[...new Set(cards.flatMap((c) => c.blockedCategories))]}
            hideBalance={hideBalance}
            onBack={popScreen}
            onToggleBlock={handleToggleBlockDD}
            onCreate={handleCreateDirectDebit}
          />
        )}

        {screen === "requests" && (
          <RequestsScreen
            requests={requests}
            payees={payees}
            hideBalance={hideBalance}
            onBack={popScreen}
            onCreate={handleCreateRequest}
            onCancel={handleCancelRequest}
          />
        )}

        {screen === "budgets" && (
          <BudgetsScreen activity={activity} budgets={budgets} hideBalance={hideBalance} onBack={popScreen} onSetBudget={handleSetBudget} />
        )}

        {screen === "goals" && (
          <GoalsScreen
            goals={goals}
            savingsAccounts={savingsAccounts}
            hideBalance={hideBalance}
            roundUp={roundUp}
            onBack={popScreen}
            onCreateGoal={handleCreateGoal}
            onAddFunds={handleAddFundsToGoal}
            onDeleteGoal={handleDeleteGoal}
            onToggleRoundUp={handleToggleRoundUp}
          />
        )}

        {screen === "settings" && (
          <SettingsScreen
            user={{ ...user, name: profile.name, email: profile.email, pin, txnPinThreshold }}
            payees={payees}
            hideBalance={hideBalance}
            setHideBalance={setHideBalance}
            onBack={popScreen}
            onSaveProfile={handleSaveProfile}
            onDeletePayee={handleDeletePayee}
            onChangePin={handleChangePin}
            onSetThreshold={handleSetThreshold}
            onLogout={onLogout}
          />
        )}

        {screen === "statements" && (
          <StatementsScreen activity={activity} accounts={accounts} hideBalance={hideBalance} onBack={popScreen} />
        )}

        {screen === "help" && <HelpScreen onBack={popScreen} onContactSupport={() => pushScreen("support")} />}

        {screen === "support" && <SupportChatScreen onBack={popScreen} />}

        {screen === "notifications" && (
          <NotificationsScreen notifications={notifications} onBack={popScreen} onMarkRead={handleMarkRead} onMarkAllRead={handleMarkAllRead} />
        )}
        </Suspense>
      </div>
    </div>
  );
}
