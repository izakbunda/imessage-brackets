"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { cancelRoom, lockRoomAuto, lockRoomManual } from "../../actions";
import { TactileButton } from "@/components/tactile-button";

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
  game: string;
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

  function invitePlayers() {
    const url = `${window.location.origin}/room/${room.code}/join`;
    window.location.href = `sms:&body=${encodeURIComponent(`Join my ${room.game} bracket! ${url}`)}`;
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm muted">
        {roomPlayers.length}/{room.player_count} players — {room.seeding_mode} seeding
      </p>

      {isCreator && room.status === "lobby" && !full && (
        <TactileButton variant="secondary" onClick={invitePlayers}>
          💬 Invite players
        </TactileButton>
      )}

      {showSeedingScreen ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Arrange seeding order</p>
          <ol className="flex flex-col gap-1">
            {seedOrder.map((id, i) => {
              const p = roomPlayers.find((rp) => rp.id === id)!;
              return (
                <li key={id} className="tactile-card flex items-center gap-2 px-3 py-2">
                  <span className="w-6 text-sm muted">{i + 1}</span>
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
          <TactileButton
            onClick={() => runAction(() => lockRoomManual(room.code, playerToken, seedOrder))}
            disabled={pending}
          >
            Generate bracket
          </TactileButton>
        </div>
      ) : (
        <ul className="flex flex-col gap-1">
          {roomPlayers.map((p, i) => (
            <motion.li
              key={p.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="tactile-card px-3 py-2.5"
            >
              {p.name}
              {p.seed_position !== null ? ` (seed ${p.seed_position + 1})` : ""}
            </motion.li>
          ))}
        </ul>
      )}

      {error && <p className="text-sm error-text">{error}</p>}

      {room.status === "lobby" && isCreator && !showSeedingScreen && (
        <div className="flex gap-2">
          <TactileButton
            variant="secondary"
            onClick={() => runAction(() => cancelRoom(room.code, playerToken))}
            disabled={pending}
          >
            Cancel room
          </TactileButton>
          {room.seeding_mode === "auto" && (
            <TactileButton
              onClick={() => runAction(() => lockRoomAuto(room.code, playerToken))}
              disabled={pending || !full}
            >
              Lock &amp; generate bracket
            </TactileButton>
          )}
        </div>
      )}
    </div>
  );
}
