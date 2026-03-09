# Desktop app: HTTPS backend support

## Summary

The desktop app can use **HTTPS** for the backend API as well as HTTP. You configure the backend address in the header "Backend" field (or BackendBar). You can enter either:

- **Host only** (unchanged): e.g. `127.0.0.1` or `localhost`  
  → App uses `http://<host>:3000`.
- **Full URL**: e.g. `https://localhost:3000` or `https://127.0.0.1:3443`  
  → App uses that URL as the base (no extra port appended).

## Implementation

- **`desktop/src/api.ts`**
  - `getBaseUrl()`: if the stored value contains `://`, it is treated as a full base URL (trailing slashes removed) and returned as-is; otherwise returns `http://<host>:3000`.
  - New helper: `isBackendFullUrl()` (exported) for any UI that needs to know if the stored value is a full URL.
- **UI**
  - AppHeader and BackendBar: placeholder set to `127.0.0.1 or https://...`; the `:3000` (or "Port: 3000") suffix is shown only when the current input does not contain `://`.

## Running the Next.js backend with HTTPS

To use HTTPS from the desktop, the Next.js backend must be served over HTTPS. For example:

- Use a reverse proxy (e.g. nginx, Caddy) with TLS in front of Next.js.
- Or run Next.js with a custom server that uses `https.createServer` and a certificate (e.g. self-signed for local dev).

Then in the desktop app set the backend field to e.g. `https://localhost:3000` (or the port your HTTPS server uses), Save, and Test.
