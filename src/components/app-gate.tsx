"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { isStandalone } from "@/lib/pwa";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";
import { TvStatic } from "@/components/tv-static";

// Hard gate: the whole app sits behind this until launched from a
// home-screen icon — web push only works on iOS that way (Safari 16.4+),
// per ideas.md. Nothing past this point is reachable in a regular tab.
export function AppGate({ children }: { children: React.ReactNode }) {
  const [standalone, setStandalone] = useState<boolean | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    setStandalone(isStandalone());
    const query = window.matchMedia("(display-mode: standalone)");
    const listener = () => setStandalone(isStandalone());
    query.addEventListener("change", listener);
    return () => query.removeEventListener("change", listener);
  }, []);

  if (standalone === null) return null;

  if (!standalone) {
    return (
      <div
        className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-6 px-6 overflow-hidden"
        style={{ background: "var(--background)" }}
      >
        <TvStatic />
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at center, transparent 30%, var(--background) 90%)",
          }}
        />

        <motion.div
          initial={{ scale: 0, rotate: -12 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 18 }}
          className="relative text-6xl"
        >
          🏆
        </motion.div>

        <div className="relative text-center">
          <h1
            className="text-xl mb-2"
            style={{ fontFamily: "var(--font-pixel-display), monospace", letterSpacing: 1 }}
          >
            iMessage Brackets
          </h1>
          <p className="text-sm muted max-w-xs">
            Match alerts only work from your home screen — add this app there to start
            or join a bracket.
          </p>
        </div>

        <motion.div
          animate={
            reducedMotion
              ? undefined
              : { boxShadow: ["var(--shadow-raised)", "0 0 0 8px rgba(79,158,148,0.25)", "var(--shadow-raised)"] }
          }
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          className="relative tactile-card p-4 flex flex-col gap-3 w-full max-w-xs"
        >
          <p className="font-medium text-sm">Add to your home screen</p>
          <ol className="text-sm muted list-decimal list-inside flex flex-col gap-2">
            <li>
              <span className="inline-flex items-center gap-1.5">
                Tap the Share icon
                <ShareIcon />
                in Safari
              </span>
            </li>
            <li>Tap &quot;Add to Home Screen&quot;</li>
            <li>Open the app from the new icon</li>
          </ol>
        </motion.div>

        <motion.span
          className="relative text-2xl"
          animate={reducedMotion ? undefined : { y: [0, 8, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          style={{ color: "var(--accent-teal)" }}
        >
          ↓
        </motion.span>
      </div>
    );
  }

  return <>{children}</>;
}

function ShareIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ display: "inline" }}>
      <path
        d="M12 3v12M12 3l-4 4M12 3l4 4M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
