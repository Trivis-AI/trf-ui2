import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// Self-hosted fonts (GDPR-clean, no external requests). Variable = all weights in one file.
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "./index.css";
import { App } from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
