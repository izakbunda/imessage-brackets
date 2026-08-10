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
