"use client";

import { motion, useReducedMotion } from "framer-motion";

export default function AnimatedHeading({
  text,
  className = "",
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.h2
      className={`${className} overflow-hidden`}
      initial={reduceMotion ? false : "hidden"}
      animate="visible"
      aria-label={text}
    >
      {text.split(" ").map((word, index) => (
        <span key={`${word}-${index}`} className="inline-block overflow-hidden align-top">
          <motion.span
            className="inline-block"
            variants={{
              hidden: { opacity: 0, y: "110%" },
              visible: { opacity: 1, y: "0%" },
            }}
            transition={{
              delay: delay + index * 0.055,
              duration: 0.55,
              ease: [0.22, 1, 0.36, 1],
            }}
            aria-hidden="true"
          >
            {word}
          </motion.span>
          {index < text.split(" ").length - 1 ? " " : ""}
        </span>
      ))}
    </motion.h2>
  );
}
