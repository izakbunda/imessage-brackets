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

        <div className="flex flex-wrap gap-4 mb-4 text-sm">
          <div className="flex gap-2 items-center flex-wrap">
            <span className="text-neutral-500">Game:</span>
            <a href={filterUrl({ game: null })} className={!game ? "font-semibold underline" : "underline"}>
              All
            </a>
            {GAMES.map((g) => (
              <a
                key={g}
                href={filterUrl({ game: g })}
                className={game === g ? "font-semibold underline" : "underline"}
              >
                {g}
              </a>
            ))}
          </div>
        </div>

        <div className="flex gap-2 items-center text-sm mb-6">
          <span className="text-neutral-500">Period:</span>
          {(["all", "month", "year"] as const).map((p) => (
            <a
              key={p}
              href={filterUrl({ period: p })}
              className={period === p ? "font-semibold underline" : "underline"}
            >
              {p === "all" ? "All-time" : p === "month" ? "This month" : "This year"}
            </a>
          ))}
        </div>

        {entries.length === 0 ? (
          <p className="text-sm text-neutral-500">No confirmed matches yet for this filter.</p>
        ) : (
          <ol className="flex flex-col gap-1">
            {entries.map((e, i) => (
              <li key={e.playerId} className="flex justify-between border rounded-md px-3 py-2">
                <span>
                  <span className="text-neutral-400 w-6 inline-block">{i + 1}.</span> {e.name}
                </span>
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
