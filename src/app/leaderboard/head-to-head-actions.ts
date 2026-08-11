"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { normalizePhoneNumber } from "@/lib/players";

export type HeadToHeadResult =
  | { error: string }
  | { playerAName: string; playerBName: string; aWins: number; bWins: number; totalMatches: number };

async function findPlayer(query: string): Promise<{ id: string; name: string } | { error: string }> {
  const trimmed = query.trim();
  if (!trimmed) return { error: "Enter a name or phone number." };

  const normalizedPhone = normalizePhoneNumber(trimmed);
  if (normalizedPhone.length >= 7) {
    const { data } = await supabaseAdmin
      .from("players")
      .select("id, name")
      .eq("phone_number", normalizedPhone)
      .maybeSingle();
    if (data) return data;
  }

  const { data: byName } = await supabaseAdmin
    .from("players")
    .select("id, name")
    .ilike("name", trimmed);

  if (!byName || byName.length === 0) return { error: `No player found matching "${trimmed}".` };
  if (byName.length > 1) {
    return { error: `Multiple players named "${trimmed}" — try their phone number instead.` };
  }
  return byName[0];
}

export async function searchPlayers(
  query: string
): Promise<{ name: string; phone: string }[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const { data } = await supabaseAdmin
    .from("players")
    .select("name, phone_number")
    .or(`name.ilike.%${trimmed}%,phone_number.ilike.%${trimmed}%`)
    .limit(6);

  return (data ?? []).map((p) => ({ name: p.name, phone: p.phone_number }));
}

export async function getHeadToHead(queryA: string, queryB: string): Promise<HeadToHeadResult> {
  const [playerA, playerB] = await Promise.all([findPlayer(queryA), findPlayer(queryB)]);

  if ("error" in playerA) return { error: playerA.error };
  if ("error" in playerB) return { error: playerB.error };
  if (playerA.id === playerB.id) return { error: "Enter two different players." };

  const [{ data: aRoomPlayers }, { data: bRoomPlayers }] = await Promise.all([
    supabaseAdmin.from("room_players").select("id").eq("player_id", playerA.id),
    supabaseAdmin.from("room_players").select("id").eq("player_id", playerB.id),
  ]);

  const aIds = new Set((aRoomPlayers ?? []).map((rp) => rp.id));
  const bIds = new Set((bRoomPlayers ?? []).map((rp) => rp.id));
  const allIds = [...aIds, ...bIds];

  if (allIds.length === 0) {
    return { playerAName: playerA.name, playerBName: playerB.name, aWins: 0, bWins: 0, totalMatches: 0 };
  }

  const { data: candidateMatches } = await supabaseAdmin
    .from("matches")
    .select("room_player_1_id, room_player_2_id, winner_room_player_id, confirmed_at")
    .not("confirmed_at", "is", null)
    .or(`room_player_1_id.in.(${allIds.join(",")}),room_player_2_id.in.(${allIds.join(",")})`);

  let aWins = 0;
  let bWins = 0;
  let totalMatches = 0;

  for (const m of candidateMatches ?? []) {
    const p1 = m.room_player_1_id;
    const p2 = m.room_player_2_id;
    if (!p1 || !p2) continue;

    const isAvsB = (aIds.has(p1) && bIds.has(p2)) || (aIds.has(p2) && bIds.has(p1));
    if (!isAvsB) continue;

    totalMatches++;
    if (aIds.has(m.winner_room_player_id ?? "")) aWins++;
    else if (bIds.has(m.winner_room_player_id ?? "")) bWins++;
  }

  return { playerAName: playerA.name, playerBName: playerB.name, aWins, bWins, totalMatches };
}

export type CustomComparisonResult =
  | { error: string }
  | { entries: { name: string; wins: number }[] };

// All-time, all-games win counts for an arbitrary set of players — a
// custom-list variant of the leaderboard rather than a strict 1v1 record.
export async function getCustomComparison(queries: string[]): Promise<CustomComparisonResult> {
  const trimmed = queries.map((q) => q.trim()).filter(Boolean);
  if (trimmed.length < 2) return { error: "Enter at least 2 players." };

  const resolved = await Promise.all(trimmed.map(findPlayer));
  const firstError = resolved.find((r): r is { error: string } => "error" in r);
  if (firstError) return { error: firstError.error };

  const players = resolved as { id: string; name: string }[];
  const uniqueIds = new Set(players.map((p) => p.id));
  if (uniqueIds.size !== players.length) return { error: "Enter each player only once." };

  const { data: roomPlayers } = await supabaseAdmin
    .from("room_players")
    .select("id, player_id")
    .in("player_id", [...uniqueIds]);

  const playerIdByRoomPlayerId = new Map((roomPlayers ?? []).map((rp) => [rp.id, rp.player_id]));
  const roomPlayerIds = [...playerIdByRoomPlayerId.keys()];

  const winsByPlayerId = new Map(players.map((p) => [p.id, 0]));

  if (roomPlayerIds.length > 0) {
    const { data: matches } = await supabaseAdmin
      .from("matches")
      .select("winner_room_player_id")
      .not("confirmed_at", "is", null)
      .in("winner_room_player_id", roomPlayerIds);

    for (const m of matches ?? []) {
      const playerId = playerIdByRoomPlayerId.get(m.winner_room_player_id!);
      if (playerId) winsByPlayerId.set(playerId, (winsByPlayerId.get(playerId) ?? 0) + 1);
    }
  }

  const entries = players
    .map((p) => ({ name: p.name, wins: winsByPlayerId.get(p.id) ?? 0 }))
    .sort((a, b) => b.wins - a.wins);

  return { entries };
}
