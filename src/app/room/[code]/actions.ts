"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { generateBracketSkeleton, nextSlot } from "@/lib/bracket";
import { broadcastRoomChanged } from "@/lib/realtime";
import { sendPushToPlayer, getRoomPlayerDetails } from "@/lib/push";

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
  room: { status: string; player_count: number | null; seeding_mode: string },
  roomPlayers: unknown[],
  expectedSeedingMode: "auto" | "manual"
) {
  if (room.status !== "lobby") {
    throw new Error("This room is already locked.");
  }
  if (room.player_count === null) {
    if (roomPlayers.length < 2) {
      throw new Error("Need at least 2 players to start.");
    }
  } else if (roomPlayers.length < room.player_count) {
    throw new Error("Room isn't full yet.");
  }
  if (room.seeding_mode !== expectedSeedingMode) {
    throw new Error(`This room uses ${room.seeding_mode} seeding.`);
  }
}

async function generateAndLock(
  room: { id: string; code: string; game: string },
  orderedRoomPlayerIds: string[]
) {
  const skeleton = generateBracketSkeleton(orderedRoomPlayerIds);

  await Promise.all(
    orderedRoomPlayerIds.map((id, i) =>
      supabaseAdmin.from("room_players").update({ seed_position: i }).eq("id", id)
    )
  );

  const { data: insertedMatches, error: matchesError } = await supabaseAdmin
    .from("matches")
    .insert(
      skeleton.map((m) => ({
        room_id: room.id,
        round_number: m.roundNumber,
        slot_in_round: m.slotInRound,
        room_player_1_id: m.roomPlayer1Id,
        room_player_2_id: m.roomPlayer2Id,
      }))
    )
    .select();
  if (matchesError) throw matchesError;

  // finalize player_count to the actual participant count — open rooms
  // carry a null (uncapped) count through the lobby, but everything past
  // this point (round math, the public bracket view) needs a real number
  const { error: roomError } = await supabaseAdmin
    .from("rooms")
    .update({
      status: "locked",
      locked_at: new Date().toISOString(),
      player_count: orderedRoomPlayerIds.length,
    })
    .eq("id", room.id);
  if (roomError) throw roomError;

  await resolveByeMatches(room, insertedMatches ?? []);

  await broadcastRoomChanged(room.id);

  // round 1 matches with both slots filled are live immediately — notify
  // those players (bye matches, with only one slot filled, need no report
  // and are handled by resolveByeMatches instead)
  const round1 = skeleton.filter((m) => m.roundNumber === 1 && m.roomPlayer1Id && m.roomPlayer2Id);
  await Promise.all(
    round1.map(async (m) => {
      const [p1, p2] = await Promise.all([
        getRoomPlayerDetails(m.roomPlayer1Id!),
        getRoomPlayerDetails(m.roomPlayer2Id!),
      ]);
      if (!p1 || !p2) return;
      await Promise.all([
        sendPushToPlayer(p1.playerId, {
          title: "Your match is live",
          body: `${p2.name} — ${room.game} — Round 1`,
          url: `/room/${room.code}/player/${p1.token}`,
        }),
        sendPushToPlayer(p2.playerId, {
          title: "Your match is live",
          body: `${p1.name} — ${room.game} — Round 1`,
          url: `/room/${room.code}/player/${p2.token}`,
        }),
      ]);
    })
  );
}

type InsertedMatch = {
  id: string;
  round_number: number;
  slot_in_round: number;
  room_player_1_id: string | null;
  room_player_2_id: string | null;
};

// A round-1 match with exactly one slot filled is a bye — the lone player
// auto-wins without reporting anything and advances straight into round 2.
async function resolveByeMatches(
  room: { id: string; code: string; game: string },
  matches: InsertedMatch[]
) {
  const byes = matches.filter(
    (m) => m.round_number === 1 && !!m.room_player_1_id !== !!m.room_player_2_id
  );

  for (const bye of byes) {
    const winnerId = (bye.room_player_1_id ?? bye.room_player_2_id)!;

    const { error } = await supabaseAdmin
      .from("matches")
      .update({ winner_room_player_id: winnerId, confirmed_at: new Date().toISOString() })
      .eq("id", bye.id);
    if (error) throw error;

    const { nextSlotInRound, isPlayer1 } = nextSlot(bye.slot_in_round);
    const nextMatch = matches.find(
      (m) => m.round_number === 2 && m.slot_in_round === nextSlotInRound
    );
    if (!nextMatch) continue;

    const { error: advanceError } = await supabaseAdmin
      .from("matches")
      .update(isPlayer1 ? { room_player_1_id: winnerId } : { room_player_2_id: winnerId })
      .eq("id", nextMatch.id);
    if (advanceError) throw advanceError;

    // keep our local copy in sync — if two byes feed the same round-2 slot
    // (e.g. 5 players → 3 byes, two of which land in the same match), the
    // second write needs to see the first one's result to detect the match
    // going live below
    if (isPlayer1) nextMatch.room_player_1_id = winnerId;
    else nextMatch.room_player_2_id = winnerId;

    const winner = await getRoomPlayerDetails(winnerId);
    if (winner) {
      await sendPushToPlayer(winner.playerId, {
        title: "You've got a bye!",
        body: `No round 1 opponent — you're through to round 2 of the ${room.game} bracket`,
        url: `/room/${room.code}/player/${winner.token}`,
      });
    }

    // two byes can land in the same round-2 match — if this advancement was
    // the second one, that match just went live with both slots real
    if (nextMatch.room_player_1_id && nextMatch.room_player_2_id) {
      const [p1, p2] = await Promise.all([
        getRoomPlayerDetails(nextMatch.room_player_1_id),
        getRoomPlayerDetails(nextMatch.room_player_2_id),
      ]);
      if (p1 && p2) {
        await Promise.all([
          sendPushToPlayer(p1.playerId, {
            title: "Your match is live",
            body: `${p2.name} — ${room.game} — Round 2`,
            url: `/room/${room.code}/player/${p1.token}`,
          }),
          sendPushToPlayer(p2.playerId, {
            title: "Your match is live",
            body: `${p1.name} — ${room.game} — Round 2`,
            url: `/room/${room.code}/player/${p2.token}`,
          }),
        ]);
      }
    }
  }
}
