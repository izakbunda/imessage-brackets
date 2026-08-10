"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { reportMatchResult, confirmMatchResult } from "../../match-actions";

type MatchView = {
  id: string;
  room_player_1_id: string | null;
  room_player_2_id: string | null;
  winner_room_player_id: string | null;
  reported_by_room_player_id: string | null;
  player_1_score: number | null;
  player_2_score: number | null;
  player1Name: string;
  player2Name: string | null;
};

export function MatchPanel({
  code,
  token,
  roomId,
  match,
  viewerRoomPlayerId,
}: {
  code: string;
  token: string;
  roomId: string;
  match: MatchView;
  viewerRoomPlayerId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedWinner, setSelectedWinner] = useState<string | null>(null);
  const [score1, setScore1] = useState("");
  const [score2, setScore2] = useState("");

  useEffect(() => {
    const channel = supabase.channel(`room:${roomId}`);
    channel.on("broadcast", { event: "room_changed" }, () => router.refresh());
    channel.subscribe();
    return () => {
      channel.unsubscribe();
    };
  }, [roomId, router]);

  if (!match.player2Name) {
    return (
      <div className="border rounded-md p-4">
        <p className="text-sm text-neutral-500">Waiting for your opponent to be decided…</p>
      </div>
    );
  }

  function runAction(action: () => Promise<void>) {
    setError(null);
    startTransition(async () => {
      try {
        await action();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      }
    });
  }

  const alreadyReported = !!match.reported_by_room_player_id;
  const reportedByMe = match.reported_by_room_player_id === viewerRoomPlayerId;

  if (alreadyReported && !reportedByMe) {
    const claimedWinnerName =
      match.winner_room_player_id === match.room_player_1_id ? match.player1Name : match.player2Name;
    return (
      <div className="border rounded-md p-4 flex flex-col gap-3">
        <p className="text-sm">
          <strong>{claimedWinnerName}</strong> reported as the winner
          {match.player_1_score !== null && match.player_2_score !== null
            ? ` (${match.player_1_score}-${match.player_2_score})`
            : ""}
          . Confirm?
        </p>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="button"
          disabled={pending}
          onClick={() => runAction(() => confirmMatchResult(code, token, match.id))}
          className="bg-blue-500 text-white rounded-md px-4 py-2 font-medium disabled:opacity-50"
        >
          Confirm result
        </button>
      </div>
    );
  }

  if (alreadyReported && reportedByMe) {
    return (
      <div className="border rounded-md p-4">
        <p className="text-sm text-neutral-500">
          Waiting for your opponent to confirm the result you reported.
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-md p-4 flex flex-col gap-3">
      <p className="text-sm font-medium">Report the result</p>
      <fieldset className="flex flex-col gap-1">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="winner"
            value={match.room_player_1_id!}
            onChange={() => setSelectedWinner(match.room_player_1_id)}
          />
          {match.player1Name} won
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="winner"
            value={match.room_player_2_id!}
            onChange={() => setSelectedWinner(match.room_player_2_id)}
          />
          {match.player2Name} won
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
          runAction(() =>
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
    </div>
  );
}
