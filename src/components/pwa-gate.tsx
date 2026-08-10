"use client";

import { useEffect, useState } from "react";

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari's non-standard flag for "launched from home screen icon"
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

// Web push only works on iOS when launched from a home-screen-installed PWA
// (Safari 16.4+) — this is a hard gate, not a suggestion, per ideas.md.
export function PwaGate({ children }: { children: React.ReactNode }) {
  const [standalone, setStandalone] = useState<boolean | null>(null);

  useEffect(() => {
    setStandalone(isStandalone());
  }, []);

  if (standalone === null) {
    return null;
  }

  if (!standalone) {
    return (
      <div className="border rounded-md p-4 flex flex-col gap-3">
        <p className="font-medium">Add this app to your home screen to join</p>
        <p className="text-sm text-neutral-500">
          This app sends match notifications through your home screen icon —
          it can&apos;t join a room from inside a regular browser tab.
        </p>
        <ol className="text-sm text-neutral-500 list-decimal list-inside flex flex-col gap-1">
          <li>Tap the Share icon in Safari</li>
          <li>Tap &quot;Add to Home Screen&quot;</li>
          <li>Open the app from the new icon on your home screen</li>
        </ol>
      </div>
    );
  }

  return <>{children}</>;
}
