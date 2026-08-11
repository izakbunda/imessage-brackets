"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { totalRounds } from "@/lib/bracket";
import { computeBracketLayout, computeConnectors, NODE_WIDTH, NODE_HEIGHT } from "@/lib/bracket-layout";
import { reportMatchResult, confirmMatchResult, getOpponentContact } from "@/app/room/[code]/match-actions";
import { TactileButton } from "@/components/tactile-button";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";
import { hapticSuccess, hapticTap } from "@/lib/haptics";
import { MatchCelebration } from "@/components/match-celebration";
import { TournamentCelebration } from "@/components/tournament-celebration";
import { getPlayerBracketStatus } from "@/lib/player-status";

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
type RoomData = { id: string; code: string; status: string; player_count: number; game: string };

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
  const [celebration, setCelebration] = useState<"win" | "loss" | null>(null);
  const [tournamentCelebration, setTournamentCelebration] = useState<"champion" | "runnerup" | null>(
    null
  );
  const reducedMotion = usePrefersReducedMotion();

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

  useEffect(() => {
    if (!viewerRoomPlayerId || room.status !== "complete") return;
    const key = `celebrated:${room.id}:${viewerRoomPlayerId}`;
    if (sessionStorage.getItem(key)) return;

    const { champion, runnerUp } = getPlayerBracketStatus(matches, viewerRoomPlayerId, rounds);
    if (champion || runnerUp) {
      sessionStorage.setItem(key, "1");
      setTournamentCelebration(champion ? "champion" : "runnerup");
    }
  }, [room.status, room.id, matches, viewerRoomPlayerId, rounds]);

  return (
    <div
      className="relative overflow-hidden"
      style={{
        height: "70vh",
        background: "var(--card)",
        border: "3px solid var(--accent-teal)",
        borderRadius: "var(--radius-card)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
      }}
    >
      <TransformWrapper minScale={0.4} maxScale={2} initialScale={0.8} centerOnInit>
        <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
          <div style={{ position: "relative", width, height, padding: 24 }}>
            <svg
              width={width}
              height={height}
              style={{ position: "absolute", top: 24, left: 24, pointerEvents: "none" }}
            >
              {connectors.map((c) => (
                <path
                  key={c.key}
                  d={c.d}
                  stroke="var(--border-subtle)"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  fill="none"
                />
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
                <motion.button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    if (actionable) {
                      hapticTap();
                      setOpenMatchId(m.id);
                    }
                  }}
                  disabled={!actionable}
                  whileTap={
                    actionable && !reducedMotion
                      ? { scale: 0.95, rotateX: 4, rotateY: -4 }
                      : undefined
                  }
                  style={{
                    position: "absolute",
                    left: pos.x + 24,
                    top: pos.y + 24,
                    width: NODE_WIDTH,
                    height: NODE_HEIGHT,
                    background: "var(--background)",
                    borderRadius: "var(--radius-card)",
                    boxShadow: actionable ? "var(--shadow-raised-lg)" : "var(--shadow-raised)",
                    border: actionable
                      ? "3px solid var(--accent-coral)"
                      : "2px solid var(--border-subtle)",
                    perspective: 400,
                    overflow: "hidden",
                  }}
                  className="text-left flex flex-col text-sm"
                >
                  <MatchSlot
                    name={m.room_player_1_id ? nameById.get(m.room_player_1_id) ?? "…" : null}
                    score={m.player_1_score}
                    isWinner={!!m.confirmed_at && m.winner_room_player_id === m.room_player_1_id}
                    isLoser={!!m.confirmed_at && m.winner_room_player_id === m.room_player_2_id}
                    isViewer={m.room_player_1_id === viewerRoomPlayerId}
                    isBye={!m.room_player_1_id && !!m.confirmed_at}
                  />
                  <div style={{ height: 1, background: "var(--border-subtle)" }} />
                  <MatchSlot
                    name={m.room_player_2_id ? nameById.get(m.room_player_2_id) ?? "…" : null}
                    score={m.player_2_score}
                    isWinner={!!m.confirmed_at && m.winner_room_player_id === m.room_player_2_id}
                    isLoser={!!m.confirmed_at && m.winner_room_player_id === m.room_player_1_id}
                    isViewer={m.room_player_2_id === viewerRoomPlayerId}
                    isBye={!m.room_player_2_id && !!m.confirmed_at}
                  />
                  {!m.confirmed_at && m.reported_by_room_player_id && (
                    <span
                      className="text-[10px] px-3 py-1 truncate"
                      style={{ color: "#3a2f1e", background: "var(--accent-mustard)" }}
                    >
                      awaiting confirmation
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </TransformComponent>
      </TransformWrapper>

      <AnimatePresence>
        {openMatch && (
          <MatchSheet
            code={code}
            token={token!}
            match={openMatch}
            player1Name={openMatch.room_player_1_id ? nameById.get(openMatch.room_player_1_id) ?? "Unknown" : ""}
            player2Name={openMatch.room_player_2_id ? nameById.get(openMatch.room_player_2_id) ?? "Unknown" : ""}
            viewerRoomPlayerId={viewerRoomPlayerId!}
            onClose={() => setOpenMatchId(null)}
            onResolved={(won) => setCelebration(won ? "win" : "loss")}
          />
        )}
      </AnimatePresence>

      {celebration && (
        <MatchCelebration variant={celebration} onDone={() => setCelebration(null)} />
      )}

      {tournamentCelebration &&
        (() => {
          const finalMatch = matches.find((m) => m.round_number === rounds);
          const championName = finalMatch?.winner_room_player_id
            ? nameById.get(finalMatch.winner_room_player_id) ?? "They"
            : "They";
          return (
            <TournamentCelebration
              variant={tournamentCelebration}
              title={tournamentCelebration === "champion" ? "🏆 You won the bracket!" : "So close!"}
              subtitle={
                tournamentCelebration === "champion"
                  ? `${room.game} — ${room.code}`
                  : `${championName} won the ${room.game} bracket`
              }
              onDone={() => setTournamentCelebration(null)}
            />
          );
        })()}
    </div>
  );
}

const AVATAR_COLORS = ["var(--accent-coral)", "var(--accent-teal)", "var(--accent-mustard)", "var(--accent-sage)"];

function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function MatchSlot({
  name,
  score,
  isWinner,
  isLoser,
  isViewer,
  isBye,
}: {
  name: string | null;
  score: number | null;
  isWinner: boolean;
  isLoser: boolean;
  isViewer: boolean;
  isBye?: boolean;
}) {
  return (
    <div
      className="flex-1 flex items-center gap-2.5 px-3"
      style={{
        background: isWinner ? "rgba(111, 174, 99, 0.22)" : "transparent",
        opacity: isLoser ? 0.5 : 1,
      }}
    >
      <span
        className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
        style={{
          background: name ? avatarColor(name) : "var(--border-subtle)",
          color: "#3a2f1e",
        }}
      >
        {name ? name.slice(0, 1).toUpperCase() : "?"}
      </span>
      <span
        className={`flex-1 truncate text-base ${isWinner ? "font-semibold" : ""}`}
        style={{ color: !name ? "var(--border-subtle)" : isViewer ? "var(--accent-blue)" : "inherit" }}
      >
        {name ?? (isBye ? "— bye —" : "TBD")}
      </span>
      {isWinner && <span style={{ color: "var(--accent-sage)" }}>▲</span>}
      {score !== null && <span className="muted text-sm">{score}</span>}
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
  onResolved,
}: {
  code: string;
  token: string;
  match: MatchData;
  player1Name: string;
  player2Name: string;
  viewerRoomPlayerId: string;
  onClose: () => void;
  onResolved: (won: boolean) => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedWinner, setSelectedWinner] = useState<string | null>(null);
  const [score1, setScore1] = useState("");
  const [score2, setScore2] = useState("");
  const [opponent, setOpponent] = useState<{ name: string; phone: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  const alreadyReported = !!match.reported_by_room_player_id;
  const reportedByMe = match.reported_by_room_player_id === viewerRoomPlayerId;

  function openForm(prefillWinner?: string | null) {
    setSelectedWinner(prefillWinner ?? null);
    setScore1(match.player_1_score !== null ? String(match.player_1_score) : "");
    setScore2(match.player_2_score !== null ? String(match.player_2_score) : "");
    setError(null);
    setShowForm(true);
  }

  useEffect(() => {
    let cancelled = false;
    getOpponentContact(code, token, match.id).then((contact) => {
      if (!cancelled) setOpponent(contact);
    });
    return () => {
      cancelled = true;
    };
  }, [code, token, match.id]);

  async function run(action: () => Promise<void>, wonIfConfirming?: boolean) {
    setError(null);
    setPending(true);
    try {
      await action();
      if (wonIfConfirming !== undefined) {
        hapticSuccess();
        onResolved(wonIfConfirming);
      }
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  return (
    <motion.div
      initial={reducedMotion ? { opacity: 0 } : { y: "100%" }}
      animate={reducedMotion ? { opacity: 1 } : { y: 0 }}
      exit={reducedMotion ? { opacity: 0 } : { y: "100%" }}
      transition={{ type: "spring", stiffness: 380, damping: 34 }}
      className="absolute inset-x-0 bottom-0 p-4 flex flex-col gap-3"
      style={{
        background: "var(--card)",
        borderTopLeftRadius: "var(--radius-card)",
        borderTopRightRadius: "var(--radius-card)",
        boxShadow: "var(--shadow-raised-lg)",
      }}
    >
      <div className="flex justify-between items-center">
        <p className="font-medium">
          {player1Name} vs {player2Name}
        </p>
        <button type="button" onClick={onClose} className="muted text-sm">
          Close
        </button>
      </div>

      {opponent && (
        <a
          href={`sms:${opponent.phone.replace(/[^\d+]/g, "")}`}
          className="flex items-center gap-1.5 text-sm w-fit"
          style={{ color: "var(--accent-teal)" }}
        >
          <span>💬</span>
          <span>
            iMessage {opponent.name} — {opponent.phone}
          </span>
        </a>
      )}

      {alreadyReported && !reportedByMe && !showForm && (
        <>
          <p className="text-sm">
            <strong>{match.winner_room_player_id === match.room_player_1_id ? player1Name : player2Name}</strong>{" "}
            reported as the winner
            {match.player_1_score !== null && match.player_2_score !== null
              ? ` (${match.player_1_score}-${match.player_2_score})`
              : ""}
            . Confirm?
          </p>
          {error && <p className="text-sm error-text">{error}</p>}
          <div className="flex gap-2">
            <TactileButton
              variant="secondary"
              disabled={pending}
              onClick={() => openForm(null)}
            >
              That&apos;s not right
            </TactileButton>
            <TactileButton
              disabled={pending}
              onClick={() =>
                run(
                  () => confirmMatchResult(code, token, match.id),
                  match.winner_room_player_id === viewerRoomPlayerId
                )
              }
            >
              Confirm result
            </TactileButton>
          </div>
        </>
      )}

      {alreadyReported && reportedByMe && !showForm && (
        <>
          <p className="text-sm muted">Waiting for your opponent to confirm.</p>
          {error && <p className="text-sm error-text">{error}</p>}
          <TactileButton
            variant="secondary"
            disabled={pending}
            onClick={() => openForm(match.winner_room_player_id)}
            className="self-start"
          >
            Edit report
          </TactileButton>
        </>
      )}

      {(!alreadyReported || showForm) && (
        <>
          <fieldset className="flex flex-col gap-1">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="winner"
                checked={selectedWinner === match.room_player_1_id}
                onChange={() => setSelectedWinner(match.room_player_1_id)}
              />
              {player1Name} won
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="winner"
                checked={selectedWinner === match.room_player_2_id}
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
              className="tactile-input px-2 py-1 w-16"
              placeholder="0"
            />
            <span>-</span>
            <input
              type="number"
              value={score2}
              onChange={(e) => setScore2(e.target.value)}
              className="tactile-input px-2 py-1 w-16"
              placeholder="0"
            />
          </div>
          {error && <p className="text-sm error-text">{error}</p>}
          <div className="flex gap-2">
            {showForm && (
              <TactileButton
                variant="secondary"
                disabled={pending}
                onClick={() => {
                  setShowForm(false);
                  setError(null);
                }}
              >
                Cancel
              </TactileButton>
            )}
            <TactileButton
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
            >
              {showForm ? "Save result" : "Report result"}
            </TactileButton>
          </div>
        </>
      )}
    </motion.div>
  );
}
