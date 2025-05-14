"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  // Ensure we only render client-side
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </NextThemesProvider>
  );
}

// Context and hook for easy theme access
type ThemeContextType = {
  theme: string | undefined;
  setTheme: (theme: string) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProviderContext({ 
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: {
  children: React.ReactNode;
  defaultTheme?: string;
  storageKey?: string;
}) {
  const [theme, setTheme] = useState<string | undefined>(
    () => localStorage.getItem(storageKey) || defaultTheme
  );

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Only handle light/dark mode, don't remove color themes
    root.classList.remove("light", "dark");
    
    // Handle the system/light/dark theme
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      
      root.classList.add(systemTheme);
    } else if (theme === "light" || theme === "dark") {
      root.classList.add(theme);
    }
  }, [theme]);

  const value = {
    theme,
    setTheme: (theme: string) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
  };

  return (
    <ThemeContext.Provider value={value} {...props}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  
  return context;
};