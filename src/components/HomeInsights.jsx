import { useMemo } from "react";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";
import { theme, fonts } from "../lib/theme.js";
import { fmtGBP } from "../lib/format.js";
import { SPEND_CATEGORIES, CATEGORY_COLORS } from "../lib/categorize.js";
import { monthlySpendByCategory } from "../lib/spend.js";

function BalanceTooltip({ active, payload, hideBalance }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div
      style={{ background: theme.surface2, border: `1px solid ${theme.border}`, color: theme.text }}
      className="px-2.5 py-1.5 rounded-lg text-xs"
    >
      <div style={{ color: theme.textFaint, fontSize: 10 }}>{point.date}</div>
      <div style={{ fontFamily: fonts.mono }}>{fmtGBP(point.balance, hideBalance)}</div>
    </div>
  );
}

export function BalanceTrendChart({ balanceHistory, hideBalance }) {
  if (!balanceHistory || balanceHistory.length < 2) return null;
  const first = balanceHistory[0].balance;
  const last = balanceHistory[balanceHistory.length - 1].balance;
  const changePct = first ? ((last - first) / first) * 100 : 0;
  const positive = changePct >= 0;

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.border}` }} className="rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div style={{ color: theme.textDim, fontFamily: fonts.body, fontSize: 13 }}>Balance · last 30 days</div>
        <div style={{ color: positive ? theme.green : theme.red, fontFamily: fonts.mono, fontSize: 12 }}>
          {hideBalance ? "••••" : `${positive ? "+" : ""}${changePct.toFixed(1)}%`}
        </div>
      </div>
      <div style={{ height: 90 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={balanceHistory}>
            <defs>
              <linearGradient id="balanceTrendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={theme.accent} stopOpacity={0.35} />
                <stop offset="100%" stopColor={theme.accent} stopOpacity={0} />
              </linearGradient>
            </defs>
            {!hideBalance && (
              <Tooltip content={<BalanceTooltip hideBalance={hideBalance} />} cursor={{ stroke: theme.border }} />
            )}
            <Area
              type="monotone"
              dataKey="balance"
              stroke={theme.accent}
              strokeWidth={2}
              fill="url(#balanceTrendFill)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function SpendingBreakdown({ activity, budgets, hideBalance, onManageBudgets }) {
  const rows = useMemo(() => {
    const totals = monthlySpendByCategory(activity);
    return SPEND_CATEGORIES.map((category) => ({ category, amount: totals[category] || 0 })).filter(
      (row) => row.amount > 0
    );
  }, [activity]);
  const total = rows.reduce((sum, r) => sum + r.amount, 0);
  const max = Math.max(...rows.map((r) => r.amount), 0);

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.border}` }} className="rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div style={{ color: theme.textDim, fontFamily: fonts.body, fontSize: 13 }}>Spending this month</div>
        <div className="flex items-center gap-2">
          <span style={{ color: theme.text, fontFamily: fonts.mono, fontSize: 13 }}>{fmtGBP(total, hideBalance)}</span>
          {onManageBudgets && (
            <button onClick={onManageBudgets} style={{ color: theme.accent, fontFamily: fonts.body, fontSize: 11.5 }}>
              Manage
            </button>
          )}
        </div>
      </div>
      {rows.length === 0 ? (
        <div style={{ color: theme.textFaint, fontFamily: fonts.body, fontSize: 12.5 }} className="py-2">
          No spending recorded yet this month.
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {rows.map((r) => {
            const limit = budgets?.[r.category];
            const pct = limit ? (r.amount / limit) * 100 : null;
            const overBudget = pct !== null && pct >= 100;
            const nearBudget = pct !== null && pct >= 80 && pct < 100;
            return (
              <div key={r.category}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span style={{ width: 7, height: 7, borderRadius: 999, background: CATEGORY_COLORS[r.category] }} />
                    <span style={{ color: theme.text, fontFamily: fonts.body, fontSize: 12.5 }}>{r.category}</span>
                    {overBudget && (
                      <span style={{ color: theme.red, fontFamily: fonts.body, fontSize: 10.5 }}>over budget</span>
                    )}
                    {nearBudget && (
                      <span style={{ color: theme.accent, fontFamily: fonts.body, fontSize: 10.5 }}>near limit</span>
                    )}
                  </div>
                  <span style={{ color: theme.textDim, fontFamily: fonts.mono, fontSize: 12 }}>
                    {fmtGBP(r.amount, hideBalance)}
                    {limit ? ` / ${fmtGBP(limit, hideBalance)}` : ""}
                  </span>
                </div>
                <div style={{ background: theme.surface2, height: 5, borderRadius: 999 }}>
                  <div
                    style={{
                      background: overBudget ? theme.red : nearBudget ? theme.accent : CATEGORY_COLORS[r.category],
                      height: 5,
                      borderRadius: 999,
                      width: `${limit ? Math.min(100, pct) : max ? (r.amount / max) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
