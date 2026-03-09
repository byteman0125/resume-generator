import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import { getBaseUrl } from "./api";
import { ErrorBoundary } from "./ErrorBoundary";
import "./index.css";

/** Patch fetch so relative URLs (e.g. /api/...) go to the configured backend. */
try {
  const originalFetch = window.fetch;
  window.fetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === "string" ? input : input instanceof Request ? input.url : input.toString();
    if (url.startsWith("/") && !url.startsWith("//")) {
      const full = getBaseUrl() + url;
      const newInput = typeof input === "string" ? full : input instanceof Request ? new Request(full, input) : full;
      return originalFetch.call(this, newInput, init);
    }
    return originalFetch.call(this, input, init);
  };
} catch (e) {
  console.error("Fetch patch failed:", e);
}

const root = document.getElementById("root");
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <ErrorBoundary>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ErrorBoundary>
    </React.StrictMode>
  );
}
