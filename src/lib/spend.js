// Shared "how much did the user spend, by category, this calendar month"
// calculation — used by the Home spending chart and the Budgets screen so
// the two never drift apart.
export function monthlySpendByCategory(activity) {
  const now = new Date();
  const totals = {};
  for (const a of activity) {
    if (a.kind !== "debit" || !a.createdAt) continue;
    const d = new Date(a.createdAt);
    if (d.getFullYear() !== now.getFullYear() || d.getMonth() !== now.getMonth()) continue;
    const category = a.category || "Other";
    totals[category] = (totals[category] || 0) + Math.abs(a.amount);
  }
  return totals;
}
