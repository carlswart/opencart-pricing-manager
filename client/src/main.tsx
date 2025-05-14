import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "@/providers/theme-provider";
import { ColorThemeProvider } from "@/hooks/use-color-theme";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="light">
    <ColorThemeProvider defaultTheme="default">
      <App />
    </ColorThemeProvider>
  </ThemeProvider>
);
