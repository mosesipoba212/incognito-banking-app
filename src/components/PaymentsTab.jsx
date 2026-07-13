import { useMemo, useState } from "react";
import { Search, Plus, ChevronRight, Calendar, Repeat, HandCoins } from "lucide-react";
import { theme, fonts } from "../lib/theme.js";
import { userInitials, isValidSortCode, isValidAccountNumber, formatSortCode } from "../lib/storage.js";
import { Sheet, TextField, PrimaryButton, EmptyState } from "./ui.jsx";

const CONTACT_COLORS = ["#C6A06A", "#74C69D", "#6EA8D8", "#B084CC", "#E1725A"];

function QuickLink({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{ background: theme.surface, border: `1px solid ${theme.border}` }}
      className="rounded-2xl p-3 flex flex-col items-center gap-1.5 flex-1 min-w-0"
    >
      <div style={{ color: theme.accent }}>{icon}</div>
      <span style={{ color: theme.textDim, fontFamily: fonts.body, fontSize: 11 }} className="text-center break-words">
        {label}
      </span>
    </button>
  );
}

export default function PaymentsTab({ payees, onCreatePayee, onSelectPayee, onNavigate }) {
  const [query, setQuery] = useState("");
  const [newPayeeSheet, setNewPayeeSheet] = useState(false);
  const [name, setName] = useState("");
  const [sortCode, setSortCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [error, setError] = useState("");

  const filtered = useMemo(
    () => payees.filter((c) => c.name.toLowerCase().includes(query.toLowerCase())),
    [payees, query]
  );

  function submitNewPayee() {
    if (!name.trim()) return setError("Enter a name.");
    if (!isValidSortCode(sortCode)) return setError("Sort code must be 6 digits, e.g. 12-34-56.");
    if (!isValidAccountNumber(accountNumber)) return setError("Account number must be 8 digits.");
    onCreatePayee({
      name: name.trim(),
      sortCode: formatSortCode(sortCode),
      accountNumber: accountNumber.replace(/\s/g, ""),
    });
    setNewPayeeSheet(false);
    setName("");
    setSortCode("");
    setAccountNumber("");
    setError("");
  }

  return (
    <>
      <div className="px-5 mt-3 flex gap-2.5">
        <QuickLink icon={<Plus size={17} />} label="Pay someone new" onClick={() => setNewPayeeSheet(true)} />
        <QuickLink icon={<Repeat size={17} />} label="Scheduled" onClick={() => onNavigate("scheduled")} />
        <QuickLink icon={<Calendar size={17} />} label="Direct debits" onClick={() => onNavigate("directDebits")} />
        <QuickLink icon={<HandCoins size={17} />} label="Requests" onClick={() => onNavigate("requests")} />
      </div>

      <div className="px-5 mt-5 flex items-center gap-2">
        <div
          style={{ background: theme.surface2, border: `1px solid ${theme.border}` }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full flex-1"
        >
          <Search size={16} color={theme.textFaint} />
          <input
            placeholder="Search payees"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ background: "transparent", color: theme.text, fontSize: 13.5 }}
            className="w-full outline-none"
          />
        </div>
      </div>

      <div className="px-5 mt-6 flex flex-col">
        {filtered.length === 0 && (
          <EmptyState>{payees.length === 0 ? "No payees yet. Add your first one." : "No payees found."}</EmptyState>
        )}
        {filtered.map((c, idx) => (
          <button
            key={c.id}
            onClick={() => onSelectPayee(c)}
            className="flex items-center justify-between py-3 text-left"
            style={{ borderBottom: `1px solid ${theme.border}` }}
          >
            <div className="flex items-center gap-3">
              <div
                style={{ width: 40, height: 40, borderRadius: 999, background: CONTACT_COLORS[idx % CONTACT_COLORS.length] }}
                className="flex items-center justify-center"
              >
                <span style={{ color: "#0A0B0F", fontFamily: fonts.body, fontWeight: 700, fontSize: 13 }}>
                  {userInitials(c.name)}
                </span>
              </div>
              <div>
                <div style={{ color: theme.text, fontFamily: fonts.body, fontSize: 14 }}>{c.name}</div>
                <div style={{ color: theme.textFaint, fontFamily: fonts.body, fontSize: 12 }}>{c.last || "No payments yet"}</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span style={{ color: theme.textFaint, fontFamily: fonts.body, fontSize: 11 }}>{c.date}</span>
              <ChevronRight size={16} color={theme.textFaint} />
            </div>
          </button>
        ))}
      </div>

      {newPayeeSheet && (
        <Sheet title="Pay someone new" onClose={() => setNewPayeeSheet(false)}>
          <TextField label="Name" autoFocus placeholder="Full name or business" value={name} onChange={(e) => setName(e.target.value)} />
          <TextField label="Sort code" placeholder="12-34-56" value={sortCode} onChange={(e) => setSortCode(e.target.value)} />
          <TextField label="Account number" placeholder="12345678" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
          {error && (
            <div style={{ color: theme.red, fontSize: 12.5 }} className="mb-3">
              {error}
            </div>
          )}
          <PrimaryButton onClick={submitNewPayee}>Save payee</PrimaryButton>
        </Sheet>
      )}
    </>
  );
}
