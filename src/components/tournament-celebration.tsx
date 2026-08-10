"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { motion } from "framer-motion";
import * as THREE from "three";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";

const CONFETTI_COLORS = ["#0a84ff", "#34c759", "#ffd60a", "#ff9f0a", "#ff375f"];

function ease(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function Trophy({ variant }: { variant: "champion" | "runnerup" }) {
  const groupRef = useRef<THREE.Group>(null);
  const start = useRef<number | null>(null);
  const gold = variant === "champion";
  const cupColor = gold ? "#ffd60a" : "#9a9aa0";
  const baseColor = gold ? "#c77a1a" : "#6b6b70";

  useFrame((state) => {
    if (!groupRef.current) return;
    if (start.current === null) start.current = state.clock.elapsedTime;
    const t = Math.min((state.clock.elapsedTime - start.current) / 1.4, 1);
    const e = ease(t);

    if (gold) {
      groupRef.current.position.y = THREE.MathUtils.lerp(-1.2, 0, e) + Math.sin(state.clock.elapsedTime * 2) * 0.04;
      groupRef.current.rotation.y += 0.008;
    } else {
      groupRef.current.rotation.z = THREE.MathUtils.lerp(0, Math.PI / 2.3, e);
      groupRef.current.position.y = THREE.MathUtils.lerp(0.2, -0.5, e);
    }
  });

  return (
    <group ref={groupRef}>
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.5, 0.25, 0.7, 24]} />
        <meshStandardMaterial color={cupColor} metalness={0.6} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.5, 12]} />
        <meshStandardMaterial color={cupColor} metalness={0.6} roughness={0.25} />
      </mesh>
      <mesh position={[0, -0.25, 0]}>
        <cylinderGeometry args={[0.4, 0.45, 0.2, 24]} />
        <meshStandardMaterial color={baseColor} metalness={0.4} roughness={0.4} />
      </mesh>
    </group>
  );
}

function ConfettiOverlay() {
  const [pieces] = useState(() =>
    Array.from({ length: 40 }).map(() => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.6,
      duration: 1.8 + Math.random() * 1.2,
      rotate: Math.random() * 400 - 200,
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
            borderRadius: 2,
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

  useEffect(() => {
    const t = setTimeout(() => setDismissing(true), 4200);
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
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4"
      style={{ background: "rgba(0,0,0,0.55)" }}
    >
      {variant === "champion" && !reducedMotion && <ConfettiOverlay />}

      <div style={{ width: 220, height: 220 }}>
        {!reducedMotion ? (
          <Canvas camera={{ position: [0, 0.3, 3], fov: 40 }}>
            <ambientLight intensity={0.7} />
            <directionalLight position={[2, 3, 2]} intensity={1.2} />
            <Trophy variant={variant} />
          </Canvas>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">
            {variant === "champion" ? "🏆" : "🥈"}
          </div>
        )}
      </div>

      <div className="text-center text-white px-6">
        <p className="text-2xl font-semibold">{title}</p>
        <p className="text-sm opacity-80 mt-1">{subtitle}</p>
      </div>
    </motion.div>
  );
}
