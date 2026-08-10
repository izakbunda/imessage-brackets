"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { nextSlot } from "@/lib/bracket";
import { broadcastRoomChanged } from "@/lib/realtime";

async function requireParticipant(code: string, token: string, matchId: string) {
  const { data: room } = await supabaseAdmin.from("rooms").select("*").eq("code", code).single();
  if (!room) throw new Error("Room not found.");
  if (room.status !== "locked") throw new Error("This room's bracket isn't active.");

  const { data: roomPlayer } = await supabaseAdmin
    .from("room_players")
    .select("id")
    .eq("room_id", room.id)
    .eq("player_link_token", token)
    .single();
  if (!roomPlayer) throw new Error("Not found.");

  const { data: match } = await supabaseAdmin
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .eq("room_id", room.id)
    .single();
  if (!match) throw new Error("Match not found.");

  if (match.room_player_1_id !== roomPlayer.id && match.room_player_2_id !== roomPlayer.id) {
    throw new Error("You're not a player in this match.");
  }
  if (!match.room_player_1_id || !match.room_player_2_id) {
    throw new Error("Waiting for both players to be set.");
  }

  return { room, match, viewerRoomPlayerId: roomPlayer.id };
}

export async function reportMatchResult(
  code: string,
  token: string,
  matchId: string,
  winnerRoomPlayerId: string,
  score1: number | null,
  score2: number | null
) {
  const { room, match, viewerRoomPlayerId } = await requireParticipant(code, token, matchId);
  if (match.confirmed_at) throw new Error("This match is already confirmed.");
  if (winnerRoomPlayerId !== match.room_player_1_id && winnerRoomPlayerId !== match.room_player_2_id) {
    throw new Error("Invalid winner.");
  }

  const { error } = await supabaseAdmin
    .from("matches")
    .update({
      winner_room_player_id: winnerRoomPlayerId,
      reported_by_room_player_id: viewerRoomPlayerId,
      reported_at: new Date().toISOString(),
      player_1_score: score1,
      player_2_score: score2,
    })
    .eq("id", matchId);
  if (error) throw error;

  await broadcastRoomChanged(room.id);
}

export async function confirmMatchResult(code: string, token: string, matchId: string) {
  const { room, match, viewerRoomPlayerId } = await requireParticipant(code, token, matchId);
  if (match.confirmed_at) throw new Error("This match is already confirmed.");
  if (!match.reported_by_room_player_id || !match.winner_room_player_id) {
    throw new Error("No result has been reported yet.");
  }
  if (match.reported_by_room_player_id === viewerRoomPlayerId) {
    throw new Error("The other player needs to confirm this result.");
  }

  const { error: confirmError } = await supabaseAdmin
    .from("matches")
    .update({ confirmed_at: new Date().toISOString() })
    .eq("id", matchId);
  if (confirmError) throw confirmError;

  const { nextSlotInRound, isPlayer1 } = nextSlot(match.slot_in_round);
  const { data: nextMatch } = await supabaseAdmin
    .from("matches")
    .select("id")
    .eq("room_id", room.id)
    .eq("round_number", match.round_number + 1)
    .eq("slot_in_round", nextSlotInRound)
    .maybeSingle();

  if (nextMatch) {
    const { error } = await supabaseAdmin
      .from("matches")
      .update(
        isPlayer1
          ? { room_player_1_id: match.winner_room_player_id }
          : { room_player_2_id: match.winner_room_player_id }
      )
      .eq("id", nextMatch.id);
    if (error) throw error;
  } else {
    const { error } = await supabaseAdmin
      .from("rooms")
      .update({ status: "complete", completed_at: new Date().toISOString() })
      .eq("id", room.id);
    if (error) throw error;
  }

  await broadcastRoomChanged(room.id);
}
