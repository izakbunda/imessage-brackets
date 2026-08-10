import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { totalRounds } from "@/lib/bracket";
import { getPlayerBracketStatus } from "@/lib/player-status";
import { BracketCanvas } from "@/components/bracket-canvas";
import { NotificationOptIn } from "@/components/notification-opt-in";
import { LobbyClient } from "./lobby-client";

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

  const { data: roomPlayers } = await supabaseAdmin
    .from("room_players")
    .select("id, player_id, seed_position, player_link_token, players(name, photo_url)")
    .eq("room_id", room.id)
    .order("joined_at", { ascending: true });

  const viewer = roomPlayers?.find((p) => p.player_link_token === token);
  if (!viewer) notFound();

  const isCreator = viewer.player_id === room.creator_player_id;

  const safeRoomPlayers = (roomPlayers ?? []).map((p) => ({
    id: p.id,
    player_id: p.player_id,
    seed_position: p.seed_position,
    name: p.players?.name ?? "Unknown",
    photo_url: p.players?.photo_url ?? null,
  }));

  let bracketSection = null;
  if (room.status === "locked" || room.status === "complete") {
    const { data: matches } = await supabaseAdmin
      .from("matches")
      .select("*")
      .eq("room_id", room.id);

    const finalRound = totalRounds(room.player_count);
    const { eliminated, champion } = getPlayerBracketStatus(matches ?? [], viewer.id, finalRound);

    bracketSection = (
      <div className="flex flex-col gap-3">
        {champion && <p className="font-medium">🏆 You won the bracket!</p>}
        {eliminated && (
          <p className="text-sm muted">You&apos;ve been eliminated. Thanks for playing!</p>
        )}
        <BracketCanvas
          code={code}
          initialRoom={{ id: room.id, code: room.code, status: room.status, player_count: room.player_count, game: room.game }}
          initialRoomPlayers={safeRoomPlayers.map((p) => ({ id: p.id, name: p.name }))}
          initialMatches={matches ?? []}
          token={token}
          viewerRoomPlayerId={viewer.id}
        />
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold mb-1">{room.game}</h1>
      <p className="muted mb-6">
        Room <span className="font-mono">{room.code}</span> — {room.status}
      </p>
      <p className="mb-4">
        You&apos;re in as <strong>{viewer.players?.name}</strong>
        {isCreator ? " (creator)" : ""}.
      </p>

      <div className="mb-4">
        <NotificationOptIn token={token} />
      </div>

      {room.status === "lobby" ? (
        <LobbyClient
          room={{
            id: room.id,
            code: room.code,
            status: room.status,
            seeding_mode: room.seeding_mode,
            player_count: room.player_count,
          }}
          roomPlayers={safeRoomPlayers}
          isCreator={isCreator}
          playerToken={token}
        />
      ) : room.status === "canceled" ? (
        <p className="text-sm muted">This room was canceled by the creator.</p>
      ) : (
        bracketSection
      )}
    </main>
  );
}
