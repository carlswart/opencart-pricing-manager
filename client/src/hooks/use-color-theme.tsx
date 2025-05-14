import { createContext, useContext, useEffect, useState } from "react";
import { useTheme } from "@/providers/theme-provider";

type ColorTheme = "default" | "green";

type ColorThemeContextType = {
  colorTheme: ColorTheme;
  setColorTheme: (theme: ColorTheme) => void;
};

const ColorThemeContext = createContext<ColorThemeContextType | undefined>(undefined);

const COLOR_THEME_STORAGE_KEY = "app-color-theme";

export function ColorThemeProvider({ 
  children,
  defaultTheme = "default" 
}: {
  children: React.ReactNode;
  defaultTheme?: ColorTheme;
}) {
  const { theme } = useTheme();
  const [colorTheme, setColorTheme] = useState<ColorTheme>(() => {
    const savedTheme = localStorage.getItem(COLOR_THEME_STORAGE_KEY);
    return (savedTheme as ColorTheme) || defaultTheme;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove any existing color theme classes
    root.classList.remove("theme-default", "theme-green");
    
    // Add the new color theme class
    root.classList.add(`theme-${colorTheme}`);
    
    // Reapply the dark/light mode class if it exists
    // This ensures the proper combination of color theme + dark/light mode
    if (!root.classList.contains("dark") && !root.classList.contains("light") && theme) {
      if (theme === "dark" || theme === "light") {
        root.classList.add(theme);
      } else if (theme === "system") {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        root.classList.add(systemTheme);
      }
    }
  }, [colorTheme, theme]);

  const value = {
    colorTheme,
    setColorTheme: (theme: ColorTheme) => {
      localStorage.setItem(COLOR_THEME_STORAGE_KEY, theme);
      setColorTheme(theme);
    },
  };

  return (
    <ColorThemeContext.Provider value={value}>
      {children}
    </ColorThemeContext.Provider>
  );
}

export const useColorTheme = () => {
  const context = useContext(ColorThemeContext);
  
  if (context === undefined) {
    throw new Error("useColorTheme must be used within a ColorThemeProvider");
  }
  
  return context;
};