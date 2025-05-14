"use client";

import { createContext, useContext, useEffect, useState } from "react";

// Context and hook for easy theme access
type ThemeContextType = {
  theme: string;
  setTheme: (theme: string) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "vite-ui-theme";

// For system's preferred color scheme
function getSystemTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

// The main theme provider
export function ThemeProvider({ 
  children, 
  defaultTheme = "light",
}: { 
  children: React.ReactNode;
  defaultTheme?: string;
}) {
  const [mounted, setMounted] = useState(false);
  const [theme, setThemeState] = useState<string>(() => {
    if (typeof window === "undefined") return defaultTheme;
    return localStorage.getItem(THEME_STORAGE_KEY) || defaultTheme;
  });

  // Apply theme to document
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove existing mode classes
    root.classList.remove("light", "dark");
    
    // Determine theme to apply
    let appliedTheme = theme;
    if (theme === "system") {
      appliedTheme = getSystemTheme();
    }
    
    // Apply the theme
    root.classList.add(appliedTheme);
  }, [theme]);

  // Watch for system preferences change
  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const handleChange = () => {
      const root = window.document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(getSystemTheme());
    };
    
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  // Ensure we only render client-side
  useEffect(() => {
    setMounted(true);
  }, []);

  const setTheme = (newTheme: string) => {
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    setThemeState(newTheme);
  };

  const value = {
    theme,
    setTheme,
  };

  // Prevent flash on load
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// The theme provider context is now just an alias for ThemeProvider
export const ThemeProviderContext = ThemeProvider;

export const useTheme = () => {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  
  return context;
};