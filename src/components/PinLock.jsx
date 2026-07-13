import { useState } from "react";
import { Delete, Lock } from "lucide-react";
import { theme, fonts } from "../lib/theme.js";

export function PinDots({ length, filled }) {
  return (
    <div className="flex items-center justify-center gap-3 my-6">
      {Array.from({ length }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 14,
            height: 14,
            borderRadius: 999,
            background: i < filled ? theme.accent : "transparent",
            border: `1.5px solid ${i < filled ? theme.accent : theme.border}`,
          }}
        />
      ))}
    </div>
  );
}

export function PinPad({ onDigit, onBackspace }) {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"];
  return (
    <div className="grid grid-cols-3 gap-3 w-full max-w-[280px] mx-auto">
      {keys.map((k, i) => {
        if (k === "") return <div key={i} />;
        if (k === "back") {
          return (
            <button
              key={i}
              onClick={onBackspace}
              aria-label="Delete digit"
              className="h-16 rounded-2xl flex items-center justify-center"
              style={{ color: theme.textDim }}
            >
              <Delete size={20} />
            </button>
          );
        }
        return (
          <button
            key={i}
            onClick={() => onDigit(k)}
            style={{ background: theme.surface2, border: `1px solid ${theme.border}`, color: theme.text }}
            className="h-16 rounded-2xl text-xl font-medium active:opacity-70"
          >
            {k}
          </button>
        );
      })}
    </div>
  );
}

// Embeddable PIN entry — used both by the full-screen lock and inline inside
// a Sheet for "confirm this transfer with your PIN" prompts.
export function PinEntry({ length = 4, onComplete, error, prompt }) {
  const [pin, setPin] = useState("");

  function digit(d) {
    if (pin.length >= length) return;
    const next = pin + d;
    setPin(next);
    if (next.length === length) {
      onComplete(next);
      setTimeout(() => setPin(""), 250);
    }
  }

  function backspace() {
    setPin((p) => p.slice(0, -1));
  }

  return (
    <div className="flex flex-col items-center">
      {prompt && <div style={{ color: theme.textDim, fontFamily: fonts.body, fontSize: 13 }}>{prompt}</div>}
      <PinDots length={length} filled={pin.length} />
      {error && (
        <div style={{ color: theme.red, fontFamily: fonts.body, fontSize: 12.5 }} className="mb-3">
          {error}
        </div>
      )}
      <PinPad onDigit={digit} onBackspace={backspace} />
    </div>
  );
}

// Full-page lock screen shown on app open, and on first login to choose a PIN.
export default function PinLock({ mode, userName, onUnlock, onSetPin }) {
  const [firstEntry, setFirstEntry] = useState(null);
  const [error, setError] = useState("");

  function handleUnlockAttempt(pin) {
    const ok = onUnlock(pin);
    if (!ok) setError("Incorrect PIN. Try again.");
    else setError("");
  }

  function handleSetFirst(pin) {
    setFirstEntry(pin);
    setError("");
  }

  function handleSetConfirm(pin) {
    if (pin !== firstEntry) {
      setError("PINs didn't match — start again.");
      setFirstEntry(null);
      return;
    }
    onSetPin(pin);
  }

  return (
    <div style={{ background: "#050509" }} className="min-h-screen w-full flex justify-center">
      <div style={{ background: theme.bg, fontFamily: fonts.body }} className="w-full max-w-[430px] min-h-screen flex flex-col justify-center px-6">
        <div className="flex flex-col items-center mb-2">
          <div
            style={{ background: theme.accentSoft, color: theme.accent, width: 52, height: 52, borderRadius: 999 }}
            className="flex items-center justify-center mb-4"
          >
            <Lock size={22} />
          </div>
          <h1 style={{ color: theme.text, fontFamily: fonts.display, fontSize: 24 }} className="text-center">
            {mode === "set" ? (firstEntry ? "Confirm your PIN" : "Create a PIN") : `Welcome back${userName ? ", " + userName : ""}`}
          </h1>
          <p style={{ color: theme.textFaint, fontSize: 12.5 }} className="text-center mt-1">
            {mode === "set" ? "Used to unlock the app — this is a demo PIN, not real security." : "Enter your PIN to continue"}
          </p>
        </div>

        {mode === "set" ? (
          <PinEntry
            key={firstEntry ? "confirm" : "first"}
            onComplete={firstEntry ? handleSetConfirm : handleSetFirst}
            error={error}
          />
        ) : (
          <PinEntry key="unlock" onComplete={handleUnlockAttempt} error={error} />
        )}
      </div>
    </div>
  );
}
