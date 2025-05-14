import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProviderContext } from "@/providers/theme-provider";
import { ColorThemeProvider } from "@/hooks/use-color-theme";

createRoot(document.getElementById("root")!).render(
  <ThemeProviderContext defaultTheme="light">
    <ColorThemeProvider defaultTheme="default">
      <App />
    </ColorThemeProvider>
  </ThemeProviderContext>
);
