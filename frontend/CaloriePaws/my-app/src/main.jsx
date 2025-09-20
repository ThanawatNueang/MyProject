import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import "./assets/fonts/fonts.css";
import { BrowserRouter } from "react-router-dom";
import AppShell from "./AppShell.jsx";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AppShell>
      <App />
    </AppShell>
  </BrowserRouter>
);
