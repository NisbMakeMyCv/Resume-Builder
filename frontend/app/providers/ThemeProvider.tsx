"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  /** Resolved actual theme ("light" | "dark") factoring in system preference */
  resolved: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "system",
  setTheme: () => {},
  resolved: "light",
});

function applyTheme(t: Theme, systemDark: boolean) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  if (t === "dark" || (t === "system" && systemDark)) {
    root.classList.add("dark");
  } else {
    root.classList.add("light");
  }
}

/**
 * ThemeProvider — manages light/dark/system colour scheme.
 *
 * Persists the user's preference in localStorage under "makemycv_theme".
 * Applies an `html.dark` or `html.light` class so CSS can target both.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [systemDark, setSystemDark] = useState(false);

  // Read persisted preference + detect system preference on mount.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSystemDark(mq.matches);

    const stored = (localStorage.getItem("makemycv_theme") as Theme) || "system";
    setThemeState(stored);
    applyTheme(stored, mq.matches);

    const listener = (e: MediaQueryListEvent) => {
      setSystemDark(e.matches);
      const current = (localStorage.getItem("makemycv_theme") as Theme) || "system";
      if (current === "system") applyTheme("system", e.matches);
    };
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, []);

  const setTheme = useCallback(
    (t: Theme) => {
      setThemeState(t);
      localStorage.setItem("makemycv_theme", t);
      applyTheme(t, systemDark);
    },
    [systemDark]
  );

  const resolved: "light" | "dark" =
    theme === "system" ? (systemDark ? "dark" : "light") : theme;

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolved }}>
      {children}
    </ThemeContext.Provider>
  );
}

/** useTheme — access and update the current theme. */
export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
