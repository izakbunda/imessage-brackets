"use client";

import { motion } from "framer-motion";
import { forwardRef } from "react";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";
import { hapticTap } from "@/lib/haptics";

type Variant = "primary" | "secondary" | "success";

const VARIANT_STYLES: Record<Variant, string> = {
  primary: "text-white",
  secondary: "tactile-card",
  success: "text-white",
};

const VARIANT_BG: Record<Variant, string> = {
  primary: "var(--accent-blue)",
  secondary: "var(--card)",
  success: "var(--accent-green)",
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
      whileTap={reducedMotion ? undefined : { scale: 0.96, y: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      onClick={(e) => {
        hapticTap();
        onClick?.(e);
      }}
      style={{
        background: VARIANT_BG[variant],
        borderRadius: "var(--radius-button)",
        boxShadow: variant === "secondary" ? "var(--shadow-raised)" : "var(--shadow-raised)",
        ...style,
      }}
      className={`px-4 py-2.5 font-medium disabled:opacity-50 ${VARIANT_STYLES[variant]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
});
