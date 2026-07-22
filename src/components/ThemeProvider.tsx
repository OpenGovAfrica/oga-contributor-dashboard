"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  setTheme: () => null,
});

/**
 * ThemeProvider handles the global light/dark mode state.
 * It synchronizes with localStorage and listens to OS-level preference changes
 * when configured to use the "system" theme.
 */
export function ThemeProvider({ 
  children, 
  defaultTheme = "dark" 
}: { 
  children: React.ReactNode, 
  defaultTheme?: Theme 
}) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);

  useEffect(() => {
    // 1. Initialize from localStorage or default
    const saved = (localStorage.getItem("theme") as Theme) || defaultTheme;
    setThemeState(saved);
    applyTheme(saved);

    // 2. Listen for live OS-level theme changes if set to "system"
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (localStorage.getItem("theme") === "system") {
        applyTheme("system");
      }
    };
    
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [defaultTheme]);

  const applyTheme = (newTheme: Theme) => {
    const isDark = newTheme === "system" 
      ? window.matchMedia("(prefers-color-scheme: dark)").matches 
      : newTheme === "dark";

    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
    }
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
