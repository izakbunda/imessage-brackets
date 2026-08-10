"use client";

const KEY = "imessage-brackets:active-rooms";

export type StoredRoom = { code: string; token: string; game: string; visitedAt: number };

export function saveActiveRoom(room: { code: string; token: string; game: string }) {
  const rooms = getStoredRooms().filter((r) => r.code !== room.code);
  rooms.push({ ...room, visitedAt: Date.now() });
  localStorage.setItem(KEY, JSON.stringify(rooms));
}

export function getStoredRooms(): StoredRoom[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function removeStoredRoom(code: string) {
  const rooms = getStoredRooms().filter((r) => r.code !== code);
  localStorage.setItem(KEY, JSON.stringify(rooms));
}
