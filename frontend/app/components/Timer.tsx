"use client";

import { useEffect, useState, useRef } from "react";

interface TimerProps {
  /** Duration in minutes. Defaults to 15. */
  durationMinutes?: number;
  onComplete?: () => void;
}

const STORAGE_KEY = "makemycv_landing_timer_end";

/**
 * Timer — circular SVG progress ring + digital MM:SS countdown.
 *
 * Persists across page refreshes via localStorage so the urgency
 * signal is maintained throughout a browsing session.
 *
 * Accessibility: role="timer" + aria-live="polite" so screen readers
 * announce significant changes without interrupting other content.
 */
export default function Timer({ durationMinutes = 15, onComplete }: TimerProps) {
  const totalSeconds = durationMinutes * 60;

  const [timeLeft, setTimeLeft] = useState<number>(() => {
    if (typeof window === "undefined") return totalSeconds;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const endMs = parseInt(saved, 10);
        const remaining = Math.ceil((endMs - Date.now()) / 1000);
        if (remaining > 0 && remaining <= totalSeconds) return remaining;
      }
    } catch {}
    return totalSeconds;
  });

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Persist end-timestamp on first render so refreshes resume correctly.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        const endMs = Date.now() + timeLeft * 1000;
        localStorage.setItem(STORAGE_KEY, endMs.toString());
      }
    } catch {}
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Tick every second.
  useEffect(() => {
    if (timeLeft <= 0) {
      onCompleteRef.current?.();
      return;
    }
    const id = setTimeout(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => clearTimeout(id);
  }, [timeLeft]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = totalSeconds > 0 ? timeLeft / totalSeconds : 0;

  const RADIUS = 20;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  const isUrgent = timeLeft <= 120; // last 2 minutes — turn accent red

  return (
    <div
      role="timer"
      aria-live="polite"
      aria-label={`${minutes} minutes and ${seconds} seconds remaining`}
      className="flex items-center gap-2.5 px-4 py-2 bg-surface-container-lowest/90 backdrop-blur-sm rounded-full border border-outline-variant shadow-md select-none"
    >
      {/* Circular progress ring */}
      <svg
        className="-rotate-90 shrink-0"
        width="40"
        height="40"
        viewBox="0 0 48 48"
        aria-hidden="true"
      >
        {/* Track */}
        <circle
          cx="24"
          cy="24"
          r={RADIUS}
          fill="none"
          stroke="var(--color-outline-variant)"
          strokeWidth="3"
        />
        {/* Progress */}
        <circle
          cx="24"
          cy="24"
          r={RADIUS}
          fill="none"
          stroke={isUrgent ? "var(--color-error)" : "var(--color-primary)"}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: "stroke-dashoffset 1s linear, stroke 0.5s ease" }}
        />
      </svg>

      {/* Digital countdown */}
      <span
        className="font-mono text-sm font-bold tabular-nums leading-none"
        style={{ color: isUrgent ? "var(--color-error)" : "var(--color-primary)" }}
      >
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </span>

      {/* Label */}
      <span className="text-xs text-on-surface-variant font-medium hidden sm:block whitespace-nowrap">
        Free offer
      </span>
    </div>
  );
}
