import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { totalRounds } from "@/lib/bracket";
import { getPlayerBracketStatus } from "@/lib/player-status";
import { LobbyClient } from "./lobby-client";
import { MatchPanel } from "./match-panel";

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

  const nameByRoomPlayerId = new Map(safeRoomPlayers.map((p) => [p.id, p.name]));

  let matchSection = null;
  if (room.status === "locked" || room.status === "complete") {
    const { data: matches } = await supabaseAdmin
      .from("matches")
      .select("*")
      .eq("room_id", room.id);

    const finalRound = totalRounds(room.player_count);
    const { currentMatch, eliminated, champion } = getPlayerBracketStatus(
      matches ?? [],
      viewer.id,
      finalRound
    );

    if (currentMatch) {
      matchSection = (
        <MatchPanel
          code={code}
          token={token}
          roomId={room.id}
          viewerRoomPlayerId={viewer.id}
          match={{
            id: currentMatch.id,
            room_player_1_id: currentMatch.room_player_1_id,
            room_player_2_id: currentMatch.room_player_2_id,
            winner_room_player_id: currentMatch.winner_room_player_id,
            reported_by_room_player_id: currentMatch.reported_by_room_player_id,
            player_1_score: currentMatch.player_1_score,
            player_2_score: currentMatch.player_2_score,
            player1Name: nameByRoomPlayerId.get(currentMatch.room_player_1_id ?? "") ?? "TBD",
            player2Name: currentMatch.room_player_2_id
              ? nameByRoomPlayerId.get(currentMatch.room_player_2_id) ?? "Unknown"
              : null,
          }}
        />
      );
    } else if (champion) {
      matchSection = <p className="font-medium">🏆 You won the bracket!</p>;
    } else if (eliminated) {
      matchSection = <p className="text-neutral-500">You&apos;ve been eliminated. Thanks for playing!</p>;
    }
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold mb-1">{room.game}</h1>
      <p className="text-neutral-500 mb-6">
        Room <span className="font-mono">{room.code}</span> — {room.status}
      </p>
      <p className="mb-4">
        You&apos;re in as <strong>{viewer.players?.name}</strong>
        {isCreator ? " (creator)" : ""}.
      </p>

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
      ) : (
        <div className="flex flex-col gap-4">
          {matchSection}
          <Link href={`/room/${code}/bracket`} className="text-sm text-blue-600 underline">
            View full bracket
          </Link>
        </div>
      )}
    </main>
  );
}
