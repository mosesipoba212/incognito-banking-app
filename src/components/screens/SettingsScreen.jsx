import { useState } from "react";
import { Trash2 } from "lucide-react";
import { theme, fonts } from "../../lib/theme.js";
import { FullScreen, Sheet, TextField, PrimaryButton, SecondaryButton, Toggle, EmptyState } from "../ui.jsx";
import { PinEntry } from "../PinLock.jsx";

export default function SettingsScreen({
  user,
  payees,
  hideBalance,
  setHideBalance,
  onBack,
  onSaveProfile,
  onDeletePayee,
  onChangePin,
  onSetThreshold,
  onLogout,
}) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [pinSheet, setPinSheet] = useState(false);
  const [pinStep, setPinStep] = useState("current"); // current -> new -> confirm
  const [pinError, setPinError] = useState("");
  const [firstNewPin, setFirstNewPin] = useState("");
  const [threshold, setThreshold] = useState(String(user.txnPinThreshold));

  function saveProfile() {
    if (!name.trim() || !email.trim()) return;
    onSaveProfile({ name: name.trim(), email: email.trim().toLowerCase() });
  }

  function resetPinFlow() {
    setPinStep("current");
    setPinError("");
    setFirstNewPin("");
  }

  function handlePinStep(pin) {
    if (pinStep === "current") {
      if (pin !== user.pin) {
        setPinError("Incorrect current PIN.");
        return;
      }
      setPinError("");
      setPinStep("new");
    } else if (pinStep === "new") {
      setFirstNewPin(pin);
      setPinError("");
      setPinStep("confirm");
    } else {
      if (pin !== firstNewPin) {
        setPinError("PINs didn't match — start again.");
        setPinStep("new");
        setFirstNewPin("");
        return;
      }
      onChangePin(pin);
      setPinSheet(false);
      resetPinFlow();
    }
  }

  function saveThreshold() {
    const v = parseFloat(threshold);
    if (v >= 0) onSetThreshold(v);
  }

  return (
    <FullScreen title="Settings" onBack={onBack}>
      <div className="px-5 flex flex-col gap-6">
        <div>
          <div style={{ color: theme.textDim, fontFamily: fonts.body, fontSize: 13, marginBottom: 8 }}>Profile</div>
          <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <PrimaryButton onClick={saveProfile} disabled={!name.trim() || !email.trim()}>
            Save profile
          </PrimaryButton>
        </div>

        <div>
          <div style={{ color: theme.textDim, fontFamily: fonts.body, fontSize: 13, marginBottom: 8 }}>Security</div>
          <SecondaryButton
            onClick={() => {
              resetPinFlow();
              setPinSheet(true);
            }}
          >
            Change PIN
          </SecondaryButton>
          <div className="mt-3">
            <span style={{ color: theme.textDim, fontFamily: fonts.body, fontSize: 12 }}>
              Require PIN for transfers over
            </span>
            <div className="flex gap-2 mt-1.5">
              <div
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl flex-1"
                style={{ background: theme.surface2, border: `1px solid ${theme.border}` }}
              >
                <span style={{ color: theme.accent }}>£</span>
                <input
                  type="number"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  style={{ background: "transparent", color: theme.text, fontFamily: fonts.mono }}
                  className="w-full outline-none text-sm"
                />
              </div>
              <button
                onClick={saveThreshold}
                style={{ background: theme.accent, color: "#161208", fontFamily: fonts.body, fontWeight: 600, fontSize: 13 }}
                className="px-4 rounded-2xl"
              >
                Save
              </button>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span style={{ color: theme.text, fontFamily: fonts.body, fontSize: 14 }}>Incognito mode</span>
            <Toggle on={hideBalance} onClick={() => setHideBalance((h) => !h)} label="Incognito mode" />
          </div>
        </div>

        <div>
          <div style={{ color: theme.textDim, fontFamily: fonts.body, fontSize: 13, marginBottom: 8 }}>Payees</div>
          {payees.length === 0 && <EmptyState>No saved payees.</EmptyState>}
          <div className="flex flex-col gap-2">
            {payees.map((p) => (
              <div key={p.id} style={{ background: theme.surface, border: `1px solid ${theme.border}` }} className="rounded-2xl p-3.5 flex items-center justify-between">
                <div>
                  <div style={{ color: theme.text, fontFamily: fonts.body, fontSize: 13.5 }}>{p.name}</div>
                  <div style={{ color: theme.textFaint, fontFamily: fonts.mono, fontSize: 11 }}>
                    {p.sortCode} · {p.accountNumber}
                  </div>
                </div>
                <button onClick={() => onDeletePayee(p.id)} aria-label={`Remove payee ${p.name}`} style={{ color: theme.textFaint }}>
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <SecondaryButton tone="danger" onClick={onLogout}>
          Log out
        </SecondaryButton>
      </div>

      {pinSheet && (
        <Sheet
          title={pinStep === "current" ? "Enter current PIN" : pinStep === "new" ? "Choose a new PIN" : "Confirm new PIN"}
          onClose={() => {
            setPinSheet(false);
            resetPinFlow();
          }}
        >
          <PinEntry key={pinStep} onComplete={handlePinStep} error={pinError} />
        </Sheet>
      )}
    </FullScreen>
  );
}
