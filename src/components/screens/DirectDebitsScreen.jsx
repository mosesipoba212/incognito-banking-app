import { useState } from "react";
import { Plus, Lock } from "lucide-react";
import { theme, fonts } from "../../lib/theme.js";
import { fmtGBP } from "../../lib/format.js";
import { categorize } from "../../lib/categorize.js";
import { FullScreen, Sheet, TextField, PrimaryButton, EmptyState } from "../ui.jsx";

export default function DirectDebitsScreen({ directDebits, cardBlockedCategories, hideBalance, onBack, onToggleBlock, onCreate }) {
  const [sheet, setSheet] = useState(false);
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [dayOfMonth, setDayOfMonth] = useState("1");

  function submit() {
    const v = parseFloat(amount);
    const day = parseInt(dayOfMonth, 10);
    if (!merchant.trim() || !v || v <= 0 || !day || day < 1 || day > 28) return;
    onCreate({ merchant: merchant.trim(), amount: v, dayOfMonth: day, category: categorize(merchant) });
    setSheet(false);
    setMerchant("");
    setAmount("");
    setDayOfMonth("1");
  }

  return (
    <FullScreen title="Direct debits" onBack={onBack} right={<button onClick={() => setSheet(true)} aria-label="Add direct debit" style={{ color: theme.accent }}><Plus size={18} /></button>}>
      <div className="px-5 flex flex-col gap-3">
        {directDebits.length === 0 && <EmptyState>No direct debits set up.</EmptyState>}
        {directDebits.map((dd) => {
          const categoryBlocked = cardBlockedCategories.includes(dd.category);
          const blocked = dd.blocked || categoryBlocked;
          return (
            <div key={dd.id} style={{ background: theme.surface, border: `1px solid ${theme.border}` }} className="rounded-2xl p-4 flex items-center justify-between">
              <div>
                <div style={{ color: theme.text, fontFamily: fonts.body, fontSize: 14 }}>{dd.merchant}</div>
                <div style={{ color: theme.textFaint, fontFamily: fonts.body, fontSize: 11.5, marginTop: 2 }}>
                  {fmtGBP(dd.amount, hideBalance)} · day {dd.dayOfMonth} of month · {dd.category}
                </div>
                {categoryBlocked && !dd.blocked && (
                  <div style={{ color: theme.textFaint, fontFamily: fonts.body, fontSize: 10.5, marginTop: 2 }} className="flex items-center gap-1">
                    <Lock size={10} /> blocked via card category rules
                  </div>
                )}
              </div>
              <button
                onClick={() => onToggleBlock(dd.id)}
                disabled={categoryBlocked}
                style={{
                  background: blocked ? theme.redSoft : theme.greenSoft,
                  color: blocked ? theme.red : theme.green,
                  fontFamily: fonts.body,
                  fontSize: 12.5,
                  fontWeight: 600,
                }}
                className="px-3.5 py-2 rounded-full disabled:opacity-60"
              >
                {blocked ? "Unblock" : "Block"}
              </button>
            </div>
          );
        })}
      </div>

      {sheet && (
        <Sheet title="Add direct debit" onClose={() => setSheet(false)}>
          <TextField label="Merchant" autoFocus placeholder="e.g. Netflix" value={merchant} onChange={(e) => setMerchant(e.target.value)} />
          <TextField label="Amount (£)" type="number" placeholder="9.99" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <TextField label="Day of month" type="number" min="1" max="28" value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value)} />
          <PrimaryButton onClick={submit} disabled={!merchant.trim() || !amount || parseFloat(amount) <= 0}>
            Save direct debit
          </PrimaryButton>
        </Sheet>
      )}
    </FullScreen>
  );
}
