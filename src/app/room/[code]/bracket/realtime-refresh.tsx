"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// Headless — subscribes to this room's broadcast channel and refetches the
// server component on any change. No row data crosses the wire here.
export function RealtimeRefresh({ roomId }: { roomId: string }) {
  const router = useRouter();

  useEffect(() => {
    const channel = supabase.channel(`room:${roomId}`);
    channel.on("broadcast", { event: "room_changed" }, () => router.refresh());
    channel.subscribe();
    return () => {
      channel.unsubscribe();
    };
  }, [roomId, router]);

  return null;
}
