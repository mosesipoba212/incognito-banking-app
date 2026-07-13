import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { theme, fonts } from "../../lib/theme.js";
import { FullScreen } from "../ui.jsx";

const CANNED = [
  [/frozen|freeze|unfreeze/i, "You can freeze or unfreeze any card instantly from the Card tab — it takes effect immediately."],
  [/direct debit|subscription|prime|spotify/i, "Head to Payments → Direct debits to block or unblock any recurring merchant charge."],
  [/budget|limit/i, "You can set a monthly budget per category from the Budgets screen — we'll flag it when you're close to or over the limit."],
  [/goal|save|saving/i, "Create a savings goal from Savings goals, and optionally turn on round-ups to sweep spare change toward it automatically."],
  [/pin|security|password/i, "Your PIN and password are stored locally in your browser for this demo — you can change your PIN any time from Settings."],
  [/hi|hello|hey/i, "Hey! What can I help you with today?"],
];

function botReply(text) {
  for (const [re, reply] of CANNED) {
    if (re.test(text)) return reply;
  }
  return "Thanks for the message — a member of the (simulated) team will get back to you shortly. In the meantime, check the Help & FAQ screen for common answers.";
}

export default function SupportChatScreen({ onBack }) {
  const [messages, setMessages] = useState([
    { id: 1, from: "bot", text: "Hi, I'm the Incognito support bot (mock). Ask me anything about the app." },
  ]);
  const [input, setInput] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function send() {
    const text = input.trim();
    if (!text) return;
    const userMsg = { id: Date.now(), from: "user", text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setTimeout(() => {
      setMessages((m) => [...m, { id: Date.now() + 1, from: "bot", text: botReply(text) }]);
    }, 500);
  }

  return (
    <FullScreen title="Support chat" onBack={onBack}>
      <div className="px-5 flex flex-col gap-3 pb-3" style={{ minHeight: "calc(100% - 60px)" }}>
        <div className="flex-1 flex flex-col gap-2.5">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
              <div
                style={{
                  background: m.from === "user" ? theme.accent : theme.surface2,
                  color: m.from === "user" ? "#161208" : theme.text,
                  fontFamily: fonts.body,
                  fontSize: 13,
                }}
                className="max-w-[80%] px-3.5 py-2.5 rounded-2xl"
              >
                {m.text}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
      </div>
      <div className="px-5 sticky bottom-0 pb-4 pt-2" style={{ background: theme.bg }}>
        <div
          style={{ background: theme.surface2, border: `1px solid ${theme.border}` }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full"
        >
          <input
            placeholder="Type a message…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            style={{ background: "transparent", color: theme.text, fontSize: 13.5 }}
            className="w-full outline-none"
          />
          <button onClick={send} aria-label="Send message" style={{ color: theme.accent }}>
            <Send size={17} />
          </button>
        </div>
      </div>
    </FullScreen>
  );
}
