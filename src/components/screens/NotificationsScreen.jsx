import { Bell, CreditCard, AlertTriangle, Send, Repeat } from "lucide-react";
import { theme, fonts } from "../../lib/theme.js";
import { FullScreen, EmptyState } from "../ui.jsx";

const ICONS = {
  payment: Send,
  budget: AlertTriangle,
  directDebit: CreditCard,
  scheduled: Repeat,
  default: Bell,
};

export default function NotificationsScreen({ notifications, onBack, onMarkRead, onMarkAllRead }) {
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <FullScreen
      title="Notifications"
      onBack={onBack}
      right={
        unreadCount > 0 && (
          <button onClick={onMarkAllRead} style={{ color: theme.accent, fontFamily: fonts.body, fontSize: 11.5 }}>
            Mark all read
          </button>
        )
      }
    >
      <div className="px-5 flex flex-col gap-2">
        {notifications.length === 0 && <EmptyState>No notifications yet.</EmptyState>}
        {notifications.map((n) => {
          const Icon = ICONS[n.type] || ICONS.default;
          return (
            <button
              key={n.id}
              onClick={() => onMarkRead(n.id)}
              style={{
                background: n.read ? theme.surface : theme.accentSoft,
                border: `1px solid ${theme.border}`,
                textAlign: "left",
              }}
              className="rounded-2xl p-3.5 flex items-start gap-3"
            >
              <div
                style={{ background: theme.surface2, color: theme.accent, width: 32, height: 32, borderRadius: 999 }}
                className="flex items-center justify-center shrink-0 mt-0.5"
              >
                <Icon size={15} />
              </div>
              <div className="flex-1 min-w-0">
                <div style={{ color: theme.text, fontFamily: fonts.body, fontSize: 13, fontWeight: n.read ? 400 : 600 }}>
                  {n.message}
                </div>
                <div style={{ color: theme.textFaint, fontFamily: fonts.body, fontSize: 11, marginTop: 2 }}>
                  {new Date(n.createdAt).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
              {!n.read && <span style={{ width: 7, height: 7, borderRadius: 999, background: theme.accent, marginTop: 6 }} className="shrink-0" />}
            </button>
          );
        })}
      </div>
    </FullScreen>
  );
}
