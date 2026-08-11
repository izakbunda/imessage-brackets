"use client";

import { useState, useTransition } from "react";
import { getHeadToHead, type HeadToHeadResult } from "./head-to-head-actions";
import { TactileButton } from "@/components/tactile-button";
import { PlayerAutocomplete } from "./player-autocomplete";

export function HeadToHead({ hideTitle }: { hideTitle?: boolean } = {}) {
  const [queryA, setQueryA] = useState("");
  const [queryB, setQueryB] = useState("");
  const [result, setResult] = useState<HeadToHeadResult | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      setResult(await getHeadToHead(queryA, queryB));
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {!hideTitle && <h2 className="text-lg font-medium">Head-to-head</h2>}
      <div className="flex flex-col gap-2 max-w-sm">
        <PlayerAutocomplete value={queryA} onChange={setQueryA} placeholder="Player A — name or phone" />
        <PlayerAutocomplete value={queryB} onChange={setQueryB} placeholder="Player B — name or phone" />
        <TactileButton onClick={submit} disabled={pending || !queryA || !queryB} className="self-start">
          Compare
        </TactileButton>
      </div>

      {result && "error" in result && <p className="text-sm error-text">{result.error}</p>}
      {result && !("error" in result) && (
        <div
          className="p-3 text-sm"
          style={{
            borderRadius: "var(--radius-card)",
            border: "2px solid var(--border-subtle)",
            background: "var(--background)",
          }}
        >
          {result.totalMatches === 0 ? (
            <p>
              {result.playerAName} and {result.playerBName} haven&apos;t played each other yet.
            </p>
          ) : (
            <p>
              <strong>{result.playerAName}</strong> {result.aWins} — {result.bWins}{" "}
              <strong>{result.playerBName}</strong>{" "}
              <span className="muted">({result.totalMatches} matches)</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
