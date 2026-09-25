"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import MaterialIcon from "./MaterialIcon";
import { TUTORIAL_STEPS, useTutorial } from "./TutorialContext";

// ─── Bounding rect type ───────────────────────────────────────────────────────

type Rect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

// ─── How much padding around the target element's spotlight ──────────────────

const SPOTLIGHT_PAD = 10;
const TOOLTIP_GAP = 18;
const TOOLTIP_WIDTH = 340;

// ─── Smart tooltip position calculator ───────────────────────────────────────

function calcTooltipStyle(
  rect: Rect | null,
  placement: "top" | "bottom" | "left" | "right",
  vpW: number,
  vpH: number
): React.CSSProperties {
  if (!rect) return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };

  const sp = {
    top: rect.top - SPOTLIGHT_PAD,
    left: rect.left - SPOTLIGHT_PAD,
    bottom: rect.top + rect.height + SPOTLIGHT_PAD,
    right: rect.left + rect.width + SPOTLIGHT_PAD,
  };

  let style: React.CSSProperties = {};

  switch (placement) {
    case "right":
      style = {
        top: Math.min(sp.top, vpH - 260),
        left: sp.right + TOOLTIP_GAP,
      };
      // If would overflow right, flip to left
      if (sp.right + TOOLTIP_GAP + TOOLTIP_WIDTH > vpW) {
        style = {
          top: Math.min(sp.top, vpH - 260),
          left: sp.left - TOOLTIP_WIDTH - TOOLTIP_GAP,
        };
      }
      break;

    case "left":
      style = {
        top: Math.min(sp.top, vpH - 260),
        left: sp.left - TOOLTIP_WIDTH - TOOLTIP_GAP,
      };
      break;

    case "bottom":
      style = {
        top: sp.bottom + TOOLTIP_GAP,
        left: Math.max(8, Math.min(sp.left, vpW - TOOLTIP_WIDTH - 8)),
      };
      break;

    case "top":
    default:
      style = {
        top: sp.top - TOOLTIP_GAP - 200, // approx tooltip height
        left: Math.max(8, Math.min(sp.left, vpW - TOOLTIP_WIDTH - 8)),
      };
      break;
  }

  // Clamp to viewport
  if (typeof style.top === "number") style.top = Math.max(8, style.top);
  if (typeof style.left === "number") style.left = Math.max(8, style.left);

  return style;
}

// ─── Main Tutorial overlay component ─────────────────────────────────────────

export default function Tutorial() {
  const { isActive, currentStep, totalSteps, nextStep, prevStep, skipTutorial, goToStep } =
    useTutorial();

  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const [vpSize, setVpSize] = useState({ w: 0, h: 0 });
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const animFrameRef = useRef<number>(0);

  const step = TUTORIAL_STEPS[currentStep];

  // Track viewport size
  useEffect(() => {
    const update = () => setVpSize({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Measure target element & keep rect in sync (handles scroll too)
  useLayoutEffect(() => {
    if (!isActive || !step) return;

    function measure() {
      const el = document.getElementById(step.targetId);
      if (!el) {
        setTargetRect(null);
        return;
      }
      const r = el.getBoundingClientRect();
      setTargetRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    }

    measure();

    // Scroll the element into view smoothly
    const el = document.getElementById(step.targetId);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });

    // Re-measure on resize / scroll
    const raf = () => {
      measure();
      animFrameRef.current = requestAnimationFrame(raf);
    };
    animFrameRef.current = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [isActive, currentStep, step]);

  if (!isActive || !step) return null;

  const spotlight = targetRect
    ? {
        top: targetRect.top - SPOTLIGHT_PAD,
        left: targetRect.left - SPOTLIGHT_PAD,
        width: targetRect.width + SPOTLIGHT_PAD * 2,
        height: targetRect.height + SPOTLIGHT_PAD * 2,
      }
    : null;

  const tooltipStyle = calcTooltipStyle(
    targetRect,
    step.placement,
    vpSize.w,
    vpSize.h
  );

  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;

  const overlay = (
    <AnimatePresence>
      {isActive && (
        <motion.div
          key="tutorial-root"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="tutorial-overlay"
          aria-modal="true"
          role="dialog"
          aria-label={`Tutorial step ${currentStep + 1} of ${totalSteps}: ${step.title}`}
        >
          {/* ── Dark scrim with spotlight cutout ───────────────────────── */}
          <div
            className="fixed inset-0"
            style={{
              zIndex: 9000,
              pointerEvents: "none",
            }}
          >
            {/* Full scrim — NO blur so the spotlighted element stays sharp */}
            <div
              className="absolute inset-0"
              style={{
                background: "rgba(0,0,0,0.55)",
              }}
            />

            {/* Spotlight hole — persistent div that GLIDES to new position each step */}
            {spotlight && (
              <motion.div
                animate={{
                  top: spotlight.top,
                  left: spotlight.left,
                  width: spotlight.width,
                  height: spotlight.height,
                  opacity: 1,
                }}
                initial={{ opacity: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 420,
                  damping: 34,
                  mass: 0.75,
                }}
                style={{
                  position: "absolute",
                  borderRadius: 16,
                  background: "transparent",
                  boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
                  zIndex: 1,
                }}
              >
                {/* Primary ring glow */}
                <div
                  className="tutorial-ring"
                  style={{
                    position: "absolute",
                    inset: -3,
                    borderRadius: 18,
                    border: "2.5px solid var(--color-primary)",
                    pointerEvents: "none",
                  }}
                />
              </motion.div>
            )}
          </div>

          {/* ── Click-through zone for the spotlight itself ─────────────── */}
          {spotlight && (
            <div
              style={{
                position: "fixed",
                top: spotlight.top,
                left: spotlight.left,
                width: spotlight.width,
                height: spotlight.height,
                zIndex: 9100,
                cursor: "default",
                pointerEvents: "none",
              }}
            />
          )}

          {/* ── Skip button removed from here — now lives inside the tooltip card ── */}

          {/* ── Tooltip card — popLayout = new card enters while old one exits simultaneously ── */}
          <AnimatePresence mode="popLayout">
            <motion.div
              key={`tooltip-${currentStep}`}
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.08, ease: "easeIn" } }}
              transition={{ type: "spring", stiffness: 520, damping: 36, mass: 0.65 }}
              style={{
                position: "fixed",
                width: TOOLTIP_WIDTH,
                zIndex: 9200,
                ...tooltipStyle,
              }}
              className="tutorial-tooltip bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.25)] overflow-hidden"
            >
              {/* Accent top bar */}
              <div className="h-1 w-full bg-gradient-to-r from-primary to-secondary" />

              {/* Content */}
              <div className="p-5">
                {/* Step label */}
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center gap-1.5 text-label-sm font-semibold text-on-surface-variant bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                    <MaterialIcon name="school" className="text-[14px]" />
                    Step {currentStep + 1} of {totalSteps}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-label-md font-bold text-on-surface leading-snug mb-2">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="text-label-sm text-on-surface-variant leading-relaxed">
                  {step.description}
                </p>

                {/* Progress dots */}
                <div className="flex items-center gap-1.5 mt-4 mb-4">
                  {Array.from({ length: totalSteps }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => goToStep(i)}
                      aria-label={`Go to step ${i + 1}`}
                      style={{
                        width: i === currentStep ? 20 : 7,
                        height: 7,
                        borderRadius: 9999,
                        background:
                          i === currentStep
                            ? "var(--color-primary)"
                            : i < currentStep
                            ? "var(--color-secondary)"
                            : "var(--color-outline-variant)",
                        transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                      }}
                    />
                  ))}
                </div>

                {/* Navigation row — 3 columns: Prev | Skip | Next */}
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={prevStep}
                    disabled={isFirst}
                    className="btn-outline px-4 py-2 rounded-full text-label-sm font-semibold flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    aria-label="Previous step"
                  >
                    <MaterialIcon name="chevron_left" className="text-[18px]" />
                    Prev
                  </button>

                  {/* Skip — centred tertiary action */}
                  <button
                    onClick={skipTutorial}
                    className="text-label-sm font-medium text-on-surface-variant hover:text-error transition-colors px-2 py-1 rounded-lg hover:bg-error-container/20"
                    aria-label="Skip tutorial"
                  >
                    Skip
                  </button>

                  <button
                    onClick={nextStep}
                    className="btn-primary btn-shine px-5 py-2 rounded-full text-label-sm font-semibold text-white flex items-center gap-1.5 transition-all"
                    aria-label={isLast ? "Finish tutorial" : "Next step"}
                  >
                    {isLast ? (
                      <>
                        Done
                        <MaterialIcon name="check_circle" className="text-[18px]" />
                      </>
                    ) : (
                      <>
                        Next
                        <MaterialIcon name="chevron_right" className="text-[18px]" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Render into a portal so it escapes any stacking context
  if (typeof document === "undefined") return null;
  return createPortal(overlay, document.body);
}
