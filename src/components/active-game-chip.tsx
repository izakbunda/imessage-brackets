"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { getStoredRooms, removeStoredRoom, type StoredRoom } from "@/lib/active-rooms";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";

export function ActiveGameChip() {
  const pathname = usePathname();
  const [active, setActive] = useState<StoredRoom | null>(null);
  const reducedMotion = usePrefersReducedMotion();

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
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed inset-x-8 z-40 flex justify-center pointer-events-none"
      style={{ bottom: "calc(92px + env(safe-area-inset-bottom))" }}
    >
      <motion.div
        animate={
          reducedMotion
            ? undefined
            : {
                scale: [1, 1.03, 1],
                boxShadow: [
                  "var(--shadow-raised-lg)",
                  "0 0 0 8px rgba(242,121,92,0.3)",
                  "var(--shadow-raised-lg)",
                ],
              }
        }
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-auto w-full max-w-xs"
        style={{ borderRadius: 999 }}
      >
        <Link
          href={`/room/${active.code}/player/${active.token}`}
          className="flex items-center justify-center gap-2 px-4 py-3"
          style={{
            background: "var(--accent-coral)",
            color: "#3a2f1e",
            border: "3px solid #3a2f1e",
            borderRadius: 999,
            fontFamily: "var(--font-pixel-display), monospace",
            fontSize: 10,
          }}
        >
          <motion.span
            animate={reducedMotion ? undefined : { x: [0, 3, 0] }}
            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
          >
            ▶
          </motion.span>
          <span className="truncate">Back to your {active.game} game</span>
        </Link>
      </motion.div>
    </motion.div>
  );
}
