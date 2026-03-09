# Desktop app: connecting to backend on another machine

When the **Tailor backend** (Next.js) runs on one machine (e.g. `192.168.12.xx`) and the **desktop app** runs on another (e.g. `192.168.2.xx`), connection can fail for a few common reasons.

## 1. Server must listen on all interfaces

The Next.js server must accept connections from other machines, not only localhost.

- In this project, **dev** and **start** scripts are set to listen on **`0.0.0.0`**:
  - `next dev -H 0.0.0.0`
  - `next start -H 0.0.0.0`
- So when you run `npm run dev` or `npm run start` on the server machine, it should already be listening on all interfaces. If you run Next.js in another way, ensure it binds to `0.0.0.0` (or the server’s LAN IP), not only `127.0.0.1`.

## 2. Firewall on the server

The machine where the backend runs (e.g. `192.168.12.xx`) must allow **inbound TCP on port 3000** (or the port you use).

- **Windows:** Windows Defender Firewall (or other firewall) may block port 3000. Add an inbound rule to allow TCP port 3000.
- **Linux:** e.g. `sudo ufw allow 3000/tcp` then `ufw reload`, or equivalent for your firewall.

## 3. Network and IPs

- **Same subnet:** e.g. server `192.168.12.5`, desktop `192.168.12.10` — they can reach each other if the subnet mask includes both (e.g. `255.255.255.0` for `192.168.12.0/24`).
- **Different subnets:** e.g. server `192.168.12.5`, desktop `192.168.2.10` — they need a router (or routing) between `192.168.12.0/24` and `192.168.2.0/24`. Otherwise traffic won’t be routed.
- **Typo check:** Private range for `192.168.x.x` is **192.168.0.0 – 192.168.255.255**. So `192.169.2.xx` is outside that range (likely a typo for `192.168.2.xx`). Use the correct LAN IP on the desktop machine.

In the desktop app, set **Server** to the backend’s **LAN IP** (and port if not 3000), e.g. `192.168.12.5` or `http://192.168.12.5:3000`, then Save (app will reload and use the new URL).

## 4. How to test from the desktop machine

From the machine where the desktop app runs:

1. **Browser:** open `http://192.168.12.xx:3000/api/profiles` (replace with your server IP). You should get JSON or a 401, not “connection refused” or timeout.
2. **Command line:**  
   `curl -s -o /dev/null -w "%{http_code}" http://192.168.12.xx:3000/api/profiles`  
   You should see a status code (e.g. 200 or 401), not a connection error.

If this works but the desktop app still can’t get data, the issue is likely in the app (e.g. wrong Server URL or reload after Save). If this fails, fix network/firewall/listen address first.
