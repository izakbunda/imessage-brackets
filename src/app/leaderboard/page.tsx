import { GAMES } from "@/lib/games";
import { getLeaderboard, type Period } from "./queries";
import { HeadToHead } from "./head-to-head";

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ game?: string; period?: string }>;
}) {
  const params = await searchParams;
  const game = params.game && (GAMES as readonly string[]).includes(params.game) ? params.game : null;
  const period: Period = params.period === "month" || params.period === "year" ? params.period : "all";

  const entries = await getLeaderboard(game, period);

  function filterUrl(next: { game?: string | null; period?: string }) {
    const qp = new URLSearchParams();
    const nextGame = next.game !== undefined ? next.game : game;
    const nextPeriod = next.period ?? period;
    if (nextGame) qp.set("game", nextGame);
    if (nextPeriod !== "all") qp.set("period", nextPeriod);
    const qs = qp.toString();
    return `/leaderboard${qs ? `?${qs}` : ""}`;
  }

  return (
    <main className="mx-auto max-w-2xl p-6 flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold mb-4">Leaderboard</h1>

        <div className="flex gap-2 flex-wrap mb-3 text-sm">
          <FilterChip href={filterUrl({ game: null })} active={!game}>
            All
          </FilterChip>
          {GAMES.map((g) => (
            <FilterChip key={g} href={filterUrl({ game: g })} active={game === g}>
              {g}
            </FilterChip>
          ))}
        </div>

        <div className="flex gap-2 flex-wrap text-sm mb-6">
          {(["all", "month", "year"] as const).map((p) => (
            <FilterChip key={p} href={filterUrl({ period: p })} active={period === p}>
              {p === "all" ? "All-time" : p === "month" ? "This month" : "This year"}
            </FilterChip>
          ))}
        </div>

        {entries.length === 0 ? (
          <p className="text-sm text-neutral-500">No confirmed matches yet for this filter.</p>
        ) : (
          <ol className="flex flex-col gap-2">
            {entries.map((e, i) => (
              <li key={e.playerId} className="tactile-card flex items-center gap-3 px-3 py-2.5">
                <RankBadge rank={i + 1} />
                <span className="flex-1">{e.name}</span>
                <span className="font-semibold">{e.wins}</span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <HeadToHead />
    </main>
  );
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="px-3 py-1.5 rounded-full font-medium"
      style={
        active
          ? { background: "var(--accent-blue)", color: "white", boxShadow: "var(--shadow-raised)" }
          : { background: "var(--card)", color: "var(--foreground)", boxShadow: "var(--shadow-raised)", opacity: 0.7 }
      }
    >
      {children}
    </a>
  );
}

const MEDAL_COLORS: Record<number, [string, string]> = {
  1: ["#ffd76a", "#e0a415"],
  2: ["#e2e6ec", "#a7adb8"],
  3: ["#e8b487", "#b1723c"],
};

function RankBadge({ rank }: { rank: number }) {
  const medal = MEDAL_COLORS[rank];
  if (!medal) {
    return <span className="w-7 text-center text-sm text-neutral-400">{rank}</span>;
  }
  const [light, dark] = medal;
  return (
    <span
      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
      style={{
        background: `linear-gradient(145deg, ${light}, ${dark})`,
        boxShadow: `var(--shadow-raised), inset 0 1px 1px rgba(255,255,255,0.5)`,
      }}
    >
      {rank}
    </span>
  );
}
