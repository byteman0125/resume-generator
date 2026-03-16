import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AppWithProviders } from "./App";
import { ProfileFlyout, ProfileFlyoutIcon } from "./components/ProfileFlyout";
import { AuthProvider } from "./lib/auth-context";
import { getBaseUrl, getAuthToken, clearAuthToken } from "./api";
import { ErrorBoundary } from "./ErrorBoundary";
import "./index.css";

/** Patch fetch: send relative URLs to backend, add Bearer token, and on 401 clear auth and notify. */
try {
  const originalFetch = window.fetch;
  window.fetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === "string" ? input : input instanceof Request ? input.url : input.toString();
    let fullUrl = url;
    let newInit = init;
    if (url.startsWith("/") && !url.startsWith("//")) {
      fullUrl = getBaseUrl() + url;
      const token = getAuthToken();
      if (token) {
        const prev = init?.headers;
        const next =
          prev instanceof Headers
            ? (() => {
                const h = new Headers(prev);
                h.set("Authorization", `Bearer ${token}`);
                return h;
              })()
            : prev && typeof prev === "object" && !(prev instanceof Headers)
              ? { ...(prev as Record<string, string>), Authorization: `Bearer ${token}` }
              : { Authorization: `Bearer ${token}` };
        newInit = { ...init, headers: next };
      }
      const request =
        typeof input === "string" ? fullUrl : input instanceof Request ? new Request(fullUrl, input) : fullUrl;
      return originalFetch.call(this, request, newInit).then((res) => {
        if (
          res.status === 401 &&
          fullUrl.includes("/api/") &&
          !fullUrl.includes("/api/auth/login") &&
          !fullUrl.includes("/api/auth/setup-status")
        ) {
          clearAuthToken();
          window.dispatchEvent(new CustomEvent("auth:401"));
        }
        return res;
      });
    }
    return originalFetch.call(this, input, init);
  };
} catch (e) {
  console.error("Fetch patch failed:", e);
}

const root = document.getElementById("root");
if (root) {
  const params = new URLSearchParams(window.location.search);
  const flyout = params.get("flyout");

  if (flyout === "profile") {
    ReactDOM.createRoot(root).render(
      <React.StrictMode>
        <ErrorBoundary>
          <AuthProvider>
            <ProfileFlyout />
          </AuthProvider>
        </ErrorBoundary>
      </React.StrictMode>
    );
  } else if (flyout === "profile-icon") {
    ReactDOM.createRoot(root).render(
      <React.StrictMode>
        <ErrorBoundary>
          <ProfileFlyoutIcon />
        </ErrorBoundary>
      </React.StrictMode>
    );
  } else {
    ReactDOM.createRoot(root).render(
      <React.StrictMode>
        <ErrorBoundary>
          <BrowserRouter>
            <AppWithProviders />
          </BrowserRouter>
        </ErrorBoundary>
      </React.StrictMode>
    );
  }
}
