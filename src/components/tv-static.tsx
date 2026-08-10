"use client";

import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";

const GRID_W = 64;
const GRID_H = 400;

// A random base shade per row (horizontal scanline banding) plus a little
// per-pixel jitter on top (grain) — rolling old-TV static, not a full noise field.
function paintNoise(ctx: CanvasRenderingContext2D) {
  const image = ctx.createImageData(GRID_W, GRID_H);
  for (let y = 0; y < GRID_H; y++) {
    const rowShade = Math.random() * 255;
    for (let x = 0; x < GRID_W; x++) {
      const shade = Math.min(255, Math.max(0, rowShade + (Math.random() - 0.5) * 60));
      const i = (y * GRID_W + x) * 4;
      image.data[i] = shade;
      image.data[i + 1] = shade;
      image.data[i + 2] = shade;
      image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
}

// Fullscreen TV-static noise for the retro landing gate — cheap: draws at a
// tiny resolution and lets the browser upscale it blocky/pixelated.
export function TvStatic() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    paintNoise(ctx);
    if (reducedMotion) return;

    const id = setInterval(() => paintNoise(ctx), 80);
    return () => clearInterval(id);
  }, [reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      width={GRID_W}
      height={GRID_H}
      className="absolute inset-0 w-full h-full"
      style={{ imageRendering: "pixelated", opacity: 0.07, mixBlendMode: "screen" }}
    />
  );
}
