"use client";

import { motion } from "framer-motion";
import { forwardRef } from "react";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";
import { hapticTap } from "@/lib/haptics";

type Variant = "primary" | "secondary" | "success";

const VARIANT_BG: Record<Variant, string> = {
  primary: "var(--accent-coral)",
  secondary: "var(--card)",
  success: "var(--accent-sage)",
};

const VARIANT_TEXT: Record<Variant, string> = {
  primary: "#3a2f1e",
  secondary: "var(--foreground)",
  success: "#3a2f1e",
};

const VARIANT_BORDER: Record<Variant, string> = {
  primary: "3px solid #3a2f1e",
  secondary: "var(--pixel-border)",
  success: "3px solid #3a2f1e",
};

type TactileButtonProps = {
  variant?: Variant;
  className?: string;
  style?: React.CSSProperties;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  children?: React.ReactNode;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  "aria-label"?: string;
};

export const TactileButton = forwardRef<HTMLButtonElement, TactileButtonProps>(function TactileButton(
  { variant = "primary", className = "", style, onClick, children, ...props },
  ref
) {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <motion.button
      ref={ref}
      whileHover={reducedMotion ? undefined : { y: -2, boxShadow: "var(--shadow-raised-lg)" }}
      whileTap={reducedMotion ? undefined : { x: 3, y: 3, boxShadow: "0 0 0 0 rgba(0,0,0,0.6)" }}
      transition={{ type: "spring", stiffness: 700, damping: 30 }}
      onClick={(e) => {
        hapticTap();
        onClick?.(e);
      }}
      style={{
        background: VARIANT_BG[variant],
        color: VARIANT_TEXT[variant],
        border: VARIANT_BORDER[variant],
        borderRadius: "var(--radius-button)",
        boxShadow: "var(--shadow-raised)",
        fontFamily: "var(--font-pixel-display), monospace",
        fontSize: 12,
        textTransform: "uppercase",
        ...style,
      }}
      className={`px-4 py-3 disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
});
