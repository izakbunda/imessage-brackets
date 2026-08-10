"use client";

import { useEffect } from "react";
import { saveActiveRoom, removeStoredRoom } from "@/lib/active-rooms";

// Mounted on the player page — remembers this room on this device so the
// floating "active game" chip can get back here without needing the link
// again. No accounts, so this is deliberately device-local only.
export function SaveActiveRoom({
  code,
  token,
  game,
  status,
}: {
  code: string;
  token: string;
  game: string;
  status: string;
}) {
  useEffect(() => {
    if (status === "complete" || status === "canceled") {
      removeStoredRoom(code);
    } else {
      saveActiveRoom({ code, token, game });
    }
  }, [code, token, game, status]);

  return null;
}
