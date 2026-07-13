import { useState } from "react";
import { Eye, EyeOff, X, ChevronLeft, Bell, Loader2 } from "lucide-react";
import { theme, fonts } from "../lib/theme.js";

// Sheets/screens don't stay mounted while closing, so we fake an exit
// transition: flip a local flag, play the "out" animation, then fire the
// real onClose once it's finished (matches the CSS duration below).
const CLOSE_ANIM_MS = 180;
function useClosingTransition(onClose) {
  const [closing, setClosing] = useState(false);
  function requestClose() {
    if (closing) return;
    setClosing(true);
    setTimeout(onClose, CLOSE_ANIM_MS);
  }
  return [closing, requestClose];
}

export function ActionBtn({ icon, label, onClick }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-2 flex-1 min-w-0">
      <div
        style={{ background: theme.surface2, border: `1px solid ${theme.border}`, color: theme.accent }}
        className="w-12 h-12 rounded-full flex items-center justify-center"
      >
        {icon}
      </div>
      <span style={{ color: theme.textDim, fontFamily: fonts.body, fontSize: 12 }}>{label}</span>
    </button>
  );
}

export function Sheet({ title, onClose, children }) {
  const [closing, requestClose] = useClosingTransition(onClose);
  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center ${closing ? "sheet-backdrop-out" : "sheet-backdrop-in"}`}
      style={{ background: "rgba(0,0,0,0.62)" }}
      onClick={requestClose}
    >
      <div
        className={`w-full max-w-[430px] rounded-t-3xl p-5 pb-8 max-h-[85vh] overflow-y-auto ${closing ? "sheet-panel-out" : "sheet-panel-in"}`}
        style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderBottom: "none" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 style={{ fontFamily: fonts.display, color: theme.text, fontSize: 19 }}>{title}</h3>
          <button onClick={requestClose} aria-label="Close" style={{ color: theme.textDim }}>
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// A full-page view pushed within the phone frame (list-heavy screens), as
// opposed to Sheet which is a quick-action bottom modal.
export function FullScreen({ title, onBack, right, children }) {
  const [closing, requestBack] = useClosingTransition(onBack);
  return (
    <div className={`absolute inset-0 z-[45] flex flex-col ${closing ? "screen-out" : "screen-in"}`} style={{ background: theme.bg }}>
      <div className="flex items-center justify-between px-5 pt-6 pb-3 shrink-0">
        <button onClick={requestBack} aria-label="Back" className="flex items-center gap-1" style={{ color: theme.textDim }}>
          <ChevronLeft size={20} />
        </button>
        <span style={{ color: theme.text, fontFamily: fonts.display, fontSize: 17 }}>{title}</span>
        <div style={{ minWidth: 20 }}>{right}</div>
      </div>
      <div className="flex-1 overflow-y-auto pb-10">{children}</div>
    </div>
  );
}

export function Spinner({ size = 16, color }) {
  return <Loader2 size={size} color={color || theme.textDim} className="spin" />;
}

export function SkeletonBlock({ width = "100%", height = 14, radius = 6 }) {
  return (
    <div
      className="skeleton"
      style={{ width, height, borderRadius: radius, background: theme.surface2 }}
    />
  );
}

export function AmountInput({ value, onChange, autoFocus, placeholder = "0.00" }) {
  return (
    <div
      className="flex items-center gap-2 px-4 py-3 rounded-2xl mb-4"
      style={{ background: theme.surface2, border: `1px solid ${theme.border}` }}
    >
      <span style={{ color: theme.accent, fontFamily: fonts.display, fontSize: 20 }}>£</span>
      <input
        autoFocus={autoFocus}
        type="number"
        inputMode="decimal"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ background: "transparent", color: theme.text, fontFamily: fonts.mono, fontSize: 20 }}
        className="w-full outline-none"
      />
    </div>
  );
}

export function TextField({ label, ...props }) {
  return (
    <label className="flex flex-col gap-1.5 mb-4">
      {label && <span style={{ color: theme.textDim, fontFamily: fonts.body, fontSize: 12 }}>{label}</span>}
      <input
        {...props}
        style={{ background: theme.surface2, border: `1px solid ${theme.border}`, color: theme.text }}
        className="w-full px-4 py-3 rounded-2xl outline-none text-sm"
      />
    </label>
  );
}

export function PrimaryButton({ children, onClick, disabled, type = "button" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? theme.surface2 : theme.accent,
        color: disabled ? theme.textFaint : "#161208",
        fontFamily: fonts.body,
        fontWeight: 600,
      }}
      className="w-full py-3.5 rounded-2xl text-[15px] transition-opacity active:opacity-80"
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ children, onClick, disabled, tone = "default" }) {
  const color = tone === "danger" ? theme.red : theme.text;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ background: theme.surface, border: `1px solid ${theme.border}`, color }}
      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl disabled:opacity-50"
    >
      <span style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 600 }}>{children}</span>
    </button>
  );
}

export function Toggle({ on, onClick, label }) {
  return (
    <button
      onClick={onClick}
      role="switch"
      aria-checked={on}
      aria-label={label}
      style={{ background: on ? theme.accent : theme.surface2, width: 40, height: 22, borderRadius: 999 }}
      className="relative shrink-0"
    >
      <div
        style={{
          background: "#0A0B0F",
          width: 16,
          height: 16,
          borderRadius: 999,
          position: "absolute",
          top: 3,
          left: on ? 21 : 3,
          transition: "left 0.15s",
        }}
      />
    </button>
  );
}

export function Header({ hideBalance, setHideBalance, title, greeting, initials, onAvatarClick, onBellClick, unreadCount }) {
  return (
    <div className="flex items-center justify-between px-5 pt-6 pb-2">
      <div className="flex items-center gap-2.5">
        <button
          onClick={onAvatarClick}
          aria-label="Open menu"
          style={{ width: 34, height: 34, borderRadius: 999, background: theme.accentSoft }}
          className="flex items-center justify-center shrink-0"
        >
          <span style={{ color: theme.accent, fontFamily: fonts.display, fontSize: 13, fontWeight: 600 }}>{initials}</span>
        </button>
        {greeting ? (
          <span style={{ color: theme.textDim, fontFamily: fonts.body, fontSize: 13 }}>{greeting}</span>
        ) : (
          <span style={{ color: theme.text, fontFamily: fonts.display, fontSize: 17 }}>{title}</span>
        )}
      </div>
      <div className="flex items-center gap-3">
        {onBellClick && (
          <button onClick={onBellClick} aria-label="Notifications" style={{ color: theme.textDim }} className="relative">
            <Bell size={19} />
            {unreadCount > 0 && (
              <span
                style={{ background: theme.red, color: "#fff", fontSize: 9, fontFamily: fonts.mono }}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        )}
        <button onClick={() => setHideBalance((h) => !h)} aria-label={hideBalance ? "Show balance" : "Hide balance"} style={{ color: hideBalance ? theme.accent : theme.textDim }}>
          {hideBalance ? <EyeOff size={19} /> : <Eye size={19} />}
        </button>
      </div>
    </div>
  );
}

export function EmptyState({ children }) {
  return (
    <div style={{ color: theme.textFaint, fontFamily: fonts.body, fontSize: 13 }} className="text-center py-8 px-5">
      {children}
    </div>
  );
}

export function SectionLabel({ children, action }) {
  return (
    <div className="flex items-center justify-between px-5 mb-2">
      <div style={{ color: theme.textDim, fontFamily: fonts.body, fontSize: 13 }}>{children}</div>
      {action}
    </div>
  );
}

// Non-technical, plain-language error text for a failed action inside a
// Sheet/form (insufficient funds, a rejected PIN, a failed API call, etc.)
export function ErrorNote({ children }) {
  if (!children) return null;
  return (
    <div
      style={{ background: theme.redSoft, color: theme.red, fontFamily: fonts.body, fontSize: 12.5 }}
      className="rounded-xl px-3.5 py-2.5 mb-4"
    >
      {children}
    </div>
  );
}
