import "server-only";
import { supabaseAdmin } from "@/lib/supabase-admin";

export type LeaderboardEntry = { playerId: string; name: string; wins: number };
export type Period = "all" | "month" | "year";

function periodStart(period: Period): string | null {
  const now = new Date();
  if (period === "month") return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  if (period === "year") return new Date(now.getFullYear(), 0, 1).toISOString();
  return null;
}

export async function getLeaderboard(game: string | null, period: Period): Promise<LeaderboardEntry[]> {
  let roomIds: string[] | null = null;
  if (game) {
    const { data: rooms } = await supabaseAdmin.from("rooms").select("id").eq("game", game);
    roomIds = (rooms ?? []).map((r) => r.id);
    if (roomIds.length === 0) return [];
  }

  let query = supabaseAdmin
    .from("matches")
    .select("winner_room_player_id")
    .not("winner_room_player_id", "is", null)
    .not("confirmed_at", "is", null);

  const start = periodStart(period);
  if (start) query = query.gte("confirmed_at", start);
  if (roomIds) query = query.in("room_id", roomIds);

  const { data: matches } = await query;
  if (!matches || matches.length === 0) return [];

  const winnerRoomPlayerIds = [...new Set(matches.map((m) => m.winner_room_player_id!))];

  const { data: roomPlayers } = await supabaseAdmin
    .from("room_players")
    .select("id, player_id")
    .in("id", winnerRoomPlayerIds);

  const playerIdByRoomPlayerId = new Map((roomPlayers ?? []).map((rp) => [rp.id, rp.player_id]));

  const winsByPlayerId = new Map<string, number>();
  for (const m of matches) {
    const playerId = playerIdByRoomPlayerId.get(m.winner_room_player_id!);
    if (!playerId) continue;
    winsByPlayerId.set(playerId, (winsByPlayerId.get(playerId) ?? 0) + 1);
  }

  const playerIds = [...winsByPlayerId.keys()];
  const { data: players } = await supabaseAdmin.from("players").select("id, name").in("id", playerIds);
  const nameByPlayerId = new Map((players ?? []).map((p) => [p.id, p.name]));

  return [...winsByPlayerId.entries()]
    .map(([playerId, wins]) => ({ playerId, name: nameByPlayerId.get(playerId) ?? "Unknown", wins }))
    .sort((a, b) => b.wins - a.wins);
}
