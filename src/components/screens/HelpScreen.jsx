import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { theme, fonts } from "../../lib/theme.js";
import { FullScreen } from "../ui.jsx";

const FAQS = [
  {
    q: "Is this a real bank account?",
    a: "No — Incognito is a portfolio/demo app. No real money moves, and all data is stored only in your browser's localStorage.",
  },
  {
    q: "How do round-up savings work?",
    a: "When enabled, every qualifying payment is rounded up to the nearest £1 and the difference is swept into the savings goal you choose, in addition to the original payment.",
  },
  {
    q: "How do I stop a direct debit or subscription?",
    a: "Go to Payments → Direct debits and tap Block next to the merchant. You can unblock it again at any time.",
  },
  {
    q: "What happens when I close an account?",
    a: "Any remaining balance is automatically moved to one of your other open accounts before the account is closed. You need at least one open account.",
  },
  {
    q: "Why does a transfer ask for my PIN?",
    a: "Transfers above the threshold set in Settings require your PIN as an extra confirmation step, similar to real banking apps.",
  },
  {
    q: "Can I get live stock prices?",
    a: "If a Finnhub API key is configured in .env, the Invest tab fetches live quotes; otherwise it falls back to bundled sample data automatically.",
  },
];

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      onClick={() => setOpen((o) => !o)}
      style={{ background: theme.surface, border: `1px solid ${theme.border}` }}
      className="w-full rounded-2xl p-4 text-left"
    >
      <div className="flex items-center justify-between gap-3">
        <span style={{ color: theme.text, fontFamily: fonts.body, fontSize: 13.5, fontWeight: 600 }}>{q}</span>
        <ChevronDown
          size={16}
          color={theme.textFaint}
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s", flexShrink: 0 }}
        />
      </div>
      {open && (
        <div style={{ color: theme.textDim, fontFamily: fonts.body, fontSize: 12.5, marginTop: 8, lineHeight: 1.5 }}>
          {a}
        </div>
      )}
    </button>
  );
}

export default function HelpScreen({ onBack, onContactSupport }) {
  return (
    <FullScreen title="Help & FAQ" onBack={onBack}>
      <div className="px-5 flex flex-col gap-2.5">
        {FAQS.map((f) => (
          <FaqItem key={f.q} {...f} />
        ))}
        <button
          onClick={onContactSupport}
          style={{ background: theme.accentSoft, color: theme.accent, border: `1px solid ${theme.border}` }}
          className="w-full rounded-2xl p-4 text-center mt-2"
        >
          <span style={{ fontFamily: fonts.body, fontSize: 13.5, fontWeight: 600 }}>Still need help? Contact support</span>
        </button>
      </div>
    </FullScreen>
  );
}
