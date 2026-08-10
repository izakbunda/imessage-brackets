import "server-only";
import webpush from "web-push";
import { supabaseAdmin } from "./supabase-admin";

webpush.setVapidDetails(
  "mailto:izakbunda@gmail.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function sendPushToPlayer(
  playerId: string,
  payload: { title: string; body: string; url: string }
) {
  const { data: subs } = await supabaseAdmin
    .from("push_subscriptions")
    .select("*")
    .eq("player_id", playerId);

  if (!subs || subs.length === 0) return;

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh_key, auth: sub.auth_key } },
          JSON.stringify(payload)
        );
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          // subscription expired or was revoked — clean it up
          await supabaseAdmin.from("push_subscriptions").delete().eq("id", sub.id);
        }
      }
    })
  );
}

export async function getRoomPlayerDetails(roomPlayerId: string) {
  const { data } = await supabaseAdmin
    .from("room_players")
    .select("id, player_id, player_link_token, players(name)")
    .eq("id", roomPlayerId)
    .single();

  if (!data) return null;

  return {
    playerId: data.player_id,
    token: data.player_link_token,
    name: data.players?.name ?? "Unknown",
  };
}
