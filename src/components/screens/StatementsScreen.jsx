import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { theme, fonts } from "../../lib/theme.js";
import { fmtGBP } from "../../lib/format.js";
import { downloadCsv } from "../../lib/csv.js";
import { FullScreen, PrimaryButton, EmptyState } from "../ui.jsx";

function defaultFrom() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}
function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function StatementsScreen({ activity, accounts, hideBalance, onBack }) {
  const [from, setFrom] = useState(defaultFrom());
  const [to, setTo] = useState(today());
  const [accountId, setAccountId] = useState("all");

  const filtered = useMemo(() => {
    const fromTime = new Date(from).getTime();
    const toTime = new Date(to).getTime() + 24 * 60 * 60 * 1000 - 1;
    return activity
      .filter((a) => {
        if (!a.createdAt) return false;
        const t = new Date(a.createdAt).getTime();
        if (t < fromTime || t > toTime) return false;
        if (accountId !== "all" && a.accountId !== accountId) return false;
        return true;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [activity, from, to, accountId]);

  function exportCsv() {
    const rows = [["Date", "Account", "Description", "Category", "Amount (GBP)"]];
    for (const a of filtered) {
      const account = accounts.find((acc) => acc.id === a.accountId);
      rows.push([
        new Date(a.createdAt).toISOString().slice(0, 10),
        account?.name || "",
        `${a.name}${a.sub ? " – " + a.sub : ""}`,
        a.category || "",
        a.amount.toFixed(2),
      ]);
    }
    downloadCsv(`incognito-statement-${from}_to_${to}.csv`, rows);
  }

  return (
    <FullScreen title="Statements" onBack={onBack}>
      <div className="px-5 flex flex-col gap-3 mb-4">
        <div className="flex gap-2">
          <div className="flex flex-col gap-1.5 flex-1">
            <span style={{ color: theme.textDim, fontFamily: fonts.body, fontSize: 12 }}>From</span>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              style={{ background: theme.surface2, border: `1px solid ${theme.border}`, color: theme.text }}
              className="w-full px-3 py-2.5 rounded-xl outline-none text-sm"
            />
          </div>
          <div className="flex flex-col gap-1.5 flex-1">
            <span style={{ color: theme.textDim, fontFamily: fonts.body, fontSize: 12 }}>To</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              style={{ background: theme.surface2, border: `1px solid ${theme.border}`, color: theme.text }}
              className="w-full px-3 py-2.5 rounded-xl outline-none text-sm"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <span style={{ color: theme.textDim, fontFamily: fonts.body, fontSize: 12 }}>Account</span>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            style={{ background: theme.surface2, border: `1px solid ${theme.border}`, color: theme.text }}
            className="w-full px-4 py-2.5 rounded-xl outline-none text-sm"
          >
            <option value="all">All accounts</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        <PrimaryButton onClick={exportCsv} disabled={filtered.length === 0}>
          <span className="flex items-center justify-center gap-2">
            <Download size={15} /> Download as CSV
          </span>
        </PrimaryButton>
      </div>

      <div className="px-5">
        {filtered.length === 0 && <EmptyState>No activity in this range.</EmptyState>}
        <div className="flex flex-col">
          {filtered.map((a) => (
            <div key={a.id} className="flex items-center justify-between py-2.5" style={{ borderBottom: `1px solid ${theme.border}` }}>
              <div>
                <div style={{ color: theme.text, fontFamily: fonts.body, fontSize: 13.5 }}>{a.name}</div>
                <div style={{ color: theme.textFaint, fontFamily: fonts.body, fontSize: 11.5 }}>
                  {new Date(a.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })} · {a.category || "Other"}
                </div>
              </div>
              <div style={{ color: a.amount >= 0 ? theme.green : theme.text, fontFamily: fonts.mono, fontSize: 13.5 }}>
                {hideBalance ? "••••" : fmtGBP(a.amount, false)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </FullScreen>
  );
}
