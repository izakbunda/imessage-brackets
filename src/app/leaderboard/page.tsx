import { GAMES } from "@/lib/games";
import { getLeaderboard, type Period } from "./queries";
import { HeadToHeadModal } from "./head-to-head-modal";
import { LeaderboardFilters } from "./filters";

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ game?: string; period?: string }>;
}) {
  const params = await searchParams;
  const game = params.game && (GAMES as readonly string[]).includes(params.game) ? params.game : null;
  const period: Period = params.period === "month" || params.period === "year" ? params.period : "all";

  const entries = await getLeaderboard(game, period);

  return (
    <main className="w-full mx-auto max-w-2xl p-4 flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold mb-3">Leaderboard</h1>

        <LeaderboardFilters game={game} period={period} />

        {entries.length === 0 ? (
          <p className="tactile-card text-sm p-3 text-center" style={{ color: "var(--muted)" }}>
            No confirmed matches yet for this filter.
          </p>
        ) : (
          <ol className="flex flex-col gap-1.5">
            {entries.map((e, i) => (
              <LeaderboardRow key={e.playerId} rank={i + 1} name={e.name} wins={e.wins} />
            ))}
          </ol>
        )}
      </div>

      <HeadToHeadModal />
    </main>
  );
}

const MEDAL_TEXT_COLORS: Record<number, string> = {
  1: "#c98a12",
  2: "#8b8f99",
  3: "#a1652f",
};

function LeaderboardRow({ rank, name, wins }: { rank: number; name: string; wins: number }) {
  const medalColor = MEDAL_TEXT_COLORS[rank];
  return (
    <li
      className="flex items-center gap-3 px-2.5 py-1.5"
      style={{
        background: "var(--card)",
        color: "var(--card-foreground)",
        borderRadius: "var(--radius-card)",
        boxShadow: "var(--shadow-raised)",
        border: medalColor ? `2px solid ${medalColor}` : "2px solid var(--accent-teal)",
      }}
    >
      <span
        className="w-5 text-center text-sm font-bold shrink-0"
        style={{ color: medalColor ?? "var(--muted)" }}
      >
        {rank}
      </span>
      <span className="flex-1 truncate text-sm">{name}</span>
      <span className="font-semibold text-right text-sm" style={{ minWidth: 20 }}>
        {wins}
      </span>
      <span className="text-xs" style={{ color: "var(--muted)" }}>
        wins
      </span>
    </li>
  );
}
