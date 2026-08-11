"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HeadToHead } from "./head-to-head";
import { CustomComparison } from "./custom-comparison";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";

export function HeadToHeadModal() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"1v1" | "custom">("1v1");
  const reducedMotion = usePrefersReducedMotion();

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        whileTap={reducedMotion ? undefined : { scale: 0.92 }}
        className="fixed left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 px-3 py-2 text-sm"
        style={{
          bottom: "calc(92px + env(safe-area-inset-bottom))",
          background: "var(--card)",
          color: "var(--foreground)",
          border: "var(--pixel-border)",
          borderRadius: 999,
          boxShadow: "var(--shadow-raised)",
        }}
      >
        ⚔️ Compare
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-end justify-center px-4 pb-4"
            style={{ background: "rgba(0,0,0,0.45)" }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={reducedMotion ? { opacity: 0 } : { y: "100%" }}
              animate={reducedMotion ? { opacity: 1 } : { y: 0 }}
              exit={reducedMotion ? { opacity: 0 } : { y: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 34 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm p-4 flex flex-col gap-3"
              style={{
                background: "var(--card)",
                borderRadius: "var(--radius-card)",
                border: "var(--pixel-border)",
                boxShadow: "var(--shadow-raised-lg)",
                marginBottom: "calc(80px + env(safe-area-inset-bottom))",
                maxHeight: "70vh",
                overflowY: "auto",
              }}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium">Compare players</span>
                <button type="button" onClick={() => setOpen(false)} className="muted text-sm">
                  Close
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTab("1v1")}
                  className="flex-1 px-3 py-2 text-sm"
                  style={{
                    background: tab === "1v1" ? "var(--accent-coral)" : "var(--background)",
                    color: tab === "1v1" ? "#3a2f1e" : "var(--foreground)",
                    border: tab === "1v1" ? "3px solid #3a2f1e" : "2px solid var(--border-subtle)",
                    borderRadius: "var(--radius-button)",
                    fontWeight: tab === "1v1" ? 600 : 400,
                  }}
                >
                  1v1
                </button>
                <button
                  type="button"
                  onClick={() => setTab("custom")}
                  className="flex-1 px-3 py-2 text-sm"
                  style={{
                    background: tab === "custom" ? "var(--accent-coral)" : "var(--background)",
                    color: tab === "custom" ? "#3a2f1e" : "var(--foreground)",
                    border: tab === "custom" ? "3px solid #3a2f1e" : "2px solid var(--border-subtle)",
                    borderRadius: "var(--radius-button)",
                    fontWeight: tab === "custom" ? 600 : 400,
                  }}
                >
                  Custom list
                </button>
              </div>

              {tab === "1v1" ? <HeadToHead hideTitle /> : <CustomComparison />}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
