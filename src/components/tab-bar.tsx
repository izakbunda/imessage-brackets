"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { hapticTap } from "@/lib/haptics";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";

const PX = 2;

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
  const reducedMotion = usePrefersReducedMotion();

  return (
    <div
      className="fixed inset-x-8 flex justify-center z-50 pointer-events-none"
      style={{ bottom: "calc(24px + env(safe-area-inset-bottom))" }}
    >
      <nav
        className="flex gap-1 px-1.5 py-2.5 w-full max-w-xs pointer-events-auto"
        style={{
          background: "var(--background-alt)",
          border: "3px solid var(--accent-teal)",
          borderRadius: 999,
          boxShadow: "var(--shadow-raised-lg)",
        }}
      >
        {TABS.map(({ href, label, grid, color }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={hapticTap}
              className="relative flex-1 flex items-center justify-center gap-1.5 px-2 py-2 transition-transform active:scale-90"
              style={{
                fontFamily: "var(--font-pixel-display), monospace",
                fontSize: 8,
                color: active ? "#23222b" : "var(--muted)",
              }}
            >
              {active && (
                <motion.span
                  layoutId="tab-pill"
                  transition={
                    reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 32 }
                  }
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: color,
                    borderRadius: 999,
                  }}
                />
              )}
              <motion.span
                animate={active && !reducedMotion ? { y: [0, -3, 0] } : { y: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="relative flex items-center gap-1.5"
              >
                <PixelIcon grid={grid} color={active ? "#23222b" : "var(--muted)"} />
                {label}
              </motion.span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
