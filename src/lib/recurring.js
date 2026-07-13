import { fmtGBP } from "./format.js";
import { makeNotification } from "./storage.js";

// Runs any direct debits / scheduled payments that are due, simulating what
// a bank's overnight batch job would do. Pure function — takes the current
// slice of state and returns the next slice, so the caller decides whether
// (and how) to setState. Called once per app open.
export function runDueRecurring({ accounts, activity, directDebits, scheduledPayments, cards }) {
  const now = new Date();
  const notifications = [];
  let workingAccounts = accounts;
  let workingActivity = activity;
  let changed = false;

  function charge(accountId, amount) {
    const acc = workingAccounts.find((a) => a.id === accountId && !a.closedAt);
    if (!acc || acc.balance < amount) return false;
    workingAccounts = workingAccounts.map((a) =>
      a.id === accountId ? { ...a, balance: Math.round((a.balance - amount) * 100) / 100 } : a
    );
    return true;
  }

  function logActivity(entry) {
    workingActivity = [
      { id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, date: "Today", createdAt: now.toISOString(), ...entry },
      ...workingActivity,
    ];
  }

  const blockedCategories = new Set(cards.flatMap((c) => c.blockedCategories));

  const nextDirectDebits = directDebits.map((dd) => {
    if (dd.blocked || blockedCategories.has(dd.category)) return dd;
    const last = dd.lastCharged ? new Date(dd.lastCharged) : null;
    const chargedThisMonth = last && last.getFullYear() === now.getFullYear() && last.getMonth() === now.getMonth();
    if (chargedThisMonth || now.getDate() < dd.dayOfMonth) return dd;

    changed = true;
    if (!charge(dd.accountId, dd.amount)) {
      notifications.push(makeNotification("directDebit", `${dd.merchant} payment of ${fmtGBP(dd.amount)} failed — insufficient funds`));
      return dd;
    }
    logActivity({ accountId: dd.accountId, name: dd.merchant, sub: "Direct debit", amount: -dd.amount, kind: "debit", category: dd.category });
    notifications.push(makeNotification("directDebit", `${dd.merchant} charged ${fmtGBP(dd.amount)}`));
    return { ...dd, lastCharged: now.toISOString() };
  });

  const nextScheduledPayments = scheduledPayments.map((sp) => {
    if (!sp.active || new Date(sp.nextDate) > now) return sp;

    changed = true;
    if (!charge(sp.accountId, sp.amount)) {
      notifications.push(makeNotification("scheduled", `Scheduled payment to ${sp.payeeName} failed — insufficient funds`));
      return sp;
    }
    logActivity({ accountId: sp.accountId, name: sp.payeeName, sub: "Scheduled payment", amount: -sp.amount, kind: "debit", category: "Transfers" });
    notifications.push(makeNotification("scheduled", `Scheduled payment of ${fmtGBP(sp.amount)} sent to ${sp.payeeName}`));
    const next = new Date(sp.nextDate);
    if (sp.frequency === "weekly") next.setDate(next.getDate() + 7);
    else next.setMonth(next.getMonth() + 1);
    return { ...sp, nextDate: next.toISOString() };
  });

  return {
    changed,
    accounts: workingAccounts,
    activity: workingActivity,
    directDebits: nextDirectDebits,
    scheduledPayments: nextScheduledPayments,
    notifications,
  };
}
