import { useState } from "react";
import { Lock, Unlock, Eye, EyeOff, Plus } from "lucide-react";
import { theme, fonts } from "../../lib/theme.js";
import { fmtGBP } from "../../lib/format.js";
import { CARD_BLOCK_CATEGORIES } from "../../lib/categorize.js";
import { Sheet, TextField, AmountInput, PrimaryButton, EmptyState } from "../ui.jsx";

// user.cards[].number/cvc/expiry are randomly generated mock values (see
// createCard in lib/storage.js) — never real card data.
function CardFace({ card, accountName, revealed, onFlip }) {
  return (
    <div style={{ perspective: 1200 }}>
      <div
        onClick={onFlip}
        className="relative transition-transform duration-200 cursor-pointer select-none"
        style={{ transformStyle: "preserve-3d", transform: revealed ? "rotateY(180deg)" : "rotateY(0deg)" }}
      >
        <div
          style={{ background: `linear-gradient(135deg, ${theme.surface2}, ${theme.surface})`, border: `1px solid ${theme.border}`, backfaceVisibility: "hidden" }}
          className="rounded-2xl p-5 relative overflow-hidden"
        >
          {card.frozen && (
            <div style={{ background: "rgba(10,11,15,0.72)" }} className="absolute inset-0 flex items-center justify-center gap-2 z-10">
              <Lock size={16} color={theme.text} />
              <span style={{ color: theme.text, fontFamily: fonts.body, fontSize: 13 }}>Card frozen</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span style={{ color: theme.accent, fontFamily: fonts.mono, fontSize: 11, letterSpacing: 2 }}>{card.name.toUpperCase()}</span>
            <div style={{ width: 22, height: 22, borderRadius: 999, background: theme.accent }} />
          </div>
          <div style={{ color: theme.text, fontFamily: fonts.mono, fontSize: 17, marginTop: 28, letterSpacing: 2 }}>
            •••• •••• •••• {card.number.slice(-4)}
          </div>
          <div className="flex items-center justify-between mt-4">
            <span style={{ color: theme.textDim, fontFamily: fonts.body, fontSize: 12 }}>{accountName}</span>
            <span style={{ color: theme.textFaint, fontFamily: fonts.body, fontSize: 11 }}>Tap to reveal</span>
          </div>
        </div>

        <div
          style={{ background: `linear-gradient(135deg, ${theme.surface2}, ${theme.surface})`, border: `1px solid ${theme.border}`, backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          className="rounded-2xl p-5 absolute inset-0 overflow-hidden"
        >
          {card.frozen && (
            <div style={{ background: "rgba(10,11,15,0.72)" }} className="absolute inset-0 flex items-center justify-center gap-2 z-10">
              <Lock size={16} color={theme.text} />
              <span style={{ color: theme.text, fontFamily: fonts.body, fontSize: 13 }}>Card frozen</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span style={{ color: theme.accent, fontFamily: fonts.mono, fontSize: 11, letterSpacing: 2 }}>{card.name.toUpperCase()}</span>
            <span style={{ color: theme.textFaint, fontFamily: fonts.body, fontSize: 11 }}>Tap to hide</span>
          </div>
          <div style={{ color: theme.text, fontFamily: fonts.mono, fontSize: 16, marginTop: 24, letterSpacing: 1.5 }}>{card.number}</div>
          <div className="flex items-center justify-between mt-4">
            <div>
              <div style={{ color: theme.textFaint, fontFamily: fonts.body, fontSize: 10 }}>EXPIRY</div>
              <span style={{ color: theme.text, fontFamily: fonts.mono, fontSize: 13 }}>{card.expiry}</span>
            </div>
            <div>
              <div style={{ color: theme.textFaint, fontFamily: fonts.body, fontSize: 10 }}>CVC</div>
              <span style={{ color: theme.text, fontFamily: fonts.mono, fontSize: 13 }}>{card.cvc}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CardsTabContent({ cards, accounts, hideBalance, onAddCard, onToggleFreeze, onSetLimit, onToggleBlockedCategory }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [addSheet, setAddSheet] = useState(false);
  const [limitSheet, setLimitSheet] = useState(false);
  const [newCardName, setNewCardName] = useState("");
  const [newCardAccountId, setNewCardAccountId] = useState(accounts[0]?.id || "");
  const [limitValue, setLimitValue] = useState("");

  const card = cards[Math.min(activeIndex, cards.length - 1)];
  const accountName = accounts.find((a) => a.id === card?.accountId)?.name || "—";

  function submitAddCard() {
    if (!newCardName.trim() || !newCardAccountId) return;
    onAddCard({ name: newCardName.trim(), accountId: newCardAccountId });
    setAddSheet(false);
    setNewCardName("");
  }

  function openLimit() {
    setLimitValue(String(card.limit));
    setLimitSheet(true);
  }

  function submitLimit() {
    const v = parseFloat(limitValue);
    if (!v || v <= 0) return;
    onSetLimit(card.id, v);
    setLimitSheet(false);
  }

  if (cards.length === 0) {
    return (
      <div className="px-5 mt-4">
        <EmptyState>No cards yet.</EmptyState>
        <PrimaryButton onClick={() => setAddSheet(true)}>Add virtual card</PrimaryButton>
        {addSheet && <AddCardSheet accounts={accounts} name={newCardName} setName={setNewCardName} accountId={newCardAccountId} setAccountId={setNewCardAccountId} onClose={() => setAddSheet(false)} onSubmit={submitAddCard} />}
      </div>
    );
  }

  return (
    <div className="px-5 mt-4">
      {cards.length > 1 && (
        <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar pb-1">
          {cards.map((c, i) => (
            <button
              key={c.id}
              onClick={() => {
                setActiveIndex(i);
                setRevealed(false);
              }}
              style={{
                background: i === activeIndex ? theme.accentSoft : theme.surface2,
                color: i === activeIndex ? theme.accent : theme.textDim,
                border: `1px solid ${theme.border}`,
              }}
              className="px-3 py-1.5 rounded-full text-[12px] shrink-0"
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      <CardFace card={card} accountName={accountName} revealed={revealed} onFlip={() => setRevealed((r) => !r)} />

      <button
        onClick={() => setRevealed((r) => !r)}
        style={{ background: theme.surface, border: `1px solid ${theme.border}`, color: theme.text }}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl mt-4"
      >
        {revealed ? <EyeOff size={16} /> : <Eye size={16} />}
        <span style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 600 }}>{revealed ? "Hide details" : "Reveal card details"}</span>
      </button>

      <button
        onClick={() => onToggleFreeze(card.id)}
        style={{ background: theme.surface, border: `1px solid ${theme.border}`, color: theme.text }}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl mt-2"
      >
        {card.frozen ? <Unlock size={16} /> : <Lock size={16} />}
        <span style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 600 }}>{card.frozen ? "Unfreeze card" : "Freeze card"}</span>
      </button>

      <button onClick={() => setAddSheet(true)} style={{ background: theme.surface2, border: `1px dashed ${theme.border}`, color: theme.accent }} className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl mt-2">
        <Plus size={15} />
        <span style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 600 }}>Add virtual card</span>
      </button>

      <div className="mt-6">
        <div style={{ color: theme.textDim, fontFamily: fonts.body, fontSize: 13, marginBottom: 8 }}>Spending limit</div>
        <button onClick={openLimit} style={{ background: theme.surface, border: `1px solid ${theme.border}` }} className="w-full rounded-2xl p-4 flex items-center justify-between text-left">
          <span style={{ color: theme.text, fontFamily: fonts.body, fontSize: 14 }}>Monthly limit</span>
          <span style={{ color: theme.accent, fontFamily: fonts.mono, fontSize: 14 }}>{fmtGBP(card.limit, hideBalance)}</span>
        </button>
      </div>

      <div className="mt-6 mb-2">
        <div style={{ color: theme.textDim, fontFamily: fonts.body, fontSize: 13, marginBottom: 8 }}>Blocked categories</div>
        <div className="flex flex-wrap gap-2">
          {CARD_BLOCK_CATEGORIES.map((cat) => {
            const blocked = card.blockedCategories.includes(cat);
            return (
              <button
                key={cat}
                onClick={() => onToggleBlockedCategory(card.id, cat)}
                style={{
                  background: blocked ? theme.redSoft : theme.surface2,
                  color: blocked ? theme.red : theme.textDim,
                  border: `1px solid ${theme.border}`,
                }}
                className="px-3 py-1.5 rounded-full text-[12px]"
              >
                {blocked ? `🚫 ${cat}` : cat}
              </button>
            );
          })}
        </div>
      </div>

      {addSheet && <AddCardSheet accounts={accounts} name={newCardName} setName={setNewCardName} accountId={newCardAccountId} setAccountId={setNewCardAccountId} onClose={() => setAddSheet(false)} onSubmit={submitAddCard} />}

      {limitSheet && (
        <Sheet title="Set spending limit" onClose={() => setLimitSheet(false)}>
          <AmountInput value={limitValue} onChange={setLimitValue} autoFocus placeholder="2000.00" />
          <PrimaryButton onClick={submitLimit} disabled={!limitValue || parseFloat(limitValue) <= 0}>
            Save limit
          </PrimaryButton>
        </Sheet>
      )}
    </div>
  );
}

function AddCardSheet({ accounts, name, setName, accountId, setAccountId, onClose, onSubmit }) {
  return (
    <Sheet title="Add virtual card" onClose={onClose}>
      <TextField label="Card name" autoFocus placeholder="e.g. Online spending" value={name} onChange={(e) => setName(e.target.value)} />
      <div className="flex flex-col gap-1.5 mb-4">
        <span style={{ color: theme.textDim, fontFamily: fonts.body, fontSize: 12 }}>Linked account</span>
        <select
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          style={{ background: theme.surface2, border: `1px solid ${theme.border}`, color: theme.text }}
          className="w-full px-4 py-3 rounded-2xl outline-none text-sm"
        >
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>
      <PrimaryButton onClick={onSubmit} disabled={!name.trim()}>
        Create card
      </PrimaryButton>
    </Sheet>
  );
}
