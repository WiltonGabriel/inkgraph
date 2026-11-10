import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./index.css";

if (import.meta.env.PROD && typeof navigator !== "undefined" && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js").catch(() => {
      // Service worker registration is optional in non-HTTPS local preview
    });
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
