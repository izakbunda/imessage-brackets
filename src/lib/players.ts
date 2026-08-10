import "server-only";
import { supabaseAdmin } from "./supabase-admin";

// Normalize to digits-only so "(555) 123-4567" and "5551234567" are the same identity.
export function normalizePhoneNumber(raw: string): string {
  return raw.replace(/\D/g, "");
}

// Phone number is the global player identity (see schema.md) — same number
// across different rooms resolves to the same players row.
export async function upsertPlayer(rawPhoneNumber: string, name: string, photoUrl?: string) {
  const phoneNumber = normalizePhoneNumber(rawPhoneNumber);

  const { data: existing } = await supabaseAdmin
    .from("players")
    .select("*")
    .eq("phone_number", phoneNumber)
    .maybeSingle();

  if (existing) {
    return existing;
  }

  const { data, error } = await supabaseAdmin
    .from("players")
    .insert({ phone_number: phoneNumber, name, photo_url: photoUrl ?? null })
    .select()
    .single();

  if (error) throw error;
  return data;
}
