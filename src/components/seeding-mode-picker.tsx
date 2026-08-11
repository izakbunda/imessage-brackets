"use client";

import { useState } from "react";

export function SeedingModePicker() {
  const [mode, setMode] = useState<"auto" | "manual">("auto");

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">Seeding</span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("auto")}
          className="flex-1 px-3 py-2.5 text-sm"
          style={{
            background: mode === "auto" ? "var(--accent-coral)" : "var(--card)",
            color: mode === "auto" ? "#3a2f1e" : "var(--foreground)",
            border: mode === "auto" ? "3px solid #3a2f1e" : "var(--pixel-border)",
            borderRadius: "var(--radius-button)",
            boxShadow: "var(--shadow-raised)",
            fontWeight: mode === "auto" ? 600 : 400,
          }}
        >
          Automatic (random)
        </button>
        <button
          type="button"
          onClick={() => setMode("manual")}
          className="flex-1 px-3 py-2.5 text-sm"
          style={{
            background: mode === "manual" ? "var(--accent-coral)" : "var(--card)",
            color: mode === "manual" ? "#3a2f1e" : "var(--foreground)",
            border: mode === "manual" ? "3px solid #3a2f1e" : "var(--pixel-border)",
            borderRadius: "var(--radius-button)",
            boxShadow: "var(--shadow-raised)",
            fontWeight: mode === "manual" ? 600 : 400,
          }}
        >
          Manual (I&apos;ll set it)
        </button>
      </div>
      <input type="hidden" name="seedingMode" value={mode} />
    </div>
  );
}
