"use client";

const KEY = "imessage-brackets:site-unlocked";
export const SITE_PASSWORD = "izakrocks";

export function isSiteUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(KEY) === "1";
}

export function unlockSite() {
  localStorage.setItem(KEY, "1");
}
