"use client";

import React, { createContext, useContext, useEffect } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  resolved: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  setTheme: () => {},
  resolved: "light",
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Strictly enforce light mode
    const root = document.documentElement;
    root.classList.remove("dark");
    root.classList.add("light");
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: "light", setTheme: () => {}, resolved: "light" }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
