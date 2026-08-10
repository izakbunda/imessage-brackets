"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { generateBracketSkeleton } from "@/lib/bracket";
import { broadcastRoomChanged } from "@/lib/realtime";

async function requireCreator(code: string, token: string) {
  const { data: room } = await supabaseAdmin
    .from("rooms")
    .select("*, room_players(*)")
    .eq("code", code)
    .single();

  if (!room) throw new Error("Room not found.");

  const roomPlayer = room.room_players.find((p) => p.player_link_token === token);
  if (!roomPlayer || roomPlayer.player_id !== room.creator_player_id) {
    throw new Error("Only the room creator can do that.");
  }

  return { room, roomPlayers: room.room_players };
}

export async function cancelRoom(code: string, token: string) {
  const { room } = await requireCreator(code, token);
  if (room.status !== "lobby") {
    throw new Error("This room can't be canceled anymore.");
  }

  const { error } = await supabaseAdmin
    .from("rooms")
    .update({ status: "canceled" })
    .eq("id", room.id);
  if (error) throw error;

  await broadcastRoomChanged(room.id);
}

export async function lockRoomAuto(code: string, token: string) {
  const { room, roomPlayers } = await requireCreator(code, token);
  assertLockable(room, roomPlayers, "auto");

  const shuffled = [...roomPlayers].sort(() => Math.random() - 0.5);
  await generateAndLock(room, shuffled.map((p) => p.id));
}

export async function lockRoomManual(code: string, token: string, orderedRoomPlayerIds: string[]) {
  const { room, roomPlayers } = await requireCreator(code, token);
  assertLockable(room, roomPlayers, "manual");

  const validIds = new Set(roomPlayers.map((p) => p.id));
  const isValidOrder =
    orderedRoomPlayerIds.length === roomPlayers.length &&
    orderedRoomPlayerIds.every((id) => validIds.has(id)) &&
    new Set(orderedRoomPlayerIds).size === orderedRoomPlayerIds.length;

  if (!isValidOrder) {
    throw new Error("Invalid seeding order.");
  }

  await generateAndLock(room, orderedRoomPlayerIds);
}

function assertLockable(
  room: { status: string; player_count: number; seeding_mode: string },
  roomPlayers: unknown[],
  expectedSeedingMode: "auto" | "manual"
) {
  if (room.status !== "lobby") {
    throw new Error("This room is already locked.");
  }
  if (roomPlayers.length < room.player_count) {
    throw new Error("Room isn't full yet.");
  }
  if (room.seeding_mode !== expectedSeedingMode) {
    throw new Error(`This room uses ${room.seeding_mode} seeding.`);
  }
}

async function generateAndLock(
  room: { id: string },
  orderedRoomPlayerIds: string[]
) {
  const skeleton = generateBracketSkeleton(orderedRoomPlayerIds);

  await Promise.all(
    orderedRoomPlayerIds.map((id, i) =>
      supabaseAdmin.from("room_players").update({ seed_position: i }).eq("id", id)
    )
  );

  const { error: matchesError } = await supabaseAdmin.from("matches").insert(
    skeleton.map((m) => ({
      room_id: room.id,
      round_number: m.roundNumber,
      slot_in_round: m.slotInRound,
      room_player_1_id: m.roomPlayer1Id,
      room_player_2_id: m.roomPlayer2Id,
    }))
  );
  if (matchesError) throw matchesError;

  const { error: roomError } = await supabaseAdmin
    .from("rooms")
    .update({ status: "locked", locked_at: new Date().toISOString() })
    .eq("id", room.id);
  if (roomError) throw roomError;

  await broadcastRoomChanged(room.id);
}
