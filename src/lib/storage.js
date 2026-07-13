// ---------------------------------------------------------------------------
// Client-side persistence for the Incognito demo.
//
// This is NOT real banking security: PINs and passwords are obfuscated with
// a trivial reversible-strength scheme (not a real KDF), no money actually
// moves anywhere, and everything lives in localStorage on the visitor's own
// machine. Good enough for a demo login, nowhere near good enough for real
// money or a real bank account.
// ---------------------------------------------------------------------------

const USERS_KEY = "incognito_users";
const SESSION_KEY = "incognito_session";

function readUsers() {
  try {
    const raw = window.localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeUsers(users) {
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// Not cryptography — just enough obfuscation that a password isn't sitting
// around in plain text in localStorage during the demo.
function hashPassword(password) {
  let h = 0;
  for (let i = 0; i < password.length; i++) {
    h = (Math.imul(31, h) + password.charCodeAt(i)) | 0;
  }
  return `h${h}.${window.btoa(unescape(encodeURIComponent(password))).split("").reverse().join("")}`;
}

function randomDigits(n) {
  let s = "";
  for (let i = 0; i < n; i++) s += Math.floor(Math.random() * 10);
  return s;
}

function uid(prefix) {
  return `${prefix}_${Date.now()}_${randomDigits(4)}`;
}

function initials(name) {
  return name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

export function userInitials(name) {
  return initials(name);
}

// ---------------------------------------------------------------------------
// Sort code / account number helpers (mock UK-style formatting + validation)
// ---------------------------------------------------------------------------
export function generateSortCode() {
  return `${randomDigits(2)}-${randomDigits(2)}-${randomDigits(2)}`;
}

export function isValidSortCode(s) {
  return /^\d{2}-?\d{2}-?\d{2}$/.test((s || "").trim());
}

export function isValidAccountNumber(s) {
  return /^\d{8}$/.test((s || "").replace(/\s/g, ""));
}

export function formatSortCode(input) {
  const d = (input || "").replace(/\D/g, "").padEnd(6, "0").slice(0, 6);
  return `${d.slice(0, 2)}-${d.slice(2, 4)}-${d.slice(4, 6)}`;
}

// ---------------------------------------------------------------------------
// Account / card factories
// ---------------------------------------------------------------------------
const ACCOUNT_TYPE_LABEL = { current: "Current", savings: "Savings", joint: "Joint" };

/**
 * Builds a new account record with a freshly generated mock sort code and
 * account number.
 * @param {{type: 'current'|'savings'|'joint', name?: string, balance?: number}} opts
 * @returns {object} A full account record ready to push into `user.accounts`.
 */
export function createAccount({ type, name, balance = 0 }) {
  const sortCode = generateSortCode();
  const accountNumber = randomDigits(8);
  return {
    id: uid("acc"),
    type,
    name: name || ACCOUNT_TYPE_LABEL[type] || "Account",
    sortCode,
    accountNumber,
    number: `${sortCode} · ${accountNumber}`,
    balance: Math.round(balance * 100) / 100,
    rate: type === "savings" ? 1.44 : undefined,
    openedAt: new Date().toISOString(),
    closedAt: null,
  };
}

// Mock card details only — generated client-side for the demo, never real
// card data, never sent anywhere.
export function createCard(accountId, name = "Virtual card") {
  const now = new Date();
  const expYear = (now.getFullYear() + 3 + Math.floor(Math.random() * 3)) % 100;
  const expMonth = 1 + Math.floor(Math.random() * 12);
  return {
    id: uid("card"),
    accountId,
    name,
    number: `4${randomDigits(3)} ${randomDigits(4)} ${randomDigits(4)} ${randomDigits(4)}`,
    cvc: randomDigits(3),
    expiry: `${String(expMonth).padStart(2, "0")}/${String(expYear).padStart(2, "0")}`,
    frozen: false,
    limit: 2000,
    blockedCategories: [],
  };
}

export function makeNotification(type, message) {
  return { id: uid("note"), type, message, createdAt: new Date().toISOString(), read: false };
}

// ---------------------------------------------------------------------------
// Starter data for a brand-new signup
// ---------------------------------------------------------------------------
const STARTER_WATCHLISTS = [
  ["VWRP", "VUAG", "AAPL", "NVDA", "TSLA"],
  ["VWRP", "MSFT", "GOOGL", "BTC", "GLD"],
  ["VUAG", "AAPL", "AMZN", "ETH", "BP"],
];

const STARTER_BUDGETS = { Groceries: 250, Transport: 80, Subscriptions: 40, Dining: 120, Shopping: 150 };

function daysAgoLabel(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function generateStarterData() {
  const balanceSeed = 400 + Math.random() * 1600;
  const savingsSeed = Math.random() * 80;

  const checking = createAccount({ type: "current", name: "Checking", balance: balanceSeed });
  const savings = createAccount({ type: "savings", name: "Savings Pot", balance: savingsSeed });

  const balanceHistory = [];
  let v = balanceSeed + savingsSeed;
  for (let i = 29; i >= 0; i--) {
    v = Math.max(50, v * (1 + (Math.random() - 0.5) * 0.05));
    balanceHistory.push({ day: i, date: daysAgoLabel(i), balance: Math.round(v * 100) / 100 });
  }
  balanceHistory[balanceHistory.length - 1].balance = Math.round(checking.balance + savings.balance * 100) / 100;

  const today = new Date().getDate();

  return {
    accounts: [checking, savings],
    cards: [createCard(checking.id, "Main card")],
    activity: [],
    payees: [],
    scheduledPayments: [],
    directDebits: [
      {
        id: uid("dd"),
        merchant: "Amazon Prime",
        amount: 4.49,
        category: "Subscriptions",
        dayOfMonth: today,
        blocked: false,
        accountId: checking.id,
        lastCharged: null,
      },
      {
        id: uid("dd"),
        merchant: "Spotify",
        amount: 10.99,
        category: "Subscriptions",
        dayOfMonth: today,
        blocked: false,
        accountId: checking.id,
        lastCharged: null,
      },
    ],
    requests: [],
    budgets: { ...STARTER_BUDGETS },
    goals: [],
    roundUp: { enabled: false, goalId: null },
    notifications: [],
    watchlist: STARTER_WATCHLISTS[Math.floor(Math.random() * STARTER_WATCHLISTS.length)],
    portfolio: {},
    investCash: Math.round(Math.random() * 100 * 100) / 100,
    balanceHistory,
    pin: null,
    pinEnabled: true,
    txnPinThreshold: 100,
  };
}

// ---------------------------------------------------------------------------
// Migration: users created before the multi-account/PIN/budgets rewrite had
// a single checking/savings/card shape. Upgrade them in place, once, the
// first time they're read back.
// ---------------------------------------------------------------------------
function migrateUser(user) {
  if (user.accounts) return user;

  const checking = {
    id: "acc_checking",
    type: "current",
    name: "Checking",
    sortCode: user.checking?.number?.split(" · ")[0] || generateSortCode(),
    accountNumber: user.checking?.number?.split(" · ")[1] || randomDigits(8),
    number: user.checking?.number || "",
    balance: user.checking?.balance || 0,
    openedAt: user.createdAt,
    closedAt: null,
  };
  const savings = {
    id: "acc_savings",
    type: "savings",
    name: "Savings Pot",
    sortCode: user.savings?.number?.split(" · ")[0] || generateSortCode(),
    accountNumber: user.savings?.number?.split(" · ")[1] || randomDigits(8),
    number: user.savings?.number || "",
    balance: user.savings?.balance || 0,
    rate: user.savings?.rate || 1.44,
    openedAt: user.createdAt,
    closedAt: null,
  };
  const card = user.card
    ? {
        id: "card_1",
        accountId: checking.id,
        name: "Main card",
        number: user.card.number,
        cvc: user.card.cvc,
        expiry: user.card.expiry,
        frozen: Boolean(user.cardFrozen),
        limit: 2000,
        blockedCategories: [],
      }
    : createCard(checking.id);

  const payees = (user.contacts || []).map((c) => ({
    id: uid("payee"),
    name: c.name,
    sortCode: generateSortCode(),
    accountNumber: randomDigits(8),
    last: c.last,
    date: c.date,
  }));

  const activity = (user.activity || []).map((a) => ({ ...a, accountId: checking.id }));

  const directDebits = [
    {
      id: uid("dd"),
      merchant: "Amazon Prime",
      amount: 4.49,
      category: "Subscriptions",
      dayOfMonth: new Date().getDate(),
      blocked: Boolean(user.primeBlocked),
      accountId: checking.id,
      lastCharged: null,
    },
  ];

  const { checking: _c, savings: _s, card: _card, cardFrozen: _cf, primeBlocked: _pb, contacts: _contacts, ...rest } =
    user;

  return {
    ...rest,
    accounts: [checking, savings],
    cards: [card],
    activity,
    payees,
    scheduledPayments: [],
    directDebits,
    requests: [],
    budgets: { ...STARTER_BUDGETS },
    goals: [],
    roundUp: { enabled: false, goalId: null },
    notifications: [],
    pin: null,
    pinEnabled: true,
    txnPinThreshold: 100,
  };
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
/**
 * Creates a new user with freshly generated starter accounts/cards/data
 * (see {@link generateStarterData}), persists it, and starts a session.
 * @throws {Error} If the email is already registered.
 */
export function signUp({ name, email, password }) {
  const users = readUsers();
  const normalizedEmail = email.trim().toLowerCase();
  if (users.some((u) => u.email === normalizedEmail)) {
    throw new Error("An account with that email already exists.");
  }
  const user = {
    id: uid("u"),
    name: name.trim(),
    email: normalizedEmail,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
    ...generateStarterData(),
  };
  users.push(user);
  writeUsers(users);
  setSession(user.id);
  return user;
}

/**
 * Verifies credentials, transparently upgrading a pre-multi-account user
 * record via {@link migrateUser} if needed, and starts a session.
 * @throws {Error} If the email/password combination doesn't match.
 */
export function logIn({ email, password }) {
  const users = readUsers();
  const normalizedEmail = email.trim().toLowerCase();
  let user = users.find((u) => u.email === normalizedEmail);
  if (!user || user.passwordHash !== hashPassword(password)) {
    throw new Error("Incorrect email or password.");
  }
  if (!user.accounts) {
    user = migrateUser(user);
    saveUser(user);
  }
  setSession(user.id);
  return user;
}

export function logOut() {
  window.localStorage.removeItem(SESSION_KEY);
}

export function setSession(userId) {
  window.localStorage.setItem(SESSION_KEY, userId);
}

export function getSessionUser() {
  const userId = window.localStorage.getItem(SESSION_KEY);
  if (!userId) return null;
  const users = readUsers();
  let user = users.find((u) => u.id === userId) || null;
  if (user && !user.accounts) {
    user = migrateUser(user);
    saveUser(user);
  }
  return user;
}

export function saveUser(user) {
  const users = readUsers();
  const idx = users.findIndex((u) => u.id === user.id);
  if (idx === -1) return;
  users[idx] = user;
  writeUsers(users);
}

// Mock PIN check — same non-cryptographic obfuscation as the password.
export function checkPin(user, pin) {
  return user.pin === pin;
}
