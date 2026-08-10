"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { nextSlot } from "@/lib/bracket";
import { broadcastRoomChanged } from "@/lib/realtime";
import { sendPushToPlayer, getRoomPlayerDetails } from "@/lib/push";

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

  const otherRoomPlayerId =
    match.room_player_1_id === viewerRoomPlayerId ? match.room_player_2_id! : match.room_player_1_id!;
  const [reporter, other] = await Promise.all([
    getRoomPlayerDetails(viewerRoomPlayerId),
    getRoomPlayerDetails(otherRoomPlayerId),
  ]);
  if (reporter && other) {
    const scoreText = score1 !== null && score2 !== null ? ` ${score1}-${score2}` : "";
    await sendPushToPlayer(other.playerId, {
      title: `${reporter.name} reported a result`,
      body: `They say they won${scoreText} — confirm?`,
      url: `/room/${code}/player/${other.token}`,
    });
  }
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
    .select("*")
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

  // notify both participants of this match: winner moves on, loser is out
  const [winnerDetails, loserDetails] = await Promise.all([
    getRoomPlayerDetails(match.winner_room_player_id),
    getRoomPlayerDetails(
      match.winner_room_player_id === match.room_player_1_id
        ? match.room_player_2_id!
        : match.room_player_1_id!
    ),
  ]);
  if (winnerDetails && loserDetails) {
    await Promise.all([
      sendPushToPlayer(winnerDetails.playerId, {
        title: "You're moving on!",
        body: `You beat ${loserDetails.name} — next round coming up`,
        url: `/room/${code}/player/${winnerDetails.token}`,
      }),
      sendPushToPlayer(loserDetails.playerId, {
        title: "Match over",
        body: `${winnerDetails.name} won — you're out of the bracket`,
        url: `/room/${code}/player/${loserDetails.token}`,
      }),
    ]);
  }

  if (nextMatch) {
    // if this confirmation filled the last open slot in the next match, that
    // match just went live — notify both its players
    const nextRoomPlayer1Id = isPlayer1 ? match.winner_room_player_id : nextMatch.room_player_1_id;
    const nextRoomPlayer2Id = isPlayer1 ? nextMatch.room_player_2_id : match.winner_room_player_id;

    if (nextRoomPlayer1Id && nextRoomPlayer2Id) {
      const [p1, p2] = await Promise.all([
        getRoomPlayerDetails(nextRoomPlayer1Id),
        getRoomPlayerDetails(nextRoomPlayer2Id),
      ]);
      if (p1 && p2) {
        await Promise.all([
          sendPushToPlayer(p1.playerId, {
            title: "Your match is live",
            body: `${p2.name} — ${room.game} — Round ${match.round_number + 1}`,
            url: `/room/${code}/player/${p1.token}`,
          }),
          sendPushToPlayer(p2.playerId, {
            title: "Your match is live",
            body: `${p1.name} — ${room.game} — Round ${match.round_number + 1}`,
            url: `/room/${code}/player/${p2.token}`,
          }),
        ]);
      }
    }
  } else if (winnerDetails) {
    // final match confirmed — notify everyone in the room
    const { data: allRoomPlayers } = await supabaseAdmin
      .from("room_players")
      .select("id, player_id, player_link_token, players(name)")
      .eq("room_id", room.id);

    const championName = winnerDetails.name;
    await Promise.all(
      (allRoomPlayers ?? []).map((rp) => {
        const isChampion = rp.id === match.winner_room_player_id;
        return sendPushToPlayer(rp.player_id, {
          title: isChampion ? "🏆 You won the bracket!" : "Tournament complete",
          body: isChampion
            ? `${room.game} — ${room.code}`
            : `${championName} won the ${room.game} bracket`,
          url: `/room/${code}/player/${rp.player_link_token}`,
        });
      })
    );
  }
}
