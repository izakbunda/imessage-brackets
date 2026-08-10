"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { cancelRoom, lockRoomAuto, lockRoomManual } from "../../actions";

type RoomPlayerView = {
  id: string;
  player_id: string;
  seed_position: number | null;
  name: string;
  photo_url: string | null;
};

type RoomView = {
  id: string;
  code: string;
  status: string;
  seeding_mode: "auto" | "manual";
  player_count: number;
};

export function LobbyClient({
  room,
  roomPlayers,
  isCreator,
  playerToken,
}: {
  room: RoomView;
  roomPlayers: RoomPlayerView[];
  isCreator: boolean;
  playerToken: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [seedOrder, setSeedOrder] = useState<string[]>(roomPlayers.map((p) => p.id));

  useEffect(() => {
    const channel = supabase.channel(`room:${room.id}`);
    channel.on("broadcast", { event: "room_changed" }, () => router.refresh());
    channel.subscribe();
    return () => {
      channel.unsubscribe();
    };
  }, [room.id, router]);

  const full = roomPlayers.length >= room.player_count;
  const showSeedingScreen =
    room.status === "lobby" && room.seeding_mode === "manual" && isCreator && full;

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

  function movePlayer(id: string, direction: -1 | 1) {
    setSeedOrder((prev) => {
      const idx = prev.indexOf(id);
      const swapIdx = idx + direction;
      if (swapIdx < 0 || swapIdx >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[swapIdx]] = [copy[swapIdx], copy[idx]];
      return copy;
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-neutral-500">
        {roomPlayers.length}/{room.player_count} players — {room.seeding_mode} seeding
      </p>

      {showSeedingScreen ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Arrange seeding order</p>
          <ol className="flex flex-col gap-1">
            {seedOrder.map((id, i) => {
              const p = roomPlayers.find((rp) => rp.id === id)!;
              return (
                <li key={id} className="flex items-center gap-2 border rounded-md px-2 py-1">
                  <span className="w-6 text-sm text-neutral-500">{i + 1}</span>
                  <span className="flex-1">{p.name}</span>
                  <button
                    type="button"
                    onClick={() => movePlayer(id, -1)}
                    disabled={i === 0}
                    className="disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => movePlayer(id, 1)}
                    disabled={i === seedOrder.length - 1}
                    className="disabled:opacity-30"
                  >
                    ↓
                  </button>
                </li>
              );
            })}
          </ol>
          <button
            type="button"
            onClick={() => runAction(() => lockRoomManual(room.code, playerToken, seedOrder))}
            disabled={pending}
            className="bg-blue-500 text-white rounded-md px-4 py-2 font-medium disabled:opacity-50"
          >
            Generate bracket
          </button>
        </div>
      ) : (
        <ul className="flex flex-col gap-1">
          {roomPlayers.map((p) => (
            <li key={p.id} className="border rounded-md px-3 py-2">
              {p.name}
              {p.seed_position !== null ? ` (seed ${p.seed_position + 1})` : ""}
            </li>
          ))}
        </ul>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {room.status === "lobby" && isCreator && !showSeedingScreen && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => runAction(() => cancelRoom(room.code, playerToken))}
            disabled={pending}
            className="border rounded-md px-4 py-2 font-medium disabled:opacity-50"
          >
            Cancel room
          </button>
          {room.seeding_mode === "auto" && (
            <button
              type="button"
              onClick={() => runAction(() => lockRoomAuto(room.code, playerToken))}
              disabled={pending || !full}
              className="bg-blue-500 text-white rounded-md px-4 py-2 font-medium disabled:opacity-50"
            >
              Lock &amp; generate bracket
            </button>
          )}
        </div>
      )}

      {room.status === "locked" && (
        <p className="text-sm text-green-700">
          Bracket generated — full bracket view lands in the next step.
        </p>
      )}
      {room.status === "canceled" && (
        <p className="text-sm text-neutral-500">This room was canceled by the creator.</p>
      )}
    </div>
  );
}
