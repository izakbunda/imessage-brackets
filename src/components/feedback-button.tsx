"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TactileButton } from "@/components/tactile-button";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";

const FEEDBACK_EMAIL = "izakbunda@gmail.com";

export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const reducedMotion = usePrefersReducedMotion();

  function send() {
    const subject = encodeURIComponent("iMessage Brackets feedback");
    const body = encodeURIComponent(message);
    window.location.href = `mailto:${FEEDBACK_EMAIL}?subject=${subject}&body=${body}`;
    setOpen(false);
    setMessage("");
  }

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        whileTap={reducedMotion ? undefined : { scale: 0.9 }}
        className="fixed z-40 flex items-center justify-center text-sm font-bold"
        style={{
          top: "calc(16px + env(safe-area-inset-top))",
          right: 16,
          width: 32,
          height: 32,
          background: "var(--card)",
          color: "var(--foreground)",
          border: "var(--pixel-border)",
          borderRadius: 999,
          boxShadow: "var(--shadow-raised)",
          fontFamily: "var(--font-pixel-display), monospace",
        }}
        aria-label="Send feedback"
      >
        i
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center px-4"
            style={{ background: "rgba(0,0,0,0.45)" }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={reducedMotion ? { opacity: 0 } : { scale: 0.9, opacity: 0 }}
              animate={reducedMotion ? { opacity: 1 } : { scale: 1, opacity: 1 }}
              exit={reducedMotion ? { opacity: 0 } : { scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 34 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm p-4 flex flex-col gap-3"
              style={{
                background: "var(--card)",
                borderRadius: "var(--radius-card)",
                border: "var(--pixel-border)",
                boxShadow: "var(--shadow-raised-lg)",
              }}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium">Send feedback</span>
                <button type="button" onClick={() => setOpen(false)} className="muted text-sm">
                  Close
                </button>
              </div>
              <p className="text-sm muted">
                Found a bug, or have an idea? Let me know — this opens your mail app.
              </p>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What's up?"
                rows={4}
                className="tactile-input px-3 py-2.5 resize-none"
                autoFocus
              />
              <TactileButton onClick={send} disabled={!message.trim()} className="self-start">
                Send feedback
              </TactileButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
