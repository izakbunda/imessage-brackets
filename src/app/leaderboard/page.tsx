import { GAMES } from "@/lib/games";
import { getLeaderboard, type Period } from "./queries";
import { HeadToHead } from "./head-to-head";
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
    <main className="mx-auto max-w-2xl p-4 flex flex-col gap-5">
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

      <div className="tactile-card p-3">
        <HeadToHead />
      </div>
    </main>
  );
}

const MEDAL_COLORS: Record<number, [string, string]> = {
  1: ["#ffd76a", "#e0a415"],
  2: ["#e2e6ec", "#a7adb8"],
  3: ["#e8b487", "#b1723c"],
};

const AVATAR_COLORS = ["var(--accent-coral)", "var(--accent-teal)", "var(--accent-mustard)", "var(--accent-sage)"];

function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function LeaderboardRow({ rank, name, wins }: { rank: number; name: string; wins: number }) {
  const medal = MEDAL_COLORS[rank];
  return (
    <li
      className="flex items-center gap-2 px-2.5 py-1.5"
      style={{
        background: "var(--card)",
        color: "var(--card-foreground)",
        borderRadius: "var(--radius-card)",
        boxShadow: "var(--shadow-raised)",
        border: medal ? `2px solid ${medal[1]}` : "2px solid var(--accent-teal)",
      }}
    >
      <RankBadge rank={rank} medal={medal} />
      <span
        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
        style={{ background: avatarColor(name), color: "#23222b" }}
      >
        {name.slice(0, 1).toUpperCase()}
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

function RankBadge({ rank, medal }: { rank: number; medal?: [string, string] }) {
  if (!medal) {
    return (
      <span className="w-5 text-center text-xs shrink-0" style={{ color: "var(--muted)" }}>
        {rank}
      </span>
    );
  }
  const [light, dark] = medal;
  return (
    <span
      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
      style={{
        background: `linear-gradient(145deg, ${light}, ${dark})`,
        boxShadow: `var(--shadow-raised), inset 0 1px 1px rgba(255,255,255,0.5)`,
      }}
    >
      {rank}
    </span>
  );
}
