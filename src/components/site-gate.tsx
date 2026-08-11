"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { isSiteUnlocked, unlockSite, SITE_PASSWORD } from "@/lib/site-lock";
import { TactileButton } from "@/components/tactile-button";

// Soft deterrent, not real auth — this is a client-only check meant to keep
// the deployed link from being casually browsable by strangers, nothing more.
export function SiteGate({ children }: { children: React.ReactNode }) {
  const gateDisabled = process.env.NEXT_PUBLIC_DISABLE_PWA_GATE === "1";
  const [unlocked, setUnlocked] = useState<boolean | null>(gateDisabled ? true : null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (gateDisabled) return;
    setUnlocked(isSiteUnlocked());
  }, [gateDisabled]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password === SITE_PASSWORD) {
      unlockSite();
      setUnlocked(true);
    } else {
      setError(true);
    }
  }

  if (unlocked === null) return null;

  if (!unlocked) {
    return (
      <div
        className="fixed inset-0 z-[300] flex flex-col items-center justify-center gap-6 px-6"
        style={{ background: "var(--background)" }}
      >
        <motion.div
          initial={{ scale: 0, rotate: -12 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 18 }}
          className="text-6xl"
        >
          🔒
        </motion.div>
        <h1
          className="text-xl text-center"
          style={{ fontFamily: "var(--font-pixel-display), monospace", letterSpacing: 1 }}
        >
          iMessage Brackets
        </h1>
        <form onSubmit={submit} className="w-full max-w-xs flex flex-col gap-2">
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(false);
            }}
            placeholder="Password"
            autoFocus
            className="tactile-input px-3 py-2.5 text-center"
          />
          {error && <p className="text-sm error-text text-center">Wrong password.</p>}
          <TactileButton type="submit">Enter</TactileButton>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
