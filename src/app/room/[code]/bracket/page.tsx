import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { BracketCanvas } from "@/components/bracket-canvas";

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
    .select("id, players(name)")
    .eq("room_id", room.id);

  const { data: matches } = await supabaseAdmin
    .from("matches")
    .select("*")
    .eq("room_id", room.id)
    .order("round_number")
    .order("slot_in_round");

  return (
    <main className="w-full mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold mb-1">{room.game}</h1>
      <p className="muted mb-6">
        Room <span className="font-mono">{room.code}</span> — {room.status}
      </p>

      {room.status === "lobby" && (
        <p className="text-sm muted">Bracket hasn&apos;t been generated yet.</p>
      )}
      {room.status === "canceled" && (
        <p className="text-sm muted">This room was canceled.</p>
      )}
      {(room.status === "locked" || room.status === "complete") && (
        <BracketCanvas
          code={code}
          initialRoom={{
            id: room.id,
            code: room.code,
            status: room.status,
            // finalized to the real participant count at lock time
            player_count: room.player_count ?? (roomPlayers ?? []).length,
            game: room.game,
          }}
          initialRoomPlayers={(roomPlayers ?? []).map((p) => ({ id: p.id, name: p.players?.name ?? "Unknown" }))}
          initialMatches={matches ?? []}
        />
      )}
    </main>
  );
}
