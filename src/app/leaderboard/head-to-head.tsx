"use client";

import { useState, useTransition } from "react";
import { getHeadToHead, type HeadToHeadResult } from "./head-to-head-actions";

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
          className="border rounded-md px-3 py-2"
        />
        <input
          value={queryB}
          onChange={(e) => setQueryB(e.target.value)}
          placeholder="Player B — name or phone"
          className="border rounded-md px-3 py-2"
        />
        <button
          type="button"
          onClick={submit}
          disabled={pending || !queryA || !queryB}
          className="bg-blue-500 text-white rounded-md px-4 py-2 font-medium disabled:opacity-50 self-start"
        >
          Compare
        </button>
      </div>

      {result && "error" in result && <p className="text-sm text-red-600">{result.error}</p>}
      {result && !("error" in result) && (
        <div className="border rounded-md p-3 text-sm">
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
