import { useState, useEffect, useCallback } from "react";
import { NavLink } from "react-router-dom";
import { Briefcase, User, FileText, Sparkles, Sun, Moon, Save } from "lucide-react";
import { getBackendIp, setBackendIp, getBaseUrl, BACKEND_PORT } from "../api";
import { cn } from "../lib/utils";

const SERVER_CHECK_INTERVAL_MS = 10_000;

const THEME_KEY = "resume-builder-desktop-theme";

function useTheme() {
  const [theme, setThemeState] = useState<"light" | "dark">("light");
  useEffect(() => {
    const stored = (localStorage.getItem(THEME_KEY) || "light") as "light" | "dark";
    setThemeState(stored);
    document.documentElement.classList.toggle("dark", stored === "dark");
  }, []);
  const setTheme = (v: "light" | "dark") => {
    setThemeState(v);
    localStorage.setItem(THEME_KEY, v);
    document.documentElement.classList.toggle("dark", v === "dark");
  };
  return { theme, setTheme };
}

type NavItem = { path: string; label: string; icon: React.ReactNode };

export function AppHeader() {
  const { theme, setTheme } = useTheme();
  const [ip, setIp] = useState("");
  const [saved, setSaved] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    setIp(getBackendIp());
  }, []);

  const checkServer = useCallback(async () => {
    try {
      const res = await fetch(`${getBaseUrl()}/api/profiles`, { method: "GET" });
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
    setTimeout(() => setSaved(false), 2000);
    // Reload so all data (profiles, applications) is fetched from the new server
    if (prev !== trimmed) {
      setTimeout(() => window.location.reload(), 600);
    }
  };

  const navItems: NavItem[] = [
    { path: "/profile", label: "Profile", icon: <User className="h-4 w-4" /> },
    { path: "/template/format1", label: "Templates", icon: <FileText className="h-4 w-4" /> },
    { path: "/ai", label: "AI", icon: <Sparkles className="h-4 w-4" /> },
    { path: "/applications", label: "Application", icon: <Briefcase className="h-4 w-4" /> },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center px-4 gap-4">
        <NavLink
          to="/"
          className={({ isActive }) =>
            cn(
              "mr-2 flex items-center gap-2 font-semibold transition-colors hover:text-primary",
              isActive ? "text-foreground" : "text-muted-foreground"
            )
          }
        >
          <Briefcase className="h-5 w-5" />
          <span className="hidden sm:inline">Tailor</span>
        </NavLink>
        <div className="flex flex-1 items-center gap-1">
          {navItems.map(({ path, label, icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === "/applications"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )
              }
            >
              {icon}
              {label}
            </NavLink>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <span className="text-muted-foreground text-xs">Server</span>
          <input
            type="text"
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            placeholder="127.0.0.1 or https://..."
            className="h-8 min-w-[8rem] max-w-[14rem] rounded-md border border-input bg-background px-2 text-sm font-mono"
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
          {!ip.trim().includes("://") && <span className="text-muted-foreground text-xs">:{BACKEND_PORT}</span>}
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex h-8 items-center gap-1 rounded-md bg-primary px-3 text-sm text-primary-foreground hover:bg-primary/90"
          >
            {saved ? "Saved" : <><Save className="h-3.5 w-3.5" /> Save</>}
          </button>
          <span
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border"
            title={connected ? "Connected" : "Disconnected"}
            aria-label={connected ? "Server connected" : "Server disconnected"}
          >
            <span
              className={cn(
                "h-2.5 w-2.5 rounded-full",
                connected ? "bg-green-500 dark:bg-green-400" : "bg-muted-foreground/50"
              )}
            />
          </span>
        </div>
      </div>
    </nav>
  );
}
