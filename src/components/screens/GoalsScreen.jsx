import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { theme, fonts } from "../../lib/theme.js";
import { fmtGBP } from "../../lib/format.js";
import { FullScreen, Sheet, TextField, AmountInput, PrimaryButton, Toggle, EmptyState } from "../ui.jsx";

export default function GoalsScreen({ goals, savingsAccounts, hideBalance, roundUp, onBack, onCreateGoal, onAddFunds, onDeleteGoal, onToggleRoundUp }) {
  const [newSheet, setNewSheet] = useState(false);
  const [fundsGoal, setFundsGoal] = useState(null);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [accountId, setAccountId] = useState(savingsAccounts[0]?.id || "");
  const [fundsAmount, setFundsAmount] = useState("");

  function submitNew() {
    const t = parseFloat(target);
    if (!name.trim() || !t || t <= 0 || !accountId) return;
    onCreateGoal({ name: name.trim(), target: t, targetDate: targetDate || null, accountId });
    setNewSheet(false);
    setName("");
    setTarget("");
    setTargetDate("");
  }

  function submitFunds() {
    const v = parseFloat(fundsAmount);
    if (!v || v <= 0) return;
    onAddFunds(fundsGoal.id, v);
    setFundsGoal(null);
    setFundsAmount("");
  }

  return (
    <FullScreen title="Savings goals" onBack={onBack} right={<button onClick={() => setNewSheet(true)} aria-label="New goal" style={{ color: theme.accent }}><Plus size={18} /></button>}>
      {savingsAccounts.length > 0 && (
        <div className="px-5 mb-5">
          <div style={{ background: theme.surface, border: `1px solid ${theme.border}` }} className="rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div style={{ color: theme.text, fontFamily: fonts.body, fontSize: 13.5, fontWeight: 600 }}>Round-up savings</div>
              <div style={{ color: theme.textFaint, fontFamily: fonts.body, fontSize: 11.5, marginTop: 2 }}>
                Round each payment up to the nearest £1 into a goal
              </div>
            </div>
            <Toggle
              on={roundUp.enabled}
              onClick={() => onToggleRoundUp(!roundUp.enabled, roundUp.goalId)}
              label="Round-up savings"
            />
          </div>
          {roundUp.enabled && goals.length > 0 && (
            <div className="mt-2 flex flex-col gap-1.5">
              <span style={{ color: theme.textDim, fontFamily: fonts.body, fontSize: 12 }}>Sweep round-ups into</span>
              <select
                value={roundUp.goalId || ""}
                onChange={(e) => onToggleRoundUp(true, e.target.value)}
                style={{ background: theme.surface2, border: `1px solid ${theme.border}`, color: theme.text }}
                className="w-full px-4 py-3 rounded-2xl outline-none text-sm"
              >
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {roundUp.enabled && goals.length === 0 && (
            <div style={{ color: theme.textFaint, fontSize: 11.5 }} className="mt-2">
              Create a goal below to choose where round-ups go.
            </div>
          )}
        </div>
      )}

      <div className="px-5 flex flex-col gap-3">
        {goals.length === 0 && <EmptyState>No savings goals yet.</EmptyState>}
        {goals.map((g) => {
          const pct = g.target ? Math.min(100, Math.round((g.saved / g.target) * 100)) : 0;
          return (
            <div key={g.id} style={{ background: theme.surface, border: `1px solid ${theme.border}` }} className="rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div style={{ color: theme.text, fontFamily: fonts.body, fontSize: 14, fontWeight: 600 }}>{g.name}</div>
                  {g.targetDate && (
                    <div style={{ color: theme.textFaint, fontFamily: fonts.body, fontSize: 11, marginTop: 2 }}>
                      By {new Date(g.targetDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </div>
                  )}
                </div>
                <button onClick={() => onDeleteGoal(g.id)} aria-label={`Delete ${g.name} goal`} style={{ color: theme.textFaint }}>
                  <Trash2 size={15} />
                </button>
              </div>
              <div style={{ background: theme.surface2, height: 6, borderRadius: 999, marginTop: 12 }}>
                <div style={{ background: theme.accent, height: 6, borderRadius: 999, width: `${pct}%` }} />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span style={{ color: theme.textFaint, fontFamily: fonts.body, fontSize: 11 }}>
                  {fmtGBP(g.saved, hideBalance)} of {fmtGBP(g.target, hideBalance)} · {pct}%
                </span>
                <button
                  onClick={() => setFundsGoal(g)}
                  style={{ color: theme.accent, fontFamily: fonts.body, fontSize: 12, fontWeight: 600 }}
                >
                  Add funds
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {newSheet && (
        <Sheet title="New savings goal" onClose={() => setNewSheet(false)}>
          {savingsAccounts.length === 0 ? (
            <EmptyState>Open a savings account first.</EmptyState>
          ) : (
            <>
              <TextField label="Goal name" autoFocus placeholder="Holiday fund" value={name} onChange={(e) => setName(e.target.value)} />
              <TextField label="Target amount (£)" type="number" placeholder="1000" value={target} onChange={(e) => setTarget(e.target.value)} />
              <div className="flex flex-col gap-1.5 mb-4">
                <span style={{ color: theme.textDim, fontFamily: fonts.body, fontSize: 12 }}>Target date (optional)</span>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  style={{ background: theme.surface2, border: `1px solid ${theme.border}`, color: theme.text }}
                  className="w-full px-4 py-3 rounded-2xl outline-none text-sm"
                />
              </div>
              <div className="flex flex-col gap-1.5 mb-4">
                <span style={{ color: theme.textDim, fontFamily: fonts.body, fontSize: 12 }}>Savings account</span>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  style={{ background: theme.surface2, border: `1px solid ${theme.border}`, color: theme.text }}
                  className="w-full px-4 py-3 rounded-2xl outline-none text-sm"
                >
                  {savingsAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <PrimaryButton onClick={submitNew}>Create goal</PrimaryButton>
            </>
          )}
        </Sheet>
      )}

      {fundsGoal && (
        <Sheet title={`Add to ${fundsGoal.name}`} onClose={() => setFundsGoal(null)}>
          <div style={{ color: theme.textFaint, fontFamily: fonts.body, fontSize: 12.5 }} className="mb-3">
            Moves money from Checking into this goal's savings account.
          </div>
          <AmountInput value={fundsAmount} onChange={setFundsAmount} autoFocus />
          <PrimaryButton onClick={submitFunds} disabled={!fundsAmount || parseFloat(fundsAmount) <= 0}>
            Confirm transfer
          </PrimaryButton>
        </Sheet>
      )}
    </FullScreen>
  );
}
