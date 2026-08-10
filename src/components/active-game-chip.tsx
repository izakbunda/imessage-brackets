"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getStoredRooms, removeStoredRoom, type StoredRoom } from "@/lib/active-rooms";

export function ActiveGameChip() {
  const pathname = usePathname();
  const [active, setActive] = useState<StoredRoom | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const stored = getStoredRooms();
      if (stored.length === 0) {
        if (!cancelled) setActive(null);
        return;
      }

      const { data: rooms } = await supabase
        .from("rooms")
        .select("code, status")
        .in(
          "code",
          stored.map((r) => r.code)
        );

      const statusByCode = new Map((rooms ?? []).map((r) => [r.code, r.status]));
      for (const room of stored) {
        const status = statusByCode.get(room.code);
        if (status === "complete" || status === "canceled" || !status) {
          removeStoredRoom(room.code);
        }
      }

      const stillActive = stored
        .filter((r) => {
          const status = statusByCode.get(r.code);
          return status === "lobby" || status === "locked";
        })
        .sort((a, b) => b.visitedAt - a.visitedAt);

      if (!cancelled) setActive(stillActive[0] ?? null);
    }

    check();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  if (!active) return null;
  if (pathname === `/room/${active.code}/player/${active.token}`) return null;

  return (
    <div
      className="fixed inset-x-4 z-40 flex justify-center pointer-events-none"
      style={{ bottom: "calc(66px + env(safe-area-inset-bottom))" }}
    >
      <Link
        href={`/room/${active.code}/player/${active.token}`}
        className="pointer-events-auto flex items-center gap-2 px-4 py-2 w-full max-w-sm"
        style={{
          background: "var(--accent-coral)",
          color: "#23222b",
          border: "3px solid #23222b",
          borderRadius: 999,
          boxShadow: "var(--shadow-raised)",
          fontFamily: "var(--font-pixel-display), monospace",
          fontSize: 10,
        }}
      >
        <span>▶</span>
        <span className="truncate">Back to your {active.game} game</span>
      </Link>
    </div>
  );
}
