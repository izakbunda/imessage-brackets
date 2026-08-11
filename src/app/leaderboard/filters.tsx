"use client";

import { useRouter } from "next/navigation";
import { GAMES } from "@/lib/games";
import { hapticTap } from "@/lib/haptics";

const PERIODS = [
  { value: "all", label: "All-time" },
  { value: "month", label: "This month" },
  { value: "year", label: "This year" },
] as const;

export function LeaderboardFilters({
  game,
  period,
}: {
  game: string | null;
  period: string;
}) {
  const router = useRouter();

  function navigate(next: { game?: string | null; period?: string }) {
    const qp = new URLSearchParams();
    const nextGame = next.game !== undefined ? next.game : game;
    const nextPeriod = next.period ?? period;
    if (nextGame) qp.set("game", nextGame);
    if (nextPeriod !== "all") qp.set("period", nextPeriod);
    const qs = qp.toString();
    router.push(`/leaderboard${qs ? `?${qs}` : ""}`);
  }

  return (
    <div className="flex flex-col gap-2 mb-3">
      <select
        value={game ?? ""}
        onChange={(e) => {
          hapticTap();
          navigate({ game: e.target.value || null });
        }}
        className="tactile-input px-2.5 py-1.5 text-sm"
      >
        <option value="">All games</option>
        {GAMES.map((g) => (
          <option key={g} value={g}>
            {g}
          </option>
        ))}
      </select>

      <div
        className="flex"
        style={{
          borderRadius: "var(--radius-button)",
          border: "2px solid var(--border-subtle)",
          boxShadow: "var(--shadow-inset)",
          overflow: "hidden",
        }}
      >
        {PERIODS.map((p) => {
          const active = period === p.value;
          return (
            <button
              key={p.value}
              type="button"
              onClick={() => {
                hapticTap();
                navigate({ period: p.value });
              }}
              className="flex-1 px-2 py-1.5 text-xs font-medium"
              style={{
                background: active ? "var(--accent-teal)" : "transparent",
                color: active ? "#3a2f1e" : "var(--foreground)",
              }}
            >
              {p.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
