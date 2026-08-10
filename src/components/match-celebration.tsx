"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";

const CONFETTI_COLORS = ["#d9633b", "#4f9e94", "#d9a13e", "#7fa563", "#e8d9c4"];

// Lightweight per-match moment (CSS/Framer only) — fires on every match win/
// loss, so it has to stay cheap. The full WebGL trophy scene is reserved for
// the actual tournament-ending moment (see tournament-celebration.tsx).
export function MatchCelebration({
  variant,
  onDone,
}: {
  variant: "win" | "loss";
  onDone: () => void;
}) {
  const reducedMotion = usePrefersReducedMotion();

  const [pieces] = useState(() =>
    Array.from({ length: 18 }).map((_, i) => {
      const angle = (i / 18) * Math.PI * 2;
      const distance = 80 + Math.random() * 60;
      return {
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance + 40,
        rotate: Math.random() * 360,
      };
    })
  );

  useEffect(() => {
    const t = setTimeout(onDone, reducedMotion ? 400 : 1300);
    return () => clearTimeout(t);
  }, [onDone, reducedMotion]);

  if (reducedMotion) return null;

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
      {variant === "win" ? (
        pieces.map((p, i) => (
          <motion.span
            key={i}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
            animate={{ x: p.x, y: p.y, opacity: 0, rotate: p.rotate }}
            transition={{ duration: 1.1, ease: "easeOut" }}
            style={{
              position: "absolute",
              width: 7,
              height: 10,
              background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
              borderRadius: 2,
            }}
          />
        ))
      ) : (
        <motion.div
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{ scale: 1.4, opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{
            width: 60,
            height: 60,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(120,120,128,0.35), transparent 70%)",
          }}
        />
      )}
    </div>
  );
}
