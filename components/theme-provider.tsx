"use client";

import * as React from "react";

type Theme = "dark" | "light" | "system";

interface ThemeProviderContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeProviderContext = React.createContext<ThemeProviderContextType | undefined>(undefined);

export function ThemeProvider({
  children,
  attribute = "class",
  defaultTheme = "system",
  enableSystem = true,
  disableTransitionOnChange = false,
  ...props
}: {
  children?: React.ReactNode;
  attribute?: "class" | "data-theme";
  defaultTheme?: Theme;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
}) {
  const [theme, setThemeState] = React.useState<Theme>(defaultTheme);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("resume-theme") as Theme | null;
    if (stored) setThemeState(stored);
  }, []);

  React.useEffect(() => {
    if (!mounted) return;
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    let resolved: "light" | "dark" = "light";
    if (theme === "system" && enableSystem) {
      resolved = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } else if (theme === "dark" || theme === "light") {
      resolved = theme;
    }
    root.classList.add(resolved);
    localStorage.setItem("resume-theme", theme);
  }, [theme, mounted, enableSystem]);

  const setTheme = React.useCallback((t: Theme) => {
    setThemeState(t);
  }, []);

  const value = React.useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return (
    <ThemeProviderContext.Provider value={value} {...props}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export function useTheme() {
  const ctx = React.useContext(ThemeProviderContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
