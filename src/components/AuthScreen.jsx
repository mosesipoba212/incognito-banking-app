import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { theme, fonts } from "../lib/theme.js";
import { signUp, logIn } from "../lib/storage.js";

function Field({ label, ...props }) {
  return (
    <label className="flex flex-col gap-1.5 mb-4">
      <span style={{ color: theme.textDim, fontFamily: fonts.body, fontSize: 12 }}>{label}</span>
      <input
        {...props}
        style={{ background: theme.surface2, border: `1px solid ${theme.border}`, color: theme.text }}
        className="w-full px-4 py-3 rounded-2xl outline-none text-sm"
      />
    </label>
  );
}

export default function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login"); // 'login' | 'signup'
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function switchMode(next) {
    setMode(next);
    setError("");
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const user =
        mode === "signup"
          ? signUp({ name, email, password })
          : logIn({ email, password });
      onAuth(user);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit =
    email.trim() && password.trim() && (mode === "login" || name.trim());

  return (
    <div style={{ background: "#050509" }} className="min-h-screen w-full flex justify-center">
      <div
        style={{ background: theme.bg, fontFamily: fonts.body }}
        className="w-full max-w-[430px] min-h-screen flex flex-col justify-center px-6"
      >
        <div className="flex items-center gap-1.5 justify-center mb-2">
          <div style={{ width: 7, height: 7, borderRadius: 999, background: theme.accent }} />
          <span style={{ color: theme.textFaint, fontFamily: fonts.mono, fontSize: 11, letterSpacing: 3 }}>
            INCOGNITO
          </span>
        </div>

        <h1
          style={{ color: theme.text, fontFamily: fonts.display, fontSize: 30, textAlign: "center" }}
          className="mb-1 mt-2"
        >
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p style={{ color: theme.textDim, fontSize: 13, textAlign: "center" }} className="mb-8">
          {mode === "login" ? "Log in to see your accounts." : "Takes about 30 seconds."}
        </p>

        <form onSubmit={handleSubmit}>
          {mode === "signup" && (
            <Field
              label="Full name"
              type="text"
              autoFocus
              placeholder="Ada Lovelace"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
          <Field
            label="Email"
            type="email"
            autoFocus={mode === "login"}
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div className="flex flex-col gap-1.5 mb-2">
            <span style={{ color: theme.textDim, fontFamily: fonts.body, fontSize: 12 }}>Password</span>
            <div
              className="flex items-center gap-2 px-4 py-3 rounded-2xl"
              style={{ background: theme.surface2, border: `1px solid ${theme.border}` }}
            >
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ background: "transparent", color: theme.text }}
                className="w-full outline-none text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                style={{ color: theme.textFaint }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ color: theme.red, fontSize: 12.5 }} className="mt-2 mb-1">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit || submitting}
            style={{
              background: !canSubmit || submitting ? theme.surface2 : theme.accent,
              color: !canSubmit || submitting ? theme.textFaint : "#161208",
              fontFamily: fonts.body,
              fontWeight: 600,
            }}
            className="w-full py-3.5 rounded-2xl text-[15px] mt-4 transition-opacity active:opacity-80"
          >
            {mode === "login" ? "Log in" : "Sign up"}
          </button>
        </form>

        <div className="flex items-center justify-center gap-1.5 mt-6">
          <span style={{ color: theme.textDim, fontSize: 13 }}>
            {mode === "login" ? "New here?" : "Already have an account?"}
          </span>
          <button
            onClick={() => switchMode(mode === "login" ? "signup" : "login")}
            style={{ color: theme.accent, fontSize: 13, fontWeight: 600 }}
          >
            {mode === "login" ? "Sign up" : "Log in"}
          </button>
        </div>

        <p style={{ color: theme.textFaint, fontSize: 11 }} className="text-center mt-8">
          Demo only — accounts and passwords are stored in your browser, not on a server.
        </p>
      </div>
    </div>
  );
}
