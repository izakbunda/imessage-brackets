"use server";

import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { upsertPlayer, normalizePhoneNumber } from "@/lib/players";

export type JoinState = { error?: string };

export async function joinRoom(
  code: string,
  _prevState: JoinState,
  formData: FormData
): Promise<JoinState> {
  const name = String(formData.get("name") ?? "").trim();
  const phoneNumber = String(formData.get("phoneNumber") ?? "").trim();
  const photo = formData.get("photo");

  if (!name || !phoneNumber) {
    return { error: "Name and phone number are required." };
  }

  const { data: room } = await supabaseAdmin
    .from("rooms")
    .select("*, room_players(id)")
    .eq("code", code)
    .maybeSingle();

  if (!room) {
    return { error: "Room not found." };
  }
  if (room.status !== "lobby") {
    return { error: "This room is no longer accepting new players." };
  }
  if (room.room_players.length >= room.player_count) {
    return { error: "This room is full." };
  }

  const player = await upsertPlayer(phoneNumber, name);

  const { data: alreadyIn } = await supabaseAdmin
    .from("room_players")
    .select("id")
    .eq("room_id", room.id)
    .eq("player_id", player.id)
    .maybeSingle();

  if (alreadyIn) {
    return { error: "You've already joined this room." };
  }

  let photoUrl: string | null = null;
  if (photo instanceof File && photo.size > 0) {
    const ext = photo.name.split(".").pop() || "jpg";
    const path = `${player.id}-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from("player-photos")
      .upload(path, photo, { contentType: photo.type });

    if (!uploadError) {
      const {
        data: { publicUrl },
      } = supabaseAdmin.storage.from("player-photos").getPublicUrl(path);
      photoUrl = publicUrl;

      await supabaseAdmin.from("players").update({ photo_url: photoUrl }).eq("id", player.id);
    }
  }

  const { data: roomPlayer, error: rpError } = await supabaseAdmin
    .from("room_players")
    .insert({ room_id: room.id, player_id: player.id })
    .select()
    .single();

  if (rpError) {
    // race with another joiner filling the last slot / duplicate phone raced in
    if (rpError.code === "23505") {
      return { error: "You've already joined this room." };
    }
    return { error: "Could not join this room, please try again." };
  }

  redirect(`/room/${code}/player/${roomPlayer.player_link_token}`);
}
