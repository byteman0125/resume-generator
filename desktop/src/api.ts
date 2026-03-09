/** Fixed port: same as Next.js backend (used when user enters only host, not full URL). */
export const BACKEND_PORT = 3000;

const STORAGE_KEY = "resume-builder-desktop-backend-ip";

export function getBackendIp(): string {
  if (typeof window === "undefined") return "127.0.0.1";
  return localStorage.getItem(STORAGE_KEY) || "127.0.0.1";
}

export function setBackendIp(ip: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, (ip || "127.0.0.1").trim());
}

/** True if the stored value is a full URL (http/https) rather than just a host. */
export function isBackendFullUrl(): boolean {
  const raw = getBackendIp().trim();
  return raw.includes("://");
}

export function getBaseUrl(): string {
  const raw = getBackendIp().trim() || "127.0.0.1";
  if (raw.includes("://")) {
    const base = raw.replace(/\/+$/, "");
    return base;
  }
  return `http://${raw}:${BACKEND_PORT}`;
}

/** URL for the content view (BrowserView). Adds ?embedded=1 so Next.js hides its header. */
export function getContentViewUrl(path: string = "/"): string {
  const base = getBaseUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  const sep = p.includes("?") ? "&" : "?";
  return `${base}${p}${sep}embedded=1`;
}

export async function apiFetch(
  path: string,
  options?: RequestInit
): Promise<Response> {
  const base = getBaseUrl();
  const url = path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
  const hasBody = options?.body != null;
  return fetch(url, {
    ...options,
    headers: {
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...options?.headers,
    },
  });
}

export async function apiJson<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await apiFetch(path, options);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}
