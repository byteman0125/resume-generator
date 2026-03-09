import { useState, useEffect, useCallback } from "react";
import { getBackendIp, setBackendIp, getBaseUrl, BACKEND_PORT } from "../api";
import { Save } from "lucide-react";
import { cn } from "../lib/utils";

const SERVER_CHECK_INTERVAL_MS = 10_000;

type Props = { onSave?: () => void };

export function BackendBar({ onSave }: Props) {
  const [ip, setIp] = useState("");
  const [saved, setSaved] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    setIp(getBackendIp());
  }, []);

  const checkServer = useCallback(async () => {
    try {
      const base = getBaseUrl();
      const res = await fetch(`${base}/api/profiles`, { method: "GET" });
      setConnected(res.ok);
    } catch {
      setConnected(false);
    }
  }, []);

  useEffect(() => {
    checkServer();
    const id = setInterval(checkServer, SERVER_CHECK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [checkServer]);

  const handleSave = () => {
    const trimmed = ip.trim() || "127.0.0.1";
    const prev = getBackendIp().trim() || "127.0.0.1";
    setBackendIp(trimmed);
    setSaved(true);
    checkServer();
    onSave?.();
    setTimeout(() => setSaved(false), 2000);
    if (prev !== trimmed) {
      setTimeout(() => window.location.reload(), 600);
    }
  };

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-slate-800 text-slate-100 border-b border-slate-600">
      <span className="text-sm font-medium whitespace-nowrap">Server:</span>
      <input
        type="text"
        value={ip}
        onChange={(e) => setIp(e.target.value)}
        placeholder="127.0.0.1 or https://..."
        className="px-2 py-1 rounded bg-slate-700 border border-slate-600 text-sm w-48 font-mono"
        onKeyDown={(e) => e.key === "Enter" && handleSave()}
      />
      {!ip.trim().includes("://") && <span className="text-slate-400 text-sm">Port: {BACKEND_PORT}</span>}
      <button
        type="button"
        onClick={handleSave}
        className="flex items-center gap-1 px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-sm"
      >
        {saved ? "Saved" : <><Save className="w-3.5 h-3.5" /> Save</>}
      </button>
      <span
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-600"
        title={connected ? "Connected" : "Disconnected"}
        aria-label={connected ? "Server connected" : "Server disconnected"}
      >
        <span
          className={cn(
            "h-2 w-2 rounded-full",
            connected ? "bg-emerald-400" : "bg-slate-500"
          )}
        />
      </span>
    </div>
  );
}
