"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/create", label: "Start" },
  { href: "/join", label: "Join" },
  { href: "/leaderboard", label: "Stats" },
];

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 border-t bg-white flex z-50">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex-1 text-center py-3 text-sm font-medium ${
              active ? "text-blue-500" : "text-neutral-400"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
