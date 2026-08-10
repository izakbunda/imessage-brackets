import "server-only";
import { supabaseAdmin } from "./supabase-admin";

// Broadcast is a plain signal (no row data in the payload) — clients react
// by refetching through the server component, which already applies the
// column-privacy rules. Keeps realtime from ever having to reason about
// what's safe to put on the wire.
export async function broadcastRoomChanged(roomId: string) {
  const channel = supabaseAdmin.channel(`room:${roomId}`);
  await new Promise<void>((resolve) => {
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        channel.send({ type: "broadcast", event: "room_changed", payload: {} }).then(() => resolve());
      }
    });
  });
  await channel.unsubscribe();
}
