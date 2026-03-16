import React, { useEffect, useState, useCallback, useRef } from "react";
import { User, Mail, MapPin, Phone, Briefcase, GraduationCap, Calendar, Linkedin, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

const STORAGE_KEY = "desktop-profile-flyout-current-profile";

type FlyoutProfileSummary = {
  id: string;
  profileName: string;
  title?: string;
  email?: string;
  phone?: string;
  location?: string;
  company?: string;
  updatedAt?: number;
};

/** Profile list item from GET /api/profiles (role-filtered). Matches profileSummary from API. */
type ApiProfileItem = {
  id: string;
  name: string;
  title?: string;
  email?: string;
  phone?: string;
  location?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  birthday?: string;
  linkedin?: string;
  experience?: { company: string; period: string }[];
  education?: { school: string; degree: string }[];
};

function parseSummary(obj: unknown): FlyoutProfileSummary | null {
  if (!obj || typeof obj !== "object") return null;
  const o = obj as Partial<FlyoutProfileSummary>;
  if (!o.id || !o.profileName) return null;
  return {
    id: String(o.id),
    profileName: String(o.profileName),
    title: o.title ? String(o.title) : "",
    email: o.email ? String(o.email) : "",
    phone: o.phone ? String(o.phone) : "",
    location: o.location ? String(o.location) : "",
    company: o.company ? String(o.company) : "",
    updatedAt: typeof o.updatedAt === "number" ? o.updatedAt : undefined,
  };
}

function readSummaryFromStorage(): FlyoutProfileSummary | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return parseSummary(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

function useFlyoutSummary() {
  const [summary, setSummary] = useState<FlyoutProfileSummary | null>(() => readSummaryFromStorage());
  const electron = (window as unknown as { electron?: { getProfileFlyoutSummary?: () => Promise<unknown>; onProfileFlyoutSummary?: (cb: (s: unknown) => void) => () => void } }).electron;

  useEffect(() => {
    if (electron?.getProfileFlyoutSummary) {
      let cancelled = false;
      const refresh = () => {
        electron.getProfileFlyoutSummary!().then((s) => {
          if (!cancelled) setSummary(parseSummary(s));
        }).catch(() => {});
      };
      refresh();
      const id = window.setInterval(refresh, 2000);
      const unsub = electron.onProfileFlyoutSummary?.( (s) => {
        if (!cancelled) setSummary(parseSummary(s));
      });
      return () => {
        cancelled = true;
        window.clearInterval(id);
        unsub?.();
      };
    }
    const handleStorage = (e: StorageEvent) => {
      if (e.key && e.key !== STORAGE_KEY) return;
      setSummary(readSummaryFromStorage());
    };
    window.addEventListener("storage", handleStorage);
    const id = window.setInterval(() => setSummary(readSummaryFromStorage()), 5000);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.clearInterval(id);
    };
  }, [electron?.getProfileFlyoutSummary, electron?.onProfileFlyoutSummary]);

  return summary;
}

/** Fetch role-filtered profiles for flyout; first profile = first by role permission. */
function useFlyoutProfiles(): {
  profiles: ApiProfileItem[];
  loading: boolean;
  error: string | null;
  auth: { baseUrl: string; token: string | null } | null;
} {
  const [auth, setAuth] = useState<{ baseUrl: string; token: string | null } | null>(null);
  const [profiles, setProfiles] = useState<ApiProfileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const electron = (window as unknown as { electron?: { getAuthForFlyout?: () => Promise<{ baseUrl?: string; token?: string | null }> } }).electron;

  useEffect(() => {
    if (!electron?.getAuthForFlyout) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    electron.getAuthForFlyout().then((a) => {
      if (cancelled) return;
      const baseUrl = (a?.baseUrl ?? "").trim();
      const token = a?.token ?? null;
      setAuth(baseUrl && token ? { baseUrl, token } : null);
      if (!baseUrl || !token) {
        setProfiles([]);
        setLoading(false);
        return;
      }
      const url = `${baseUrl.replace(/\/$/, "")}/api/profiles`;
      fetch(url, { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => {
          if (cancelled) return res;
          if (!res.ok) throw new Error("Failed to load profiles");
          return res.json();
        })
        .then((list: unknown) => {
          if (cancelled) return;
          const arr = Array.isArray(list) ? list : [];
          setProfiles(
            arr.map((p: Record<string, unknown>) => ({
              id: String(p.id ?? ""),
              name: String(p.name ?? ""),
              title: p.title != null ? String(p.title) : undefined,
              email: p.email != null ? String(p.email) : undefined,
              phone: p.phone != null ? String(p.phone) : undefined,
              location: p.location != null ? String(p.location) : undefined,
              address: p.address != null ? String(p.address) : undefined,
              city: p.city != null ? String(p.city) : undefined,
              state: p.state != null ? String(p.state) : undefined,
              postalCode: p.postalCode != null ? String(p.postalCode) : undefined,
              birthday: p.birthday != null ? String(p.birthday) : undefined,
              linkedin: p.linkedin != null ? String(p.linkedin) : undefined,
              experience: Array.isArray(p.experience)
                ? (p.experience as { company?: string; period?: string }[]).map((e) => ({
                    company: (e.company ?? "").trim() || "—",
                    period: (e.period ?? "").trim() || "—",
                  }))
                : undefined,
              education: Array.isArray(p.education)
                ? (p.education as { school?: string; degree?: string }[]).map((e) => ({
                    school: (e.school ?? "").trim() || "—",
                    degree: (e.degree ?? "").trim() || "—",
                  }))
                : undefined,
            }))
          );
          setError(null);
        })
        .catch((e) => {
          if (!cancelled) {
            setError(e instanceof Error ? e.message : "Failed to load");
            setProfiles([]);
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [electron?.getAuthForFlyout]);

  return { profiles, loading, error, auth };
}

function writeClipboard(text: string) {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (!trimmed) return;
  const anyWindow = window as unknown as {
    electron?: { writeClipboardText?: (t: string) => Promise<unknown> | unknown };
  };
  const electron = anyWindow.electron;
  if (electron?.writeClipboardText) {
    try {
      const maybePromise = electron.writeClipboardText(trimmed);
      if (maybePromise && typeof (maybePromise as Promise<unknown>).then === "function") {
        (maybePromise as Promise<unknown>).catch(() => {});
      }
      return;
    } catch {
      // fall through to navigator.clipboard
    }
  }
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(trimmed).catch(() => {});
  } else {
    try {
      const ta = document.createElement("textarea");
      ta.value = trimmed;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    } catch {
      // ignore
    }
  }
}

/** Same as ProfilePage: click-to-copy line with green dot when copied. */
function CopyableLine({
  text,
  copyKey,
  copiedKey,
  onCopy,
  className,
}: {
  text: string;
  copyKey: string;
  copiedKey: string | null;
  onCopy: (text: string, key: string) => void;
  className?: string;
}) {
  const oneLine = text.replace(/\s+/g, " ").trim();
  if (!oneLine) return null;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        writeClipboard(oneLine);
        onCopy(oneLine, copyKey);
      }}
      className={cn(
        "w-full text-left rounded-md px-2 py-1 -mx-2 hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground",
        className
      )}
      title="Click to copy"
    >
      {oneLine}
      {copiedKey === copyKey && (
        <span className="inline-block w-2 h-2 rounded-full bg-green-500 ml-1.5 shrink-0" aria-hidden />
      )}
    </button>
  );
}

export function ProfileFlyout() {
  const { profiles, loading, error, auth } = useFlyoutProfiles();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const selectedProfile = selectedId ? profiles.find((p) => p.id === selectedId) : profiles[0] ?? null;

  useEffect(() => {
    if (profiles.length > 0 && selectedId === null) setSelectedId(profiles[0].id);
    if (profiles.length > 0 && selectedId && !profiles.some((p) => p.id === selectedId)) setSelectedId(profiles[0].id);
  }, [profiles, selectedId]);

  const handleCopy = useCallback((_text: string, key: string) => {
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey((prev) => (prev === key ? null : prev)), 1500);
  }, []);

  const electron = (window as unknown as { electron?: { setProfileFlyoutHover?: (hovering: boolean) => Promise<unknown> | unknown } }).electron;
  const notifyHover = (hovering: boolean) => {
    if (!electron?.setProfileFlyoutHover) return;
    try {
      const maybePromise = electron.setProfileFlyoutHover(hovering);
      if (maybePromise && typeof (maybePromise as Promise<unknown>).then === "function") (maybePromise as Promise<unknown>).catch(() => {});
    } catch {}
  };

  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.body.style.background = "transparent";
    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.background = "transparent";
    const root = document.getElementById("root");
    if (root) {
      root.style.overflow = "hidden";
      root.style.height = "100%";
      root.style.background = "transparent";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.background = "";
      document.documentElement.style.overflow = "";
      document.documentElement.style.background = "";
      if (root) {
        root.style.overflow = "";
        root.style.height = "";
        root.style.background = "";
      }
    };
  }, []);

  const wrapper = (content: React.ReactNode) => (
    <div className="overflow-hidden h-full bg-transparent" onMouseEnter={() => notifyHover(true)} onMouseLeave={() => notifyHover(false)}>
      {content}
    </div>
  );

  if (loading && profiles.length === 0) {
    return wrapper(
      <Card className="min-w-[240px] max-w-sm rounded-xl border-2 border-primary/25 bg-card shadow-md">
        <CardContent className="p-4 text-sm text-muted-foreground">
          <p className="font-medium">Profile flyout</p>
          <p className="text-xs mt-1">Loading…</p>
        </CardContent>
      </Card>
    );
  }

  if (!auth?.token) {
    return wrapper(
      <Card className="min-w-[240px] max-w-sm rounded-xl border-2 border-primary/25 bg-card shadow-md">
        <CardContent className="p-4 text-sm text-muted-foreground">
          <p className="font-medium">Profile flyout</p>
          <p className="text-xs mt-1">Sign in in the main app to choose a profile.</p>
        </CardContent>
      </Card>
    );
  }

  if (error || profiles.length === 0) {
    return wrapper(
      <Card className="min-w-[240px] max-w-sm rounded-xl border-2 border-primary/25 bg-card shadow-md">
        <CardContent className="p-4 text-sm text-muted-foreground">
          <p className="font-medium">Profile flyout</p>
          <p className="text-xs mt-1">{error || "No profiles available for your role."}</p>
        </CardContent>
      </Card>
    );
  }

  const p = selectedProfile!;
  const copyKeyPrefix = `flyout-${p.id}`;

  return wrapper(
    <Card className={cn("min-w-[260px] max-w-sm flex flex-col rounded-xl border-2 border-primary/25 bg-card shadow-md hover:shadow-lg transition-all duration-200")}>
      <div className="flex items-start gap-2 p-4 pb-2">
        <select
          value={selectedId ?? ""}
          onChange={(e) => setSelectedId(e.target.value || null)}
          className="shrink-0 rounded-md border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring max-w-[140px]"
          aria-label="Choose profile"
        >
          {profiles.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.name || profile.id}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => {
            writeClipboard(p.name || "Untitled");
            handleCopy(p.name || "Untitled", `${copyKeyPrefix}-name`);
          }}
          className="flex-1 min-w-0 text-left rounded-md px-2 py-1 -mx-2 -my-1 hover:bg-muted/60 transition-colors"
          title="Click to copy"
        >
          <h3 className="text-base font-semibold text-foreground break-words leading-tight">
            {p.name || "Untitled"}
          </h3>
          {copiedKey === `${copyKeyPrefix}-name` && (
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 ml-1.5 shrink-0" aria-hidden />
          )}
        </button>
      </div>
      <div className="flex-1 px-4 pb-4 text-xs min-h-0 overflow-hidden">
        <div className="space-y-2">
          {p.email && (
            <div className="flex items-center gap-1.5 min-w-0">
              <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <CopyableLine
                text={p.email}
                copyKey={`${copyKeyPrefix}-email`}
                copiedKey={copiedKey}
                onCopy={handleCopy}
                className="truncate flex-1 min-w-0"
              />
            </div>
          )}
          {(p.address || p.city || p.state || p.postalCode) && (
            <div className="flex items-start gap-1.5 min-w-0">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground mt-0.5" />
              <p className="flex flex-wrap gap-x-1 gap-y-0.5 items-baseline flex-1 min-w-0">
                {p.address && (
                  <>
                    <CopyableLine text={p.address} copyKey={`${copyKeyPrefix}-address`} copiedKey={copiedKey} onCopy={handleCopy} className="inline-block w-auto max-w-full truncate" />
                    {(p.city || p.state || p.postalCode) && <span className="text-muted-foreground/70">,</span>}
                  </>
                )}
                {p.city && (
                  <>
                    <CopyableLine text={p.city} copyKey={`${copyKeyPrefix}-city`} copiedKey={copiedKey} onCopy={handleCopy} className="inline-block w-auto max-w-full truncate" />
                    {(p.state || p.postalCode) && <span className="text-muted-foreground/70">,</span>}
                  </>
                )}
                {p.state && (
                  <>
                    <CopyableLine text={p.state} copyKey={`${copyKeyPrefix}-state`} copiedKey={copiedKey} onCopy={handleCopy} className="inline-block w-auto max-w-full truncate" />
                    {p.postalCode && <span className="text-muted-foreground/70">,</span>}
                  </>
                )}
                {p.postalCode && (
                  <CopyableLine text={p.postalCode} copyKey={`${copyKeyPrefix}-postalCode`} copiedKey={copiedKey} onCopy={handleCopy} className="inline-block w-auto max-w-full truncate" />
                )}
              </p>
            </div>
          )}
          {(p.phone || p.birthday) && (
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 min-w-0">
              {p.phone && (
                <>
                  <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <CopyableLine text={p.phone} copyKey={`${copyKeyPrefix}-phone`} copiedKey={copiedKey} onCopy={handleCopy} className="inline-block w-auto max-w-full" />
                  {p.birthday && <span className="text-muted-foreground/70">,</span>}
                </>
              )}
              {p.birthday && (
                <>
                  <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <CopyableLine text={p.birthday} copyKey={`${copyKeyPrefix}-birthday`} copiedKey={copiedKey} onCopy={handleCopy} className="inline-block w-auto max-w-full" />
                </>
              )}
            </div>
          )}
          {p.linkedin && (
            <div className="flex items-center gap-1.5 min-w-0">
              <Linkedin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <a
                href={p.linkedin.startsWith("http") ? p.linkedin : `https://${p.linkedin}`}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-primary hover:underline flex-1 min-w-0"
                onClick={(e) => e.stopPropagation()}
              >
                LinkedIn
              </a>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  writeClipboard(p.linkedin!);
                  handleCopy(p.linkedin!, `${copyKeyPrefix}-linkedin`);
                }}
                className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted/60"
                title="Copy LinkedIn URL"
              >
                {copiedKey === `${copyKeyPrefix}-linkedin` ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          )}
        </div>
        <div className="mt-3 pt-3 border-t border-border/60">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1.5">
            <Briefcase className="h-3 w-3" />
            Career
          </p>
          {p.experience?.length ? (
            <ul className="space-y-0.5">
              {p.experience.slice(0, 3).map((exp, i) => (
                <li key={i} className="flex flex-wrap items-baseline gap-x-1 min-w-0">
                  <CopyableLine text={exp.company} copyKey={`${copyKeyPrefix}-exp-${i}-company`} copiedKey={copiedKey} onCopy={handleCopy} className="truncate max-w-full" />
                  {exp.period && (
                    <>
                      <span className="text-muted-foreground/70 shrink-0">·</span>
                      <CopyableLine text={exp.period} copyKey={`${copyKeyPrefix}-exp-${i}-period`} copiedKey={copiedKey} onCopy={handleCopy} className="truncate max-w-full" />
                    </>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground/70 px-2">—</p>
          )}
        </div>
        <div className="mt-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1.5">
            <GraduationCap className="h-3 w-3" />
            Education
          </p>
          {p.education?.length ? (
            <ul className="space-y-0.5">
              {p.education.slice(0, 2).map((ed, i) => (
                <li key={i} className="flex flex-wrap items-baseline gap-x-1 min-w-0">
                  <CopyableLine text={ed.school} copyKey={`${copyKeyPrefix}-ed-${i}-school`} copiedKey={copiedKey} onCopy={handleCopy} className="truncate max-w-full" />
                  {ed.degree && (
                    <>
                      <span className="text-muted-foreground/70 shrink-0">·</span>
                      <CopyableLine text={ed.degree} copyKey={`${copyKeyPrefix}-ed-${i}-degree`} copiedKey={copiedKey} onCopy={handleCopy} className="truncate max-w-full" />
                    </>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground/70 px-2">—</p>
          )}
        </div>
      </div>
    </Card>
  );
}

const LEAVE_CLOSE_DELAY_MS = 200;

export function ProfileFlyoutIcon() {
  const anyWindow = window as unknown as {
    electron?: {
      setProfileFlyoutHover?: (hovering: boolean) => Promise<unknown> | unknown;
      onProfileFlyoutClosed?: (cb: () => void) => () => void;
      onProfileFlyoutCancelClose?: (cb: () => void) => () => void;
    };
  };
  const electron = anyWindow.electron;
  const leaveCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [open, setOpen] = useState(false);

  const clearLeaveCloseTimer = useCallback(() => {
    if (leaveCloseTimerRef.current != null) {
      clearTimeout(leaveCloseTimerRef.current);
      leaveCloseTimerRef.current = null;
    }
  }, []);

  const showFlyout = () => {
    clearLeaveCloseTimer();
    if (open || !electron?.setProfileFlyoutHover) return;
    setOpen(true);
    try {
      const maybePromise = electron.setProfileFlyoutHover(true);
      if (maybePromise && typeof (maybePromise as Promise<unknown>).then === "function") {
        (maybePromise as Promise<unknown>).catch(() => {});
      }
    } catch {
      // ignore
    }
  };

  const hideFlyout = useCallback(() => {
    setOpen(false);
    if (!electron?.setProfileFlyoutHover) return;
    try {
      const maybePromise = electron.setProfileFlyoutHover(false);
      if (maybePromise && typeof (maybePromise as Promise<unknown>).then === "function") {
        (maybePromise as Promise<unknown>).catch(() => {});
      }
    } catch {
      // ignore
    }
  }, [electron?.setProfileFlyoutHover]);

  const toggle = () => {
    clearLeaveCloseTimer();
    const next = !open;
    setOpen(next);
    if (!electron?.setProfileFlyoutHover) return;
    try {
      const maybePromise = electron.setProfileFlyoutHover(next);
      if (maybePromise && typeof (maybePromise as Promise<unknown>).then === "function") {
        (maybePromise as Promise<unknown>).catch(() => {});
      }
    } catch {
      // ignore
    }
  };

  const onButtonMouseLeave = () => {
    leaveCloseTimerRef.current = setTimeout(() => {
      leaveCloseTimerRef.current = null;
      hideFlyout();
    }, LEAVE_CLOSE_DELAY_MS);
  };

  useEffect(() => {
    const unsubscribe = electron?.onProfileFlyoutClosed?.(() => {
      clearLeaveCloseTimer();
      setOpen(false);
    });
    return () => unsubscribe?.();
  }, [clearLeaveCloseTimer, electron?.onProfileFlyoutClosed]);

  useEffect(() => {
    const unsubscribe = electron?.onProfileFlyoutCancelClose?.(() => clearLeaveCloseTimer());
    return () => {
      clearLeaveCloseTimer();
      unsubscribe?.();
    };
  }, [clearLeaveCloseTimer, electron?.onProfileFlyoutCancelClose]);

  useEffect(() => {
    try {
      document.body.style.background = "transparent";
      const html = document.documentElement as HTMLElement | null;
      if (html) html.style.background = "transparent";
    } catch {
      // ignore
    }
  }, []);

  return (
    <div
      className="w-full h-full min-w-[48px] min-h-[48px] flex items-center justify-center"
      style={{ background: "transparent", WebkitAppRegion: "drag" } as React.CSSProperties}
      title="Profile flyout"
      aria-label="Profile flyout"
    >
      <button
        type="button"
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        className={cn(
          "w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center cursor-pointer",
          "shadow-md hover:shadow-lg hover:scale-105",
          "transition-all duration-200 ease-out",
          "hover:ring-2 hover:ring-primary-foreground/30 hover:ring-offset-2 hover:ring-offset-transparent"
        )}
        onMouseEnter={showFlyout}
        onMouseLeave={onButtonMouseLeave}
        onClick={toggle}
      >
        <User className="h-4 w-4" />
      </button>
    </div>
  );
}

