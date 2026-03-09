import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type Prompts = {
  summary: string;
  bulletsCurrent: string;
  bulletsLast: string;
  skills: string;
};

export function AIPage() {
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [draftApiKey, setDraftApiKey] = useState("");
  const [editingKey, setEditingKey] = useState(false);
  const [prompts, setPrompts] = useState<Prompts>({
    summary: "",
    bulletsCurrent: "",
    bulletsLast: "",
    skills: "",
  });
  const [draft, setDraft] = useState<Prompts>(prompts);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/ai/prompts");
        if (!res.ok) throw new Error("Failed to load prompts");
        const json = (await res.json()) as Prompts;
        if (!cancelled) {
          setPrompts(json);
          setDraft(json);
        }
      } catch {
        if (!cancelled) setError("Failed to load prompts");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const stored = window.localStorage.getItem("resume-builder-ai-api-key");
      if (stored) {
        setApiKey(stored);
        setDraftApiKey(stored);
      }
    } catch {}
  }, []);

  const persistApiKey = (value: string) => {
    const next = value.trim();
    if (!next) return;
    setApiKey(next);
    try {
      if (typeof window !== "undefined") window.localStorage.setItem("resume-builder-ai-api-key", next);
    } catch {}
  };

  const save = async () => {
    try {
      setSaving(true);
      setError(null);
      const res = await fetch("/api/ai/prompts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (!res.ok) throw new Error("Failed to save prompts");
      const json = (await res.json()) as Prompts;
      setPrompts(json);
      setDraft(json);
      setMode("view");
    } catch {
      setError("Failed to save prompts");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen container mx-auto px-4 py-6 space-y-6">
      <section className="max-w-xl space-y-3 rounded-md border bg-muted/10 p-3">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="ai-api-key" className="text-xs font-medium">API key</Label>
          <div className="flex items-center gap-1">
            {apiKey && !editingKey && <span className="text-[10px] text-muted-foreground">Saved</span>}
            {editingKey ? (
              <>
                <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={() => { setDraftApiKey(apiKey); setEditingKey(false); }}>Cancel</Button>
                <Button size="sm" className="h-6 px-2 text-[10px]" onClick={() => { persistApiKey(draftApiKey); setEditingKey(false); }} disabled={!draftApiKey.trim()}>Save key</Button>
              </>
            ) : (
              <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]" onClick={() => { setDraftApiKey(apiKey); setEditingKey(true); }}>Edit key</Button>
            )}
          </div>
        </div>
        <Input
          id="ai-api-key"
          type="password"
          placeholder="sk-********************************"
          className="max-w-md text-xs"
          value={editingKey ? draftApiKey : apiKey ? "••••••••••••••••" : ""}
          onChange={(e) => editingKey && setDraftApiKey(e.target.value)}
          onBlur={(e) => editingKey && (e.target as HTMLInputElement).value.trim() && persistApiKey((e.target as HTMLInputElement).value)}
          disabled={!editingKey}
        />
      </section>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <section className="max-w-5xl space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-muted-foreground">Prompts</p>
          {mode === "view" ? (
            <Button size="sm" variant="outline" onClick={() => { setDraft(prompts); setMode("edit"); setError(null); }} disabled={loading}>Edit prompts</Button>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={() => { setDraft(prompts); setMode("view"); }} disabled={saving}>Cancel</Button>
              <Button size="sm" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
            </>
          )}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {(["summary", "bulletsCurrent", "bulletsLast", "skills"] as const).map((field) => (
            <div key={field} className="space-y-2">
              <Label className="text-xs font-medium">{field}</Label>
              {mode === "view" ? (
                <div className="rounded border border-border bg-muted/20 px-2 py-1.5 text-xs whitespace-pre-wrap h-44 overflow-y-auto">
                  {(field === "summary" ? prompts.summary : field === "bulletsCurrent" ? prompts.bulletsCurrent : field === "bulletsLast" ? prompts.bulletsLast : prompts.skills) || <span className="text-muted-foreground">No prompt defined.</span>}
                </div>
              ) : (
                <Textarea
                  className="h-44 text-xs resize-none overflow-y-auto"
                  value={field === "summary" ? draft.summary : field === "bulletsCurrent" ? draft.bulletsCurrent : field === "bulletsLast" ? draft.bulletsLast : draft.skills}
                  onChange={(e) => setDraft((prev) => ({ ...prev, [field]: e.target.value }))}
                />
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
