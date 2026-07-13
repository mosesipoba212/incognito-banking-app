import { useState } from "react";
import { Plus } from "lucide-react";
import { theme, fonts } from "../../lib/theme.js";
import { fmtGBP } from "../../lib/format.js";
import { FullScreen, Sheet, AmountInput, PrimaryButton, EmptyState } from "../ui.jsx";

export default function RequestsScreen({ requests, payees, hideBalance, onBack, onCreate, onCancel }) {
  const [sheet, setSheet] = useState(false);
  const [payeeId, setPayeeId] = useState(payees[0]?.id || "");
  const [amount, setAmount] = useState("");

  function submit() {
    const v = parseFloat(amount);
    const payee = payees.find((p) => p.id === payeeId);
    if (!v || v <= 0 || !payee) return;
    onCreate({ fromName: payee.name, amount: v });
    setSheet(false);
    setAmount("");
  }

  const pending = requests.filter((r) => r.status === "pending");

  return (
    <FullScreen title="Money requests" onBack={onBack} right={<button onClick={() => setSheet(true)} aria-label="Request money" style={{ color: theme.accent }}><Plus size={18} /></button>}>
      <div className="px-5 flex flex-col gap-3">
        {pending.length === 0 && <EmptyState>No pending requests.</EmptyState>}
        {pending.map((r) => (
          <div key={r.id} style={{ background: theme.surface, border: `1px solid ${theme.border}` }} className="rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div style={{ color: theme.text, fontFamily: fonts.body, fontSize: 14 }}>Requested from {r.fromName}</div>
              <div style={{ color: theme.textFaint, fontFamily: fonts.body, fontSize: 11.5, marginTop: 2 }}>
                {new Date(r.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })} · pending
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span style={{ color: theme.text, fontFamily: fonts.mono, fontSize: 15 }}>{fmtGBP(r.amount, hideBalance)}</span>
              <button onClick={() => onCancel(r.id)} style={{ color: theme.red, fontFamily: fonts.body, fontSize: 12.5, fontWeight: 600 }}>
                Cancel
              </button>
            </div>
          </div>
        ))}
      </div>

      {sheet && (
        <Sheet title="Request money" onClose={() => setSheet(false)}>
          {payees.length === 0 ? (
            <EmptyState>Add a payee first from the Payments tab.</EmptyState>
          ) : (
            <>
              <div className="flex flex-col gap-1.5 mb-4">
                <span style={{ color: theme.textDim, fontFamily: fonts.body, fontSize: 12 }}>Request from</span>
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
              <PrimaryButton onClick={submit} disabled={!amount || parseFloat(amount) <= 0}>
                Send request
              </PrimaryButton>
            </>
          )}
        </Sheet>
      )}
    </FullScreen>
  );
}
