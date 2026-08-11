"use client";

import { useState, useTransition } from "react";
import { getCustomComparison, type CustomComparisonResult } from "./head-to-head-actions";
import { TactileButton } from "@/components/tactile-button";
import { PlayerAutocomplete } from "./player-autocomplete";

export function CustomComparison() {
  const [queries, setQueries] = useState(["", ""]);
  const [result, setResult] = useState<CustomComparisonResult | null>(null);
  const [pending, startTransition] = useTransition();

  function setQuery(i: number, value: string) {
    setQueries((prev) => prev.map((q, idx) => (idx === i ? value : q)));
  }

  function addPlayer() {
    setQueries((prev) => [...prev, ""]);
  }

  function removePlayer(i: number) {
    setQueries((prev) => prev.filter((_, idx) => idx !== i));
  }

  function submit() {
    startTransition(async () => {
      setResult(await getCustomComparison(queries));
    });
  }

  const canSubmit = queries.filter((q) => q.trim()).length >= 2;

  return (
    <div className="flex flex-col gap-2 max-w-sm">
      {queries.map((q, i) => (
        <div key={i} className="flex gap-2 items-start">
          <div className="flex-1">
            <PlayerAutocomplete
              value={q}
              onChange={(v) => setQuery(i, v)}
              placeholder={`Player ${i + 1} — name or phone`}
            />
          </div>
          {queries.length > 2 && (
            <button
              type="button"
              onClick={() => removePlayer(i)}
              className="muted text-sm px-1"
              style={{ marginTop: 10 }}
            >
              ✕
            </button>
          )}
        </div>
      ))}

      <button type="button" onClick={addPlayer} className="text-sm self-start underline" style={{ color: "var(--accent-teal)" }}>
        + Add player
      </button>

      <TactileButton onClick={submit} disabled={pending || !canSubmit} className="self-start mt-1">
        Compare
      </TactileButton>

      {result && "error" in result && <p className="text-sm error-text">{result.error}</p>}
      {result && "entries" in result && (
        <ol className="flex flex-col gap-1.5 mt-1">
          {result.entries.map((e, i) => (
            <li
              key={e.name + i}
              className="flex items-center gap-3 px-2.5 py-1.5 text-sm"
              style={{
                background: "var(--background)",
                borderRadius: "var(--radius-card)",
                border: "2px solid var(--border-subtle)",
              }}
            >
              <span className="w-5 text-center font-bold" style={{ color: "var(--muted)" }}>
                {i + 1}
              </span>
              <span className="flex-1 truncate">{e.name}</span>
              <span className="font-semibold">{e.wins}</span>
              <span className="muted text-xs">wins</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
