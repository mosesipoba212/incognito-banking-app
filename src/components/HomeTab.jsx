import { Plus, ArrowRightLeft, Send, ChevronRight, Wallet, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { theme, fonts } from "../lib/theme.js";
import { fmtGBP } from "../lib/format.js";
import { ActionBtn, Header, EmptyState } from "./ui.jsx";
import { BalanceTrendChart, SpendingBreakdown } from "./HomeInsights.jsx";

/**
 * The Home tab: balance hero, quick actions, accounts summary, insight
 * charts, and the recent-activity feed. Purely presentational — all state
 * lives in the Dashboard component in incognito-app.jsx.
 */
export default function HomeTab({
  firstName,
  initials,
  hideBalance,
  setHideBalance,
  unreadCount,
  totalBalance,
  openAccountsCount,
  activity,
  balanceHistory,
  budgets,
  onOpenMenu,
  onOpenNotifications,
  onOpenAdd,
  onOpenMove,
  onOpenSend,
  onViewAccounts,
  onManageBudgets,
}) {
  return (
    <div className="flex-1 overflow-y-auto pb-28 tab-fade-in">
      <Header
        hideBalance={hideBalance}
        setHideBalance={setHideBalance}
        greeting={`Good to see you, ${firstName}`}
        initials={initials}
        onAvatarClick={onOpenMenu}
        onBellClick={onOpenNotifications}
        unreadCount={unreadCount}
      />

      <div className="px-5 mt-3">
        <div style={{ color: theme.accent, fontFamily: fonts.mono, fontSize: 11, letterSpacing: 2 }}>TOTAL BALANCE</div>
        <div
          key={hideBalance ? "hidden" : "shown"}
          className="fade-in"
          style={{ color: theme.text, fontFamily: fonts.display, fontSize: 44, lineHeight: 1.1, marginTop: 4 }}
        >
          {fmtGBP(totalBalance, hideBalance)}
        </div>

        <div className="flex gap-3 mt-6">
          <ActionBtn icon={<Plus size={18} />} label="Add money" onClick={onOpenAdd} />
          <ActionBtn icon={<ArrowRightLeft size={18} />} label="Move" onClick={onOpenMove} />
          <ActionBtn icon={<Send size={18} />} label="Send" onClick={onOpenSend} />
        </div>
      </div>

      <div className="px-5 mt-7">
        <button
          onClick={onViewAccounts}
          style={{ background: theme.surface, border: `1px solid ${theme.border}` }}
          className="w-full rounded-2xl p-4 flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-3">
            <div style={{ background: theme.surface2, color: theme.accent, width: 34, height: 34, borderRadius: 999 }} className="flex items-center justify-center">
              <Wallet size={15} />
            </div>
            <div>
              <div style={{ color: theme.text, fontFamily: fonts.body, fontSize: 14, fontWeight: 600 }}>
                {openAccountsCount} account{openAccountsCount === 1 ? "" : "s"}
              </div>
              <div style={{ color: theme.textFaint, fontFamily: fonts.body, fontSize: 11.5 }}>View all accounts</div>
            </div>
          </div>
          <ChevronRight size={16} color={theme.textFaint} />
        </button>
      </div>

      <div className="px-5 mt-4 flex flex-col gap-3">
        <BalanceTrendChart balanceHistory={balanceHistory} hideBalance={hideBalance} />
        <SpendingBreakdown activity={activity} budgets={budgets} hideBalance={hideBalance} onManageBudgets={onManageBudgets} />
      </div>

      <div className="px-5 mt-7">
        <div style={{ color: theme.textDim, fontFamily: fonts.body, fontSize: 13, marginBottom: 10 }}>Latest activity</div>
        <div className="flex flex-col gap-1">
          {activity.length === 0 && <EmptyState>No activity yet. Add money or send a payment to get started.</EmptyState>}
          {activity.slice(0, 20).map((a) => (
            <div key={a.id} className="flex items-center justify-between py-2.5" style={{ borderBottom: `1px solid ${theme.border}` }}>
              <div className="flex items-center gap-3">
                <div
                  style={{
                    width: 34, height: 34, borderRadius: 999,
                    background: a.kind === "credit" ? theme.greenSoft : a.kind === "transfer" ? theme.surface2 : theme.redSoft,
                    color: a.kind === "credit" ? theme.green : a.kind === "transfer" ? theme.textDim : theme.red,
                  }}
                  className="flex items-center justify-center"
                >
                  {a.kind === "credit" ? <ArrowDownLeft size={15} /> : a.kind === "transfer" ? <ArrowRightLeft size={14} /> : <ArrowUpRight size={15} />}
                </div>
                <div>
                  <div style={{ color: theme.text, fontFamily: fonts.body, fontSize: 13.5 }}>{a.name}</div>
                  <div style={{ color: theme.textFaint, fontFamily: fonts.body, fontSize: 11.5 }}>{a.sub}</div>
                </div>
              </div>
              <div className="text-right">
                <div style={{ color: a.amount >= 0 ? theme.green : theme.text, fontFamily: fonts.mono, fontSize: 13.5 }}>
                  {hideBalance ? "••••" : (a.amount >= 0 ? "+" : "-") + "£" + Math.abs(a.amount).toFixed(2)}
                </div>
                <div style={{ color: theme.textFaint, fontFamily: fonts.body, fontSize: 11 }}>{a.date}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
