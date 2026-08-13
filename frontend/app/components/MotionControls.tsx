"use client";

import { motion } from "framer-motion";
import type { ComponentProps, ReactNode } from "react";

const interaction = {
  whileHover: { scale: 1.03 },
  whileTap: { scale: 0.97 },
  transition: { type: "spring" as const, stiffness: 420, damping: 24 },
};

export function MotionLink({
  children,
  ...props
}: ComponentProps<typeof motion.a> & { children: ReactNode }) {
  return (
    <motion.a {...interaction} {...props}>
      {children}
    </motion.a>
  );
}

export function MotionButton({
  children,
  ...props
}: ComponentProps<typeof motion.button> & { children: ReactNode }) {
  return (
    <motion.button {...interaction} {...props}>
      {children}
    </motion.button>
  );
}
