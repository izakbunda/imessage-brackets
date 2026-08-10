import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { totalRounds } from "@/lib/bracket";
import { RealtimeRefresh } from "./realtime-refresh";

export default async function BracketPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const { data: room } = await supabaseAdmin.from("rooms").select("*").eq("code", code).maybeSingle();
  if (!room) notFound();

  const { data: roomPlayers } = await supabaseAdmin
    .from("room_players")
    .select("id, players(name, photo_url)")
    .eq("room_id", room.id);

  const { data: matches } = await supabaseAdmin
    .from("matches")
    .select("*")
    .eq("room_id", room.id)
    .order("round_number")
    .order("slot_in_round");

  const nameById = new Map((roomPlayers ?? []).map((p) => [p.id, p.players?.name ?? "Unknown"]));

  const rounds = totalRounds(room.player_count);
  const byRound = new Map<number, NonNullable<typeof matches>>();
  for (const m of matches ?? []) {
    if (!byRound.has(m.round_number)) byRound.set(m.round_number, []);
    byRound.get(m.round_number)!.push(m);
  }

  function roundLabel(round: number) {
    if (round === rounds) return "Final";
    if (round === rounds - 1) return "Semifinal";
    return `Round ${round}`;
  }

  function playerLabel(id: string | null, matchConfirmed: boolean, isWinner: boolean) {
    if (!id) return <span className="text-neutral-400">TBD</span>;
    const name = nameById.get(id) ?? "Unknown";
    return <span className={matchConfirmed && isWinner ? "font-semibold" : ""}>{name}</span>;
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <RealtimeRefresh roomId={room.id} />
      <h1 className="text-2xl font-semibold mb-1">{room.game}</h1>
      <p className="text-neutral-500 mb-6">
        Room <span className="font-mono">{room.code}</span> — {room.status}
      </p>

      {room.status === "lobby" && (
        <p className="text-sm text-neutral-500">Bracket hasn&apos;t been generated yet.</p>
      )}
      {room.status === "canceled" && (
        <p className="text-sm text-neutral-500">This room was canceled.</p>
      )}

      <div className="flex flex-col gap-8">
        {Array.from(byRound.entries()).map(([round, roundMatches]) => (
          <div key={round}>
            <h2 className="text-sm font-medium text-neutral-500 mb-2">{roundLabel(round)}</h2>
            <div className="flex flex-col gap-2">
              {roundMatches.map((m) => (
                <div key={m.id} className="border rounded-md px-3 py-2 flex flex-col gap-1">
                  <div className="flex justify-between">
                    {playerLabel(
                      m.room_player_1_id,
                      !!m.confirmed_at,
                      m.winner_room_player_id === m.room_player_1_id
                    )}
                    {m.player_1_score !== null && (
                      <span className="text-sm text-neutral-500">{m.player_1_score}</span>
                    )}
                  </div>
                  <div className="flex justify-between">
                    {playerLabel(
                      m.room_player_2_id,
                      !!m.confirmed_at,
                      m.winner_room_player_id === m.room_player_2_id
                    )}
                    {m.player_2_score !== null && (
                      <span className="text-sm text-neutral-500">{m.player_2_score}</span>
                    )}
                  </div>
                  {!m.confirmed_at && m.reported_by_room_player_id && (
                    <span className="text-xs text-amber-600">awaiting confirmation</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {room.status === "complete" && (
        <p className="mt-6 font-medium">
          🏆{" "}
          {nameById.get(
            (matches ?? []).find((m) => m.round_number === rounds)?.winner_room_player_id ?? ""
          )}{" "}
          won the bracket!
        </p>
      )}
    </main>
  );
}
