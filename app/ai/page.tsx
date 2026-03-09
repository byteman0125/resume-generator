"use client";

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

function findMissingTokens(value: string, tokens: string[]): string[] {
  if (!value) return tokens;
  return tokens.filter((t) => !value.includes(t));
}

export default function AiPage() {
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>("");
  const [draftApiKey, setDraftApiKey] = useState<string>("");
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
      } catch (e) {
        if (!cancelled) setError("Failed to load prompts");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Load stored API key from localStorage on mount so it persists across refresh.
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const stored = window.localStorage.getItem("resume-builder-ai-api-key");
      if (stored) {
        setApiKey(stored);
        setDraftApiKey(stored);
      }
    } catch {
      // ignore
    }
  }, []);

  const persistApiKey = (value: string) => {
    const next = value.trim();
    if (!next) return;
    setApiKey(next);
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem("resume-builder-ai-api-key", next);
      }
    } catch {
      // ignore
    }
  };

  const startEdit = () => {
    setDraft(prompts);
    setDraftApiKey(apiKey);
    setMode("edit");
    setError(null);
  };

  const cancelEdit = () => {
    setDraft(prompts);
    setDraftApiKey(apiKey);
    setMode("view");
    setError(null);
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
    } catch (e) {
      setError("Failed to save prompts");
    } finally {
      setSaving(false);
    }
  };

  const onChangeField = (field: keyof Prompts, value: string) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const renderText = (value: string) => (
    <div className="rounded border border-border bg-muted/20 px-2 py-1.5 text-xs whitespace-pre-wrap h-44 overflow-y-auto">
      {value || <span className="text-muted-foreground">No prompt defined yet.</span>}
    </div>
  );

  return (
    <div className="min-h-screen container mx-auto px-4 py-6 space-y-6">
      {/* API key section */}
      <section className="max-w-xl mx-auto space-y-3 rounded-md border bg-muted/10 p-3">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="ai-api-key" className="text-xs font-medium">
            API key
          </Label>
          <div className="flex items-center gap-1">
            {apiKey && !editingKey && (
              <span className="text-[10px] text-muted-foreground">Saved</span>
            )}
            {editingKey ? (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-[10px]"
                  onClick={() => {
                    setDraftApiKey(apiKey);
                    setEditingKey(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-6 px-2 text-[10px]"
                  onClick={() => {
                    persistApiKey(draftApiKey);
                    setEditingKey(false);
                  }}
                  disabled={!draftApiKey.trim()}
                >
                  Save key
                </Button>
              </>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-6 px-2 text-[10px]"
                onClick={() => {
                  setDraftApiKey(apiKey);
                  setEditingKey(true);
                }}
              >
                Edit key
              </Button>
            )}
          </div>
        </div>
        <Input
          id="ai-api-key"
          type="password"
          placeholder="sk-********************************"
          className="max-w-md text-xs"
          value={editingKey ? draftApiKey : apiKey ? "••••••••••••••••" : ""}
          onChange={(e) => {
            if (!editingKey) return;
            setDraftApiKey(e.target.value);
          }}
          onBlur={(e) => {
            if (!editingKey) return;
            const value = (e.target as HTMLInputElement).value;
            if (value.trim()) persistApiKey(value);
          }}
          disabled={!editingKey}
        />
      </section>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {/* Prompts section */}
      <section className="max-w-5xl mx-auto space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-muted-foreground">Prompts</p>
          <div className="flex items-center gap-2">
            {mode === "view" ? (
              <Button size="sm" variant="outline" onClick={startEdit} disabled={loading}>
                Edit prompts
              </Button>
            ) : (
              <>
                <Button size="sm" variant="outline" onClick={cancelEdit} disabled={saving}>
                  Cancel
                </Button>
                <Button size="sm" onClick={save} disabled={saving}>
                  {saving ? "Saving…" : "Save"}
                </Button>
              </>
            )}
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="summary-prompt" className="text-xs font-medium">
            Summary prompt
          </Label>
          {mode === "view"
            ? renderText(prompts.summary)
            : (
            <Textarea
              id="summary-prompt"
              className="h-44 text-xs resize-none overflow-y-auto"
              value={draft.summary}
              onChange={(e) => onChangeField("summary", e.target.value)}
            />
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="bullets-current-prompt" className="text-xs font-medium">
            Bullet prompt – current company
          </Label>
          {mode === "view"
            ? renderText(prompts.bulletsCurrent)
            : (
            <Textarea
              id="bullets-current-prompt"
              className="h-44 text-xs resize-none overflow-y-auto"
              value={draft.bulletsCurrent}
              onChange={(e) => onChangeField("bulletsCurrent", e.target.value)}
            />
          )}
          {(() => {
            const missing = findMissingTokens(
              mode === "view" ? prompts.bulletsCurrent : draft.bulletsCurrent,
              ["{{company}}", "{{job_description}}"]
            );
            if (!missing.length) return null;
            return (
              <p className="text-[11px] text-amber-600">
                Recommended tokens missing: {missing.join(", ")}
              </p>
            );
          })()}
        </div>

        <div className="space-y-2">
          <Label htmlFor="bullets-last-prompt" className="text-xs font-medium">
            Bullet prompt – last company
          </Label>
          {mode === "view"
            ? renderText(prompts.bulletsLast)
            : (
            <Textarea
              id="bullets-last-prompt"
              className="h-44 text-xs resize-none overflow-y-auto"
              value={draft.bulletsLast}
              onChange={(e) => onChangeField("bulletsLast", e.target.value)}
            />
          )}
          {(() => {
            const missing = findMissingTokens(
              mode === "view" ? prompts.bulletsLast : draft.bulletsLast,
              ["{{company}}"]
            );
            if (!missing.length) return null;
            return (
              <p className="text-[11px] text-amber-600">
                Recommended tokens missing: {missing.join(", ")}
              </p>
            );
          })()}
        </div>

        <div className="space-y-2">
          <Label htmlFor="skills-prompt" className="text-xs font-medium">
            Skill set prompt
          </Label>
          {mode === "view"
            ? renderText(prompts.skills)
            : (
            <Textarea
              id="skills-prompt"
              className="h-44 text-xs resize-none overflow-y-auto"
              value={draft.skills}
              onChange={(e) => onChangeField("skills", e.target.value)}
            />
          )}
        </div>
        </div>
      </section>
    </div>
  );
}


