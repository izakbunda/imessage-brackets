"use server";

import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { upsertPlayer } from "@/lib/players";
import { generateRoomCode } from "@/lib/room-code";
import { GAMES } from "@/lib/games";

const PLAYER_COUNT_OPTIONS = [2, 4, 8, 16, 32];

export async function createRoom(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const phoneNumber = String(formData.get("phoneNumber") ?? "").trim();
  const game = String(formData.get("game") ?? "");
  const playerCount = Number(formData.get("playerCount"));
  const seedingMode = String(formData.get("seedingMode") ?? "auto");

  if (!name || !phoneNumber) {
    throw new Error("Name and phone number are required.");
  }
  if (!(GAMES as readonly string[]).includes(game)) {
    throw new Error("Invalid game selection.");
  }
  if (!PLAYER_COUNT_OPTIONS.includes(playerCount)) {
    throw new Error("Player count must be a power of 2, up to 32.");
  }
  if (seedingMode !== "auto" && seedingMode !== "manual") {
    throw new Error("Invalid seeding mode.");
  }

  const player = await upsertPlayer(phoneNumber, name);

  // Room codes are generated client-invisible words — retry on the rare collision.
  let room = null;
  for (let attempt = 0; attempt < 5 && !room; attempt++) {
    const code = generateRoomCode();
    const { data, error } = await supabaseAdmin
      .from("rooms")
      .insert({
        code,
        creator_player_id: player.id,
        game,
        player_count: playerCount,
        seeding_mode: seedingMode as "auto" | "manual",
      })
      .select()
      .single();

    if (!error) {
      room = data;
    } else if (error.code !== "23505") {
      // not a unique-violation on `code` — real error, stop retrying
      throw error;
    }
  }
  if (!room) {
    throw new Error("Could not generate a unique room code, try again.");
  }

  const { data: roomPlayer, error: rpError } = await supabaseAdmin
    .from("room_players")
    .insert({ room_id: room.id, player_id: player.id })
    .select()
    .single();

  if (rpError) throw rpError;

  redirect(`/room/${room.code}/player/${roomPlayer.player_link_token}`);
}
