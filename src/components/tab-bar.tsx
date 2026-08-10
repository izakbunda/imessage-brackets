"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { hapticTap } from "@/lib/haptics";

function StartIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} />
      <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" />
    </svg>
  );
}

function JoinIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 12h12M12 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M20 5v14" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" />
    </svg>
  );
}

function StatsIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M5 19V10M12 19V5M19 19v-6"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.8}
        strokeLinecap="round"
      />
    </svg>
  );
}

const TABS = [
  { href: "/create", label: "Start", Icon: StartIcon },
  { href: "/join", label: "Join", Icon: JoinIcon },
  { href: "/leaderboard", label: "Stats", Icon: StatsIcon },
];

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 inset-x-0 flex z-50"
      style={{
        background: "var(--card)",
        borderTop: "1px solid var(--border-subtle)",
        boxShadow: "0 -2px 10px rgba(0,0,0,0.06)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {TABS.map(({ href, label, Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            onClick={hapticTap}
            className="flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-transform active:scale-90"
            style={{ color: active ? "var(--accent-blue)" : "var(--foreground)", opacity: active ? 1 : 0.45 }}
          >
            <Icon active={active} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
