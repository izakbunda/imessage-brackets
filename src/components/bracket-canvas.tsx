"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { supabase } from "@/lib/supabase";
import { totalRounds } from "@/lib/bracket";
import { computeBracketLayout, computeConnectors, NODE_WIDTH, NODE_HEIGHT } from "@/lib/bracket-layout";
import { reportMatchResult, confirmMatchResult } from "@/app/room/[code]/match-actions";

type MatchData = {
  id: string;
  round_number: number;
  slot_in_round: number;
  room_player_1_id: string | null;
  room_player_2_id: string | null;
  winner_room_player_id: string | null;
  reported_by_room_player_id: string | null;
  player_1_score: number | null;
  player_2_score: number | null;
  confirmed_at: string | null;
};

type RoomPlayerData = { id: string; name: string };
type RoomData = { id: string; code: string; status: string; player_count: number };

async function fetchBracketData(code: string) {
  const { data: room } = await supabase.from("rooms").select("*").eq("code", code).single();
  if (!room) return null;

  const { data: roomPlayers } = await supabase
    .from("room_players")
    .select("id, players(name)")
    .eq("room_id", room.id);

  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .eq("room_id", room.id)
    .order("round_number")
    .order("slot_in_round");

  return {
    room: room as RoomData,
    roomPlayers: (roomPlayers ?? []).map((p) => ({
      id: p.id,
      name: p.players?.name ?? "Unknown",
    })) as RoomPlayerData[],
    matches: (matches ?? []) as MatchData[],
  };
}

export function BracketCanvas({
  code,
  initialRoom,
  initialRoomPlayers,
  initialMatches,
  token,
  viewerRoomPlayerId,
}: {
  code: string;
  initialRoom: RoomData;
  initialRoomPlayers: RoomPlayerData[];
  initialMatches: MatchData[];
  token?: string;
  viewerRoomPlayerId?: string;
}) {
  const [room, setRoom] = useState(initialRoom);
  const [roomPlayers, setRoomPlayers] = useState(initialRoomPlayers);
  const [matches, setMatches] = useState(initialMatches);
  const [openMatchId, setOpenMatchId] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    const data = await fetchBracketData(code);
    if (data) {
      setRoom(data.room);
      setRoomPlayers(data.roomPlayers);
      setMatches(data.matches);
    }
  }, [code]);

  useEffect(() => {
    const channel = supabase.channel(`room:${initialRoom.id}`);
    channel.on("broadcast", { event: "room_changed" }, () => refetch());
    channel.subscribe();
    return () => {
      channel.unsubscribe();
    };
  }, [initialRoom.id, refetch]);

  const nameById = useMemo(() => new Map(roomPlayers.map((p) => [p.id, p.name])), [roomPlayers]);
  const rounds = totalRounds(room.player_count);
  const { positions, width, height } = useMemo(() => computeBracketLayout(rounds), [rounds]);
  const connectors = useMemo(() => computeConnectors(rounds, positions), [rounds, positions]);

  const openMatch = matches.find((m) => m.id === openMatchId) ?? null;

  return (
    <div className="relative border rounded-md overflow-hidden" style={{ height: "70vh" }}>
      <TransformWrapper minScale={0.4} maxScale={2} initialScale={0.8} centerOnInit>
        <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
          <div style={{ position: "relative", width, height, padding: 24 }}>
            <svg
              width={width}
              height={height}
              style={{ position: "absolute", top: 24, left: 24, pointerEvents: "none" }}
            >
              {connectors.map((c) => (
                <path key={c.key} d={c.d} stroke="#cbd5e1" strokeWidth={2} fill="none" />
              ))}
            </svg>

            {matches.map((m) => {
              const pos = positions.get(`${m.round_number}-${m.slot_in_round}`);
              if (!pos) return null;
              const isParticipant =
                !!viewerRoomPlayerId &&
                (m.room_player_1_id === viewerRoomPlayerId || m.room_player_2_id === viewerRoomPlayerId);
              const actionable =
                isParticipant && !m.confirmed_at && !!m.room_player_1_id && !!m.room_player_2_id;

              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => actionable && setOpenMatchId(m.id)}
                  disabled={!actionable}
                  style={{
                    position: "absolute",
                    left: pos.x + 24,
                    top: pos.y + 24,
                    width: NODE_WIDTH,
                    height: NODE_HEIGHT,
                  }}
                  className={`rounded-md border bg-white text-left px-2 py-1 flex flex-col justify-center gap-0.5 text-sm ${
                    actionable ? "border-blue-400 ring-1 ring-blue-200" : "border-neutral-200"
                  }`}
                >
                  <MatchSlot
                    name={m.room_player_1_id ? nameById.get(m.room_player_1_id) ?? "…" : null}
                    score={m.player_1_score}
                    isWinner={!!m.confirmed_at && m.winner_room_player_id === m.room_player_1_id}
                  />
                  <MatchSlot
                    name={m.room_player_2_id ? nameById.get(m.room_player_2_id) ?? "…" : null}
                    score={m.player_2_score}
                    isWinner={!!m.confirmed_at && m.winner_room_player_id === m.room_player_2_id}
                  />
                  {!m.confirmed_at && m.reported_by_room_player_id && (
                    <span className="text-[10px] text-amber-600">awaiting confirmation</span>
                  )}
                </button>
              );
            })}
          </div>
        </TransformComponent>
      </TransformWrapper>

      {openMatch && (
        <MatchSheet
          code={code}
          token={token!}
          match={openMatch}
          player1Name={openMatch.room_player_1_id ? nameById.get(openMatch.room_player_1_id) ?? "Unknown" : ""}
          player2Name={openMatch.room_player_2_id ? nameById.get(openMatch.room_player_2_id) ?? "Unknown" : ""}
          viewerRoomPlayerId={viewerRoomPlayerId!}
          onClose={() => setOpenMatchId(null)}
        />
      )}
    </div>
  );
}

function MatchSlot({
  name,
  score,
  isWinner,
}: {
  name: string | null;
  score: number | null;
  isWinner: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className={`truncate ${isWinner ? "font-semibold" : ""} ${!name ? "text-neutral-400" : ""}`}>
        {name ?? "TBD"}
      </span>
      {score !== null && <span className="text-neutral-500">{score}</span>}
    </div>
  );
}

function MatchSheet({
  code,
  token,
  match,
  player1Name,
  player2Name,
  viewerRoomPlayerId,
  onClose,
}: {
  code: string;
  token: string;
  match: MatchData;
  player1Name: string;
  player2Name: string;
  viewerRoomPlayerId: string;
  onClose: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedWinner, setSelectedWinner] = useState<string | null>(null);
  const [score1, setScore1] = useState("");
  const [score2, setScore2] = useState("");

  const alreadyReported = !!match.reported_by_room_player_id;
  const reportedByMe = match.reported_by_room_player_id === viewerRoomPlayerId;

  async function run(action: () => Promise<void>) {
    setError(null);
    setPending(true);
    try {
      await action();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="absolute inset-x-0 bottom-0 bg-white border-t rounded-t-xl p-4 shadow-lg flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <p className="font-medium">
          {player1Name} vs {player2Name}
        </p>
        <button type="button" onClick={onClose} className="text-neutral-400 text-sm">
          Close
        </button>
      </div>

      {alreadyReported && !reportedByMe && (
        <>
          <p className="text-sm">
            <strong>{match.winner_room_player_id === match.room_player_1_id ? player1Name : player2Name}</strong>{" "}
            reported as the winner
            {match.player_1_score !== null && match.player_2_score !== null
              ? ` (${match.player_1_score}-${match.player_2_score})`
              : ""}
            . Confirm?
          </p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => confirmMatchResult(code, token, match.id))}
            className="bg-blue-500 text-white rounded-md px-4 py-2 font-medium disabled:opacity-50"
          >
            Confirm result
          </button>
        </>
      )}

      {alreadyReported && reportedByMe && (
        <p className="text-sm text-neutral-500">Waiting for your opponent to confirm.</p>
      )}

      {!alreadyReported && (
        <>
          <fieldset className="flex flex-col gap-1">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="winner"
                onChange={() => setSelectedWinner(match.room_player_1_id)}
              />
              {player1Name} won
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="winner"
                onChange={() => setSelectedWinner(match.room_player_2_id)}
              />
              {player2Name} won
            </label>
          </fieldset>
          <div className="flex gap-2 items-center text-sm">
            <span>Score (optional):</span>
            <input
              type="number"
              value={score1}
              onChange={(e) => setScore1(e.target.value)}
              className="border rounded-md px-2 py-1 w-16"
              placeholder="0"
            />
            <span>-</span>
            <input
              type="number"
              value={score2}
              onChange={(e) => setScore2(e.target.value)}
              className="border rounded-md px-2 py-1 w-16"
              placeholder="0"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="button"
            disabled={pending || !selectedWinner}
            onClick={() =>
              run(() =>
                reportMatchResult(
                  code,
                  token,
                  match.id,
                  selectedWinner!,
                  score1 === "" ? null : Number(score1),
                  score2 === "" ? null : Number(score2)
                )
              )
            }
            className="bg-blue-500 text-white rounded-md px-4 py-2 font-medium disabled:opacity-50"
          >
            Report result
          </button>
        </>
      )}
    </div>
  );
}
