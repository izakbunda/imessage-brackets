"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const KEY = "imessage-brackets:last-seen-sha";

export function VersionBanner({
  sha,
  message,
  repoOwner,
  repoSlug,
}: {
  sha?: string;
  message?: string;
  repoOwner?: string;
  repoSlug?: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!sha) return;
    const lastSeen = localStorage.getItem(KEY);
    if (lastSeen && lastSeen !== sha) {
      setVisible(true);
      const t = setTimeout(() => {
        setVisible(false);
        localStorage.setItem(KEY, sha);
      }, 7000);
      return () => clearTimeout(t);
    }
    localStorage.setItem(KEY, sha);
  }, [sha]);

  function dismiss() {
    setVisible(false);
    if (sha) localStorage.setItem(KEY, sha);
  }

  const commitUrl = repoOwner && repoSlug && sha ? `https://github.com/${repoOwner}/${repoSlug}/commit/${sha}` : null;
  const shortMessage = message?.split("\n")[0]?.slice(0, 80) ?? "New update";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 34 }}
          className="fixed top-4 inset-x-4 z-[250] flex items-center gap-2 px-3 py-2.5 text-sm"
          style={{
            background: "var(--accent-sage)",
            color: "#3a2f1e",
            border: "3px solid #3a2f1e",
            borderRadius: "var(--radius-card)",
            boxShadow: "var(--shadow-raised)",
          }}
        >
          <span className="shrink-0">✨</span>
          {commitUrl ? (
            <a href={commitUrl} target="_blank" rel="noreferrer" className="flex-1 truncate underline">
              Updated: {shortMessage}
            </a>
          ) : (
            <span className="flex-1 truncate">Updated: {shortMessage}</span>
          )}
          <button type="button" onClick={dismiss} className="shrink-0 font-bold px-1">
            ✕
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
