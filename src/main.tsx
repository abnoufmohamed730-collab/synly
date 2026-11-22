import React from "react";
import ReactDOM from "react-dom/client";
import { toast } from "sonner";
import App from "./App";
import "./index.css";

window.addEventListener("unhandledrejection", (event) => {
  console.error("[app] Unhandled asynchronous error", event.reason);
  toast.error("Something went wrong. Please try again.");
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
