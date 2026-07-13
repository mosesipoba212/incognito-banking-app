import { useMemo, useState } from "react";
import { theme, fonts } from "../../lib/theme.js";
import { fmtGBP } from "../../lib/format.js";
import { SPEND_CATEGORIES, CATEGORY_COLORS } from "../../lib/categorize.js";
import { monthlySpendByCategory } from "../../lib/spend.js";
import { FullScreen, Sheet, AmountInput, PrimaryButton } from "../ui.jsx";

export default function BudgetsScreen({ activity, budgets, hideBalance, onBack, onSetBudget }) {
  const [editingCategory, setEditingCategory] = useState(null);
  const [amount, setAmount] = useState("");
  const totals = useMemo(() => monthlySpendByCategory(activity), [activity]);

  function openEdit(category) {
    setEditingCategory(category);
    setAmount(budgets[category] ? String(budgets[category]) : "");
  }

  function submit() {
    const v = parseFloat(amount);
    onSetBudget(editingCategory, v > 0 ? v : 0);
    setEditingCategory(null);
  }

  return (
    <FullScreen title="Budgets" onBack={onBack}>
      <div className="px-5 flex flex-col gap-3">
        {SPEND_CATEGORIES.filter((c) => c !== "Other").map((category) => {
          const spent = totals[category] || 0;
          const limit = budgets[category] || 0;
          const pct = limit ? Math.min(100, (spent / limit) * 100) : 0;
          const overBudget = limit > 0 && spent >= limit;
          const nearBudget = limit > 0 && !overBudget && spent / limit >= 0.8;
          return (
            <button
              key={category}
              onClick={() => openEdit(category)}
              style={{ background: theme.surface, border: `1px solid ${theme.border}` }}
              className="rounded-2xl p-4 text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span style={{ width: 7, height: 7, borderRadius: 999, background: CATEGORY_COLORS[category] }} />
                  <span style={{ color: theme.text, fontFamily: fonts.body, fontSize: 13.5 }}>{category}</span>
                </div>
                <span style={{ color: theme.textDim, fontFamily: fonts.mono, fontSize: 12.5 }}>
                  {fmtGBP(spent, hideBalance)} {limit ? `/ ${fmtGBP(limit, hideBalance)}` : "· no limit set"}
                </span>
              </div>
              <div style={{ background: theme.surface2, height: 6, borderRadius: 999 }}>
                <div
                  style={{
                    background: overBudget ? theme.red : nearBudget ? theme.accent : CATEGORY_COLORS[category],
                    height: 6,
                    borderRadius: 999,
                    width: `${limit ? pct : 0}%`,
                  }}
                />
              </div>
              {overBudget && (
                <div style={{ color: theme.red, fontFamily: fonts.body, fontSize: 11, marginTop: 6 }}>
                  Over budget by {fmtGBP(spent - limit, hideBalance)}
                </div>
              )}
              {nearBudget && (
                <div style={{ color: theme.accent, fontFamily: fonts.body, fontSize: 11, marginTop: 6 }}>
                  Approaching your limit
                </div>
              )}
            </button>
          );
        })}
      </div>

      {editingCategory && (
        <Sheet title={`${editingCategory} budget`} onClose={() => setEditingCategory(null)}>
          <div style={{ color: theme.textFaint, fontFamily: fonts.body, fontSize: 12.5 }} className="mb-3">
            Monthly limit — set to £0 to remove.
          </div>
          <AmountInput value={amount} onChange={setAmount} autoFocus />
          <PrimaryButton onClick={submit}>Save limit</PrimaryButton>
        </Sheet>
      )}
    </FullScreen>
  );
}
