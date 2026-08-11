"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";
import { PixelTrophy } from "@/components/pixel-trophy";

const CONFETTI_COLORS = ["#f2795c", "#3a7d55", "#e0a72e", "#6fae63", "#ec6fa0", "#8b7fd1"];

function Sparkles({ color }: { color: string }) {
  const [sparkles] = useState(() =>
    Array.from({ length: 10 }).map(() => ({
      angle: Math.random() * Math.PI * 2,
      distance: 90 + Math.random() * 70,
      delay: Math.random() * 1.2,
      size: 4 + Math.random() * 5,
    }))
  );

  return (
    <>
      {sparkles.map((s, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
          transition={{ duration: 1.1, repeat: Infinity, delay: s.delay, repeatDelay: 0.8 }}
          style={{
            position: "absolute",
            left: `calc(50% + ${Math.cos(s.angle) * s.distance}px)`,
            top: `calc(50% + ${Math.sin(s.angle) * s.distance}px)`,
            width: s.size,
            height: s.size,
            background: color,
            clipPath:
              "polygon(50% 0%, 61% 39%, 100% 50%, 61% 61%, 50% 100%, 39% 61%, 0% 50%, 39% 39%)",
          }}
        />
      ))}
    </>
  );
}

function ConfettiOverlay() {
  const [pieces] = useState(() =>
    Array.from({ length: 70 }).map(() => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.6,
      duration: 1.6 + Math.random() * 1.4,
      rotate: Math.random() * 500 - 250,
    }))
  );

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {pieces.map((p, i) => (
        <motion.span
          key={i}
          initial={{ y: -20, x: `${p.left}vw`, opacity: 1, rotate: 0 }}
          animate={{ y: "110vh", opacity: [1, 1, 0], rotate: p.rotate }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
          style={{
            position: "absolute",
            top: 0,
            width: 8,
            height: 12,
            background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
          }}
        />
      ))}
    </div>
  );
}

export function TournamentCelebration({
  variant,
  title,
  subtitle,
  onDone,
}: {
  variant: "champion" | "runnerup";
  title: string;
  subtitle: string;
  onDone: () => void;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const [dismissing, setDismissing] = useState(false);
  const gold = variant === "champion";
  const glowColor = gold ? "#e0b84a" : "#8b8794";

  useEffect(() => {
    const t = setTimeout(() => setDismissing(true), 4600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!dismissing) return;
    const t = setTimeout(onDone, 300);
    return () => clearTimeout(t);
  }, [dismissing, onDone]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: dismissing ? 0 : 1 }}
      transition={{ duration: 0.3 }}
      onClick={() => setDismissing(true)}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 overflow-hidden"
      style={{ background: "#2a2013" }}
    >
      {!reducedMotion && (
        <motion.div
          className="absolute inset-0"
          style={{
            background: `conic-gradient(from 0deg, ${glowColor}33, transparent 25%, ${glowColor}33 50%, transparent 75%, ${glowColor}33)`,
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        />
      )}

      {!reducedMotion && (
        <motion.div
          className="absolute inset-0"
          style={{ background: "#fff" }}
          initial={{ opacity: 0.9 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        />
      )}

      {gold && !reducedMotion && <ConfettiOverlay />}

      <motion.div
        className="relative flex items-center justify-center"
        style={{ width: 240, height: 260 }}
        initial={reducedMotion ? { opacity: 0 } : { scale: 0, rotate: -20 }}
        animate={
          reducedMotion
            ? { opacity: 1 }
            : gold
              ? { scale: [0, 1.25, 1], rotate: [-20, 8, 0] }
              : { scale: 1, rotate: 70, y: 40, opacity: 0.7 }
        }
        transition={
          gold
            ? { duration: 0.7, times: [0, 0.6, 1], ease: "easeOut" }
            : { duration: 0.9, ease: "easeIn" }
        }
      >
        {gold && !reducedMotion && <Sparkles color={glowColor} />}
        <motion.div
          animate={
            !reducedMotion && gold
              ? { y: [0, -10, 0], filter: [
                  `drop-shadow(0 0 8px ${glowColor}88)`,
                  `drop-shadow(0 0 26px ${glowColor}cc)`,
                  `drop-shadow(0 0 8px ${glowColor}88)`,
                ] }
              : undefined
          }
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <PixelTrophy variant={variant} />
        </motion.div>
      </motion.div>

      <motion.div
        className="text-center px-6 relative"
        style={{ color: "#f2ede3" }}
        initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        <p
          className="text-xl mb-1"
          style={{ fontFamily: "var(--font-pixel-display), monospace", letterSpacing: 1 }}
        >
          {title}
        </p>
        <p className="text-sm opacity-80">{subtitle}</p>
      </motion.div>
    </motion.div>
  );
}
