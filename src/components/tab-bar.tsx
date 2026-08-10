"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { hapticTap } from "@/lib/haptics";

const PX = 2.5;

function PixelIcon({ grid, color }: { grid: string[]; color: string }) {
  return (
    <svg width={PX * 8} height={PX * 8} viewBox={`0 0 ${PX * 8} ${PX * 8}`}>
      {grid.map((row, y) =>
        [...row].map((cell, x) =>
          cell === "1" ? (
            <rect key={`${x}-${y}`} x={x * PX} y={y * PX} width={PX} height={PX} fill={color} />
          ) : null
        )
      )}
    </svg>
  );
}

const STAR_GRID = [
  "00011000",
  "00011000",
  "01111110",
  "11111111",
  "01111110",
  "00111100",
  "00100100",
  "01000010",
];

const ARROW_GRID = [
  "00000000",
  "00010000",
  "00011000",
  "11111100",
  "00011000",
  "00010000",
  "00000000",
  "00000000",
];

const BARS_GRID = [
  "00000000",
  "00000100",
  "00000100",
  "00010100",
  "00010100",
  "01010100",
  "01010100",
  "01010100",
];

const TABS = [
  { href: "/create", label: "Start", grid: STAR_GRID, color: "var(--accent-mustard)" },
  { href: "/join", label: "Join", grid: ARROW_GRID, color: "var(--accent-teal)" },
  { href: "/leaderboard", label: "Stats", grid: BARS_GRID, color: "var(--accent-sage)" },
];

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 inset-x-0 flex z-50"
      style={{
        background: "var(--background-alt)",
        borderTop: "3px solid var(--accent-teal)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {TABS.map(({ href, label, grid, color }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            onClick={hapticTap}
            className="flex-1 flex flex-col items-center gap-1 py-2.5 transition-transform active:scale-90"
            style={{
              fontFamily: "var(--font-pixel-display), monospace",
              fontSize: 9,
              color: active ? color : "var(--muted)",
              opacity: active ? 1 : 0.7,
            }}
          >
            <PixelIcon grid={grid} color={active ? color : "var(--muted)"} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
