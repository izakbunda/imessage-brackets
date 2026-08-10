export type MatchRow = {
  id: string;
  round_number: number;
  room_player_1_id: string | null;
  room_player_2_id: string | null;
  winner_room_player_id: string | null;
  reported_by_room_player_id: string | null;
  player_1_score: number | null;
  player_2_score: number | null;
  confirmed_at: string | null;
};

export function getPlayerBracketStatus(
  matches: MatchRow[],
  viewerRoomPlayerId: string,
  finalRound: number
) {
  const involving = matches.filter(
    (m) => m.room_player_1_id === viewerRoomPlayerId || m.room_player_2_id === viewerRoomPlayerId
  );

  const currentMatch = involving.find((m) => !m.confirmed_at) ?? null;

  const confirmedInvolving = involving
    .filter((m) => m.confirmed_at)
    .sort((a, b) => b.round_number - a.round_number);
  const lastConfirmed = confirmedInvolving[0] ?? null;

  const eliminated = !currentMatch && !!lastConfirmed && lastConfirmed.winner_room_player_id !== viewerRoomPlayerId;
  const champion =
    !!lastConfirmed &&
    lastConfirmed.round_number === finalRound &&
    lastConfirmed.winner_room_player_id === viewerRoomPlayerId;

  return { currentMatch, eliminated, champion };
}
