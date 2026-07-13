// Keyword-based auto-categorization for payee/merchant names. Order matters —
// more specific rules (e.g. "prime" → Subscriptions) must come before looser
// ones that would otherwise also match (e.g. "amazon" → Shopping).
export const SPEND_CATEGORIES = [
  "Groceries",
  "Transport",
  "Subscriptions",
  "Dining",
  "Shopping",
  "Bills",
  "Entertainment",
  "Other",
];

// Card-level merchant-category blocking (distinct taxonomy from spend
// categories — "Subscriptions" deliberately overlaps so blocking it on a
// card also flags matching direct debits, e.g. Amazon Prime/Spotify).
export const CARD_BLOCK_CATEGORIES = ["Gambling", "Online purchases", "ATM withdrawals", "International", "Subscriptions"];

// Fixed hue order so a category never repaints when others appear/disappear
// (shared by the Home spending chart and the Budgets screen).
export const CATEGORY_COLORS = {
  Groceries: "#74C69D",
  Transport: "#6EA8D8",
  Subscriptions: "#C6A06A",
  Dining: "#E1725A",
  Shopping: "#B084CC",
  Bills: "#D8C56E",
  Entertainment: "#6ED8C5",
  Other: "#8D8F99",
};

// Every keyword is wrapped in word boundaries (`\b`) so a short token like
// "tfl" or "bus" only matches as a whole word — without this, "tfl" was
// matching the middle of "ne-TFL-ix" and miscategorizing Netflix as
// Transport instead of Subscriptions.
const RULES = [
  [/\b(tesco|sainsbury|asda|aldi|lidl|waitrose|morrisons|grocery|groceries|market)\b/i, "Groceries"],
  [/\buber\b(?!\s*eats)|\b(lyft|train|tfl|bus|taxi|fuel|petrol|parking|railway)\b/i, "Transport"],
  [/\b(netflix|spotify|prime|disney\+|subscription|gym|membership|icloud|apple\s*music)\b/i, "Subscriptions"],
  [/\b(restaurant|cafe|coffee|deliveroo|just\s*eat|uber\s*eats|dining|takeaway|starbucks|costa)\b/i, "Dining"],
  [/\b(amazon|shop|store|zara|asos|shopping|mall|retail)\b/i, "Shopping"],
  [/\b(rent|mortgage|council|utility|utilities|electric|water\s*board|broadband|insurance)\b/i, "Bills"],
  [/\b(cinema|steam|playstation|xbox|concert|ticket|theatre)\b/i, "Entertainment"],
];

export function categorize(name) {
  const n = (name || "").toLowerCase();
  for (const [re, category] of RULES) {
    if (re.test(n)) return category;
  }
  return "Other";
}
