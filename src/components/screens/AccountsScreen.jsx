import { useState } from "react";
import { Plus, ChevronRight } from "lucide-react";
import { theme, fonts } from "../../lib/theme.js";
import { fmtGBP } from "../../lib/format.js";
import { FullScreen, Sheet, TextField, PrimaryButton, SecondaryButton, EmptyState } from "../ui.jsx";

const TYPES = [
  { key: "current", label: "Current" },
  { key: "savings", label: "Savings" },
  { key: "joint", label: "Joint" },
];

export default function AccountsScreen({ accounts, hideBalance, onBack, onOpenAccount, onRenameAccount, onCloseAccount }) {
  const [newSheet, setNewSheet] = useState(false);
  const [manageId, setManageId] = useState(null);
  const [type, setType] = useState("current");
  const [name, setName] = useState("");
  const [renameValue, setRenameValue] = useState("");

  const openAccounts = accounts.filter((a) => !a.closedAt);
  const managed = accounts.find((a) => a.id === manageId);

  function submitNew() {
    onOpenAccount({ type, name: name.trim() || undefined });
    setNewSheet(false);
    setType("current");
    setName("");
  }

  function openManage(acc) {
    setManageId(acc.id);
    setRenameValue(acc.name);
  }

  function submitRename() {
    if (!renameValue.trim()) return;
    onRenameAccount(manageId, renameValue.trim());
    setManageId(null);
  }

  function submitClose() {
    onCloseAccount(manageId);
    setManageId(null);
  }

  return (
    <FullScreen title="Accounts" onBack={onBack}>
      <div className="px-5 flex flex-col gap-3">
        {openAccounts.map((a) => (
          <button
            key={a.id}
            onClick={() => openManage(a)}
            style={{ background: theme.surface, border: `1px solid ${theme.border}` }}
            className="rounded-2xl p-4 flex items-center justify-between text-left"
          >
            <div>
              <div className="flex items-center gap-1.5">
                <span style={{ color: theme.text, fontFamily: fonts.body, fontSize: 14, fontWeight: 600 }}>{a.name}</span>
                <span
                  style={{ background: theme.surface2, color: theme.textFaint, fontFamily: fonts.mono, fontSize: 9.5 }}
                  className="px-1.5 py-0.5 rounded-full uppercase"
                >
                  {a.type}
                </span>
              </div>
              <div style={{ color: theme.textFaint, fontFamily: fonts.mono, fontSize: 11, marginTop: 2 }}>{a.number}</div>
            </div>
            <div className="flex items-center gap-2">
              <span style={{ color: theme.text, fontFamily: fonts.mono, fontSize: 15 }}>{fmtGBP(a.balance, hideBalance)}</span>
              <ChevronRight size={16} color={theme.textFaint} />
            </div>
          </button>
        ))}

        <button
          onClick={() => setNewSheet(true)}
          style={{ background: theme.surface2, border: `1px dashed ${theme.border}`, color: theme.accent }}
          className="rounded-2xl p-4 flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          <span style={{ fontFamily: fonts.body, fontSize: 13.5, fontWeight: 600 }}>Open new account</span>
        </button>
      </div>

      {newSheet && (
        <Sheet title="Open an account" onClose={() => setNewSheet(false)}>
          <div className="flex gap-2 mb-4">
            {TYPES.map((t) => (
              <button
                key={t.key}
                onClick={() => setType(t.key)}
                style={{
                  background: type === t.key ? theme.accentSoft : theme.surface2,
                  color: type === t.key ? theme.accent : theme.textDim,
                  border: `1px solid ${theme.border}`,
                }}
                className="flex-1 py-2.5 rounded-xl text-[13px]"
              >
                {t.label}
              </button>
            ))}
          </div>
          <TextField label="Account name (optional)" placeholder={`My ${TYPES.find((t) => t.key === type).label} account`} value={name} onChange={(e) => setName(e.target.value)} />
          <PrimaryButton onClick={submitNew}>Open account</PrimaryButton>
        </Sheet>
      )}

      {managed && (
        <Sheet title={managed.name} onClose={() => setManageId(null)}>
          <TextField label="Account name" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} />
          <PrimaryButton onClick={submitRename} disabled={!renameValue.trim()}>
            Save name
          </PrimaryButton>
          <div className="mt-2">
            <SecondaryButton
              tone="danger"
              onClick={submitClose}
              disabled={openAccounts.length <= 1}
            >
              Close account
            </SecondaryButton>
            {openAccounts.length <= 1 && (
              <div style={{ color: theme.textFaint, fontSize: 11 }} className="text-center mt-2">
                You need at least one open account.
              </div>
            )}
            {managed.balance !== 0 && openAccounts.length > 1 && (
              <div style={{ color: theme.textFaint, fontSize: 11 }} className="text-center mt-2">
                Remaining balance will be swept to your other account.
              </div>
            )}
          </div>
        </Sheet>
      )}

      {openAccounts.length === 0 && <EmptyState>No open accounts.</EmptyState>}
    </FullScreen>
  );
}
