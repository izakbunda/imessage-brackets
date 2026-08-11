"use client";

import { useState } from "react";

const PLAYER_COUNT_OPTIONS = [2, 4, 8, 16, 32];

export function RoomSizePicker() {
  const [mode, setMode] = useState<"fixed" | "open">("fixed");
  const [count, setCount] = useState(4);

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">Number of players</span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("fixed")}
          className="flex-1 px-3 py-2.5 text-sm"
          style={{
            background: mode === "fixed" ? "var(--accent-coral)" : "var(--card)",
            color: mode === "fixed" ? "#3a2f1e" : "var(--foreground)",
            border: mode === "fixed" ? "3px solid #3a2f1e" : "var(--pixel-border)",
            borderRadius: "var(--radius-button)",
            boxShadow: "var(--shadow-raised)",
            fontWeight: mode === "fixed" ? 600 : 400,
          }}
        >
          Fixed number
        </button>
        <button
          type="button"
          onClick={() => setMode("open")}
          className="flex-1 px-3 py-2.5 text-sm"
          style={{
            background: mode === "open" ? "var(--accent-coral)" : "var(--card)",
            color: mode === "open" ? "#3a2f1e" : "var(--foreground)",
            border: mode === "open" ? "3px solid #3a2f1e" : "var(--pixel-border)",
            borderRadius: "var(--radius-button)",
            boxShadow: "var(--shadow-raised)",
            fontWeight: mode === "open" ? 600 : 400,
          }}
        >
          Open
        </button>
      </div>

      {mode === "fixed" ? (
        <select
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          className="tactile-input px-3 py-2.5"
        >
          {PLAYER_COUNT_OPTIONS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      ) : (
        <p className="text-sm muted">
          Anyone with the link can join until you lock the room and start the bracket.
        </p>
      )}

      <input type="hidden" name="playerCount" value={mode === "open" ? "open" : String(count)} />
    </div>
  );
}
