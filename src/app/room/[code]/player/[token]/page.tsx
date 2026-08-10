import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";

export default async function RoomPlayerPage({
  params,
}: {
  params: Promise<{ code: string; token: string }>;
}) {
  const { code, token } = await params;

  const { data: room } = await supabaseAdmin
    .from("rooms")
    .select("*")
    .eq("code", code)
    .maybeSingle();

  if (!room) notFound();

  const { data: roomPlayer } = await supabaseAdmin
    .from("room_players")
    .select("*, players(*)")
    .eq("room_id", room.id)
    .eq("player_link_token", token)
    .maybeSingle();

  if (!roomPlayer) notFound();

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold mb-2">{room.game}</h1>
      <p className="text-neutral-500 mb-6">
        Room <span className="font-mono">{room.code}</span> — {room.status}
      </p>
      <p>
        You&apos;re in as <strong>{roomPlayer.players?.name}</strong>.
      </p>
      <p className="text-sm text-neutral-500 mt-4">
        Lobby (live roster, lock/cancel, bracket) lands in the next step.
      </p>
    </main>
  );
}
