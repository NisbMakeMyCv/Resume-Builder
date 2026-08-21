"use client";

import { motion } from "framer-motion";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Global Page Entrance Transition */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {children}
      </motion.div>

      {/* 
        Optional Overlay Loader on Route Change:
        This briefly shows "NISB's MakeMyCV" when the template mounts.
      */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0, transitionEnd: { display: "none" } }}
        transition={{ duration: 0.4, delay: 0.2, ease: "easeIn" }}
        className="pointer-events-none fixed inset-0 z-[9999] flex items-center justify-center bg-background"
        style={{ originY: 0 }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="text-headline-lg font-bold text-primary flex items-center gap-3"
        >
          <span className="material-symbols-outlined text-[36px] animate-spin-slow">
            autorenew
          </span>
          NISB&apos;s MakeMyCV
        </motion.div>
      </motion.div>
    </>
  );
}
