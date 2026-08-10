"use client";

import { useState, useTransition } from "react";
import { getHeadToHead, type HeadToHeadResult } from "./head-to-head-actions";
import { TactileButton } from "@/components/tactile-button";

export function HeadToHead() {
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
      <h2 className="text-lg font-medium">Head-to-head</h2>
      <div className="flex flex-col gap-2 max-w-sm">
        <input
          value={queryA}
          onChange={(e) => setQueryA(e.target.value)}
          placeholder="Player A — name or phone"
          className="tactile-input px-3 py-2.5"
        />
        <input
          value={queryB}
          onChange={(e) => setQueryB(e.target.value)}
          placeholder="Player B — name or phone"
          className="tactile-input px-3 py-2.5"
        />
        <TactileButton onClick={submit} disabled={pending || !queryA || !queryB} className="self-start">
          Compare
        </TactileButton>
      </div>

      {result && "error" in result && <p className="text-sm text-red-600">{result.error}</p>}
      {result && !("error" in result) && (
        <div className="tactile-card p-3 text-sm">
          {result.totalMatches === 0 ? (
            <p>
              {result.playerAName} and {result.playerBName} haven&apos;t played each other yet.
            </p>
          ) : (
            <p>
              <strong>{result.playerAName}</strong> {result.aWins} — {result.bWins}{" "}
              <strong>{result.playerBName}</strong>{" "}
              <span className="text-neutral-500">({result.totalMatches} matches)</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
