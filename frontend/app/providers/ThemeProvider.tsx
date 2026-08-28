"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolved: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  setTheme: () => {},
  resolved: "light",
});

export function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [resolved, setResolved] = useState<"light" | "dark">("light");

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") as Theme | null;

    if (
      storedTheme === "light" ||
      storedTheme === "dark" ||
      storedTheme === "system"
    ) {
      setThemeState(storedTheme);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = (currentTheme: Theme) => {
      const systemDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;

      const isDark =
        currentTheme === "dark" ||
        (currentTheme === "system" && systemDark);

      root.classList.remove("light", "dark");
      root.classList.add(isDark ? "dark" : "light");

      setResolved(isDark ? "dark" : "light");
    };

    applyTheme(theme);
    localStorage.setItem("theme", theme);

    if (theme === "system") {
      const mediaQuery = window.matchMedia(
        "(prefers-color-scheme: dark)"
      );

      const handleChange = () => applyTheme("system");

      mediaQuery.addEventListener("change", handleChange);

      return () => {
        mediaQuery.removeEventListener("change", handleChange);
      };
    }
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        resolved,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}