"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";

export async function savePushSubscription(
  token: string,
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } }
) {
  const { data: roomPlayer } = await supabaseAdmin
    .from("room_players")
    .select("player_id")
    .eq("player_link_token", token)
    .maybeSingle();

  if (!roomPlayer) throw new Error("Not found.");

  const { error } = await supabaseAdmin.from("push_subscriptions").upsert(
    {
      player_id: roomPlayer.player_id,
      endpoint: subscription.endpoint,
      p256dh_key: subscription.keys.p256dh,
      auth_key: subscription.keys.auth,
    },
    { onConflict: "player_id,endpoint" }
  );
  if (error) throw error;
}
