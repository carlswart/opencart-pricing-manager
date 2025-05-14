import { createContext, useContext, useEffect, useState } from "react";

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
  const [colorTheme, setColorTheme] = useState<ColorTheme>(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem(COLOR_THEME_STORAGE_KEY);
      return (savedTheme as ColorTheme) || defaultTheme;
    }
    return defaultTheme;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove any existing color theme classes
    root.classList.remove("theme-default", "theme-green");
    
    // Add the new color theme class
    root.classList.add(`theme-${colorTheme}`);
  }, [colorTheme]);

  const value = {
    colorTheme,
    setColorTheme: (theme: ColorTheme) => {
      if (typeof window !== "undefined") {
        localStorage.setItem(COLOR_THEME_STORAGE_KEY, theme);
      }
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