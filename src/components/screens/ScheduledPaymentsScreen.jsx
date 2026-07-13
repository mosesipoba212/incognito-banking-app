import { useState } from "react";
import { Plus } from "lucide-react";
import { theme, fonts } from "../../lib/theme.js";
import { fmtGBP } from "../../lib/format.js";
import { FullScreen, Sheet, AmountInput, PrimaryButton, EmptyState } from "../ui.jsx";

export default function ScheduledPaymentsScreen({ scheduledPayments, payees, hideBalance, onBack, onCreate, onCancel, onUpdate }) {
  const [sheet, setSheet] = useState(false);
  const [editing, setEditing] = useState(null);
  const [payeeId, setPayeeId] = useState(payees[0]?.id || "");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState("monthly");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));

  function openNew() {
    setEditing(null);
    setPayeeId(payees[0]?.id || "");
    setAmount("");
    setFrequency("monthly");
    setStartDate(new Date().toISOString().slice(0, 10));
    setSheet(true);
  }

  function openEdit(sp) {
    setEditing(sp);
    setPayeeId(sp.payeeId);
    setAmount(String(sp.amount));
    setFrequency(sp.frequency);
    setStartDate(sp.nextDate.slice(0, 10));
    setSheet(true);
  }

  function submit() {
    const v = parseFloat(amount);
    const payee = payees.find((p) => p.id === payeeId);
    if (!v || v <= 0 || !payee) return;
    const payload = { payeeId, payeeName: payee.name, amount: v, frequency, nextDate: new Date(startDate).toISOString() };
    if (editing) onUpdate(editing.id, payload);
    else onCreate(payload);
    setSheet(false);
  }

  return (
    <FullScreen title="Scheduled payments" onBack={onBack} right={<button onClick={openNew} aria-label="New scheduled payment" style={{ color: theme.accent }}><Plus size={18} /></button>}>
      <div className="px-5 flex flex-col gap-3">
        {scheduledPayments.length === 0 && <EmptyState>No scheduled payments yet.</EmptyState>}
        {scheduledPayments.map((sp) => (
          <div key={sp.id} style={{ background: theme.surface, border: `1px solid ${theme.border}` }} className="rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <div style={{ color: theme.text, fontFamily: fonts.body, fontSize: 14, fontWeight: 600 }}>{sp.payeeName}</div>
                <div style={{ color: theme.textFaint, fontFamily: fonts.body, fontSize: 11.5, marginTop: 2 }}>
                  {sp.frequency === "weekly" ? "Weekly" : "Monthly"} · next {new Date(sp.nextDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                </div>
              </div>
              <div style={{ color: theme.text, fontFamily: fonts.mono, fontSize: 15 }}>{fmtGBP(sp.amount, hideBalance)}</div>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => openEdit(sp)}
                style={{ background: theme.surface2, border: `1px solid ${theme.border}`, color: theme.text }}
                className="flex-1 py-2 rounded-xl text-[12.5px] font-semibold"
              >
                Edit
              </button>
              <button
                onClick={() => onCancel(sp.id)}
                style={{ background: theme.redSoft, color: theme.red }}
                className="flex-1 py-2 rounded-xl text-[12.5px] font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        ))}
      </div>

      {sheet && (
        <Sheet title={editing ? "Edit scheduled payment" : "New scheduled payment"} onClose={() => setSheet(false)}>
          {payees.length === 0 ? (
            <EmptyState>Add a payee first from the Payments tab.</EmptyState>
          ) : (
            <>
              <div className="flex flex-col gap-1.5 mb-4">
                <span style={{ color: theme.textDim, fontFamily: fonts.body, fontSize: 12 }}>Pay</span>
                <select
                  value={payeeId}
                  onChange={(e) => setPayeeId(e.target.value)}
                  style={{ background: theme.surface2, border: `1px solid ${theme.border}`, color: theme.text }}
                  className="w-full px-4 py-3 rounded-2xl outline-none text-sm"
                >
                  {payees.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <AmountInput value={amount} onChange={setAmount} autoFocus />
              <div className="flex gap-2 mb-4">
                {["weekly", "monthly"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFrequency(f)}
                    style={{
                      background: frequency === f ? theme.accentSoft : theme.surface2,
                      color: frequency === f ? theme.accent : theme.textDim,
                      border: `1px solid ${theme.border}`,
                    }}
                    className="flex-1 py-2.5 rounded-xl text-[13px] capitalize"
                  >
                    {f}
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-1.5 mb-4">
                <span style={{ color: theme.textDim, fontFamily: fonts.body, fontSize: 12 }}>Next payment date</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{ background: theme.surface2, border: `1px solid ${theme.border}`, color: theme.text }}
                  className="w-full px-4 py-3 rounded-2xl outline-none text-sm"
                />
              </div>
              <PrimaryButton onClick={submit} disabled={!amount || parseFloat(amount) <= 0}>
                {editing ? "Save changes" : "Create scheduled payment"}
              </PrimaryButton>
            </>
          )}
        </Sheet>
      )}
    </FullScreen>
  );
}
