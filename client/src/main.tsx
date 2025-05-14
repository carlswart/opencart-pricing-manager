import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProviderContext } from "@/providers/theme-provider";

createRoot(document.getElementById("root")!).render(
  <ThemeProviderContext defaultTheme="light">
    <App />
  </ThemeProviderContext>
);
