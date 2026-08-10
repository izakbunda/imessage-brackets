// Fixed list for v1 (per ideas.md — no admin/DB-editable list yet).
export const GAMES = [
  "8-Ball",
  "Anagrams",
  "Sea Battle",
  "Mancala",
  "Checkers",
  "Chess",
  "Word Bites",
  "Word Hunt",
  "Cup Pong",
  "Basketball",
  "Gomoku",
] as const;

export type Game = (typeof GAMES)[number];
