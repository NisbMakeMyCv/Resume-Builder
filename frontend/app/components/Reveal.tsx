"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Scroll-reveal wrapper — springs children into view once.
 * Pure visual polish, no layout or logic changes.
 */
export default function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 30 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{
        delay: delay / 1000,
        type: "spring",
        stiffness: 95,
        damping: 18,
        mass: 0.8,
      }}
    >
      {children}
    </motion.div>
  );
}
