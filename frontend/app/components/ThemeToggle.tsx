"use client";

import { useTheme } from "@/app/providers/ThemeProvider";

/**
 * ThemeToggle — sun/moon icon button that cycles between light and dark mode.
 * Renders using Material Symbols (already loaded in layout.tsx).
 */
export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { resolved, setTheme } = useTheme();

  const isDark = resolved === "dark";

  return (
    <button
      type="button"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`
        w-9 h-9 rounded-full flex items-center justify-center
        text-on-surface-variant hover:bg-surface-container hover:text-on-surface
        transition-all duration-200 btn-press focus-visible:outline-none
        focus-visible:ring-2 focus-visible:ring-primary/50
        ${className}
      `}
    >
      <span
        className="material-symbols-outlined text-[20px] transition-transform duration-300"
        style={{ transform: isDark ? "rotate(180deg)" : "rotate(0deg)" }}
        aria-hidden="true"
      >
        {isDark ? "light_mode" : "dark_mode"}
      </span>
    </button>
  );
}
