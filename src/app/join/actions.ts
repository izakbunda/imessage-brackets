"use server";

import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";

export type JoinLookupState = { error?: string };

export async function findRoomByCode(
  _prevState: JoinLookupState,
  formData: FormData
): Promise<JoinLookupState> {
  const code = String(formData.get("code") ?? "")
    .trim()
    .toLowerCase();

  if (!code) return { error: "Enter a room code." };

  const { data: room } = await supabaseAdmin.from("rooms").select("code").eq("code", code).maybeSingle();
  if (!room) return { error: `No room found with code "${code}".` };

  redirect(`/room/${room.code}/join`);
}
