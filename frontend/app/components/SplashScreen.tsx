"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import MaterialIcon from "./MaterialIcon";

const WORD = "NISB-MakeMyCV";

/**
 * Branded splash screen with staggered letter animation, glowing rings and
 * a soft gradient shift. Pure visual polish — no routing or logic changes.
 */
export default function SplashScreen() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-8 overflow-hidden"
          style={{
            background:
              "linear-gradient(160deg, var(--color-primary) 0%, #0a3d78 55%, var(--color-secondary) 100%)",
          }}
          exit={{ opacity: 0, scale: 1.08 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          {/* Floating ambient orbs */}
          <motion.div
            className="absolute -top-24 -left-24 w-96 h-96 rounded-full"
            style={{ background: "rgba(255,255,255,0.06)", filter: "blur(60px)" }}
            animate={{ y: [0, 40, 0], x: [0, 20, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute -bottom-32 -right-20 w-[28rem] h-[28rem] rounded-full"
            style={{ background: "rgba(127,197,253,0.14)", filter: "blur(70px)" }}
            animate={{ y: [0, -50, 0], x: [0, -30, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Logo mark */}
          <motion.div
            className="relative flex items-center justify-center w-24 h-24"
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 14 }}
          >
            <motion.span
              className="absolute inset-0 rounded-3xl"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.25), rgba(255,255,255,0.05))",
                border: "1.5px solid rgba(255,255,255,0.25)",
              }}
              animate={{ scale: [1, 1.12, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            <MaterialIcon name="description" className="text-white text-5xl" filled />
          </motion.div>

          {/* Staggered wordmark */}
          <div className="flex overflow-hidden">
            {WORD.split("").map((ch, i) => (
              <motion.span
                key={i}
                className="text-white font-bold text-4xl tracking-tight"
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.25 + i * 0.05, type: "spring", stiffness: 220, damping: 18 }}
              >
                {ch}
              </motion.span>
            ))}
          </div>

          {/* Loading bar */}
          <motion.div className="w-40 h-1 rounded-full overflow-hidden bg-white/20">
            <motion.div
              className="h-full rounded-full bg-white"
              initial={{ x: "-100%" }}
              animate={{ x: "0%" }}
              transition={{ duration: 1.1, ease: "easeInOut" }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
