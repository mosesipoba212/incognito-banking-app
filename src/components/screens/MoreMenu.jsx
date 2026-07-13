import { Wallet, PiggyBank, PieChart, FileText, Settings as SettingsIcon, HelpCircle, MessageCircle, ChevronRight } from "lucide-react";
import { theme, fonts } from "../../lib/theme.js";
import { userInitials } from "../../lib/storage.js";
import { FullScreen } from "../ui.jsx";

const ITEMS = [
  { key: "accounts", label: "Accounts", icon: Wallet },
  { key: "budgets", label: "Budgets", icon: PieChart },
  { key: "goals", label: "Savings goals", icon: PiggyBank },
  { key: "statements", label: "Statements & export", icon: FileText },
  { key: "settings", label: "Settings", icon: SettingsIcon },
  { key: "help", label: "Help & FAQ", icon: HelpCircle },
  { key: "support", label: "Contact support", icon: MessageCircle },
];

export default function MoreMenu({ user, onBack, onNavigate }) {
  return (
    <FullScreen title="More" onBack={onBack}>
      <div className="px-5 mb-5 flex items-center gap-3">
        <div style={{ width: 44, height: 44, borderRadius: 999, background: theme.accentSoft }} className="flex items-center justify-center">
          <span style={{ color: theme.accent, fontFamily: fonts.display, fontSize: 15, fontWeight: 600 }}>{userInitials(user.name)}</span>
        </div>
        <div>
          <div style={{ color: theme.text, fontFamily: fonts.body, fontSize: 14, fontWeight: 600 }}>{user.name}</div>
          <div style={{ color: theme.textFaint, fontFamily: fonts.body, fontSize: 12 }}>{user.email}</div>
        </div>
      </div>

      <div className="px-5 flex flex-col gap-2">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              style={{ background: theme.surface, border: `1px solid ${theme.border}` }}
              className="w-full rounded-2xl p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span style={{ color: theme.accent }}>
                  <Icon size={17} />
                </span>
                <span style={{ color: theme.text, fontFamily: fonts.body, fontSize: 14 }}>{item.label}</span>
              </div>
              <ChevronRight size={16} color={theme.textFaint} />
            </button>
          );
        })}
      </div>
    </FullScreen>
  );
}
