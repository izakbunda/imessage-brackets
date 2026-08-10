import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { JoinForm } from "./join-form";

export default async function JoinRoomPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const { data: room } = await supabaseAdmin
    .from("rooms")
    .select("*, room_players(id)")
    .eq("code", code)
    .maybeSingle();

  if (!room) notFound();

  return (
    <main className="w-full mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold mb-2">Join bracket</h1>
      <p className="muted mb-6">
        {room.game} — {room.room_players.length}/{room.player_count} players
      </p>

      {room.status !== "lobby" ? (
        <p className="text-sm muted">
          This room is no longer accepting new players.
        </p>
      ) : room.room_players.length >= room.player_count ? (
        <p className="text-sm muted">This room is full.</p>
      ) : (
        <JoinForm code={code} />
      )}
    </main>
  );
}
