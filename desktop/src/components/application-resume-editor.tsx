"use client";

import { useRef } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { ResumeData } from "@/lib/resume-store";
import { cn } from "@/lib/utils";

/** Split pasted text into one bullet per sentence (by period). Avoids splitting numbers like 99.99 or sub-10ms. */
function splitPasteIntoBullets(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return text;
  const parts = trimmed.split(/\.\s*\r?\n|\.\s*(?=[A-Z])/);
  const lines = parts
    .map((p) => {
      const s = p.trim();
      if (!s) return "";
      return s.endsWith(".") ? s : s + ".";
    })
    .filter(Boolean);
  return lines.join("\n");
}

/** Convert pasted HTML bold (<b>, <strong>) to ** only for real bold segments, not when the whole paste is wrapped in one tag. */
function htmlToBoldMarkdown(html: string): string {
  const div = document.createElement("div");
  div.innerHTML = html;
  const fullText = (div.textContent ?? "").trim();
  const fullLen = fullText.length;
  function visit(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
    if (node.nodeType !== Node.ELEMENT_NODE) return "";
    const el = node as HTMLElement;
    const tag = el.tagName?.toLowerCase();
    const inner = Array.from(node.childNodes).map(visit).join("");
    if (tag === "b" || tag === "strong") {
      const innerTrim = inner.trim();
      if (fullLen > 0 && innerTrim.length >= fullLen * 0.9) return inner;
      return "**" + inner + "**";
    }
    return inner;
  }
  return Array.from(div.childNodes).map(visit).join("");
}

/** Split pasted text into one line per newline (for Skills: one bullet per line). */
function splitPasteIntoLines(text: string): string {
  return text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .join("\n");
}

function BulletTextArea({
  label,
  value,
  onChange,
  placeholder = "Bullets, one per line...",
  pasteMode = "bullets",
  className,
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** "bullets" = split by sentence (period); "lines" = split by newline only (e.g. Skills) */
  pasteMode?: "bullets" | "lines";
  className?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const html = e.clipboardData.getData("text/html");
    const plainClip = e.clipboardData.getData("text/plain");
    const hasHtml = html && html.trim().length > 0;
    // For "lines" mode (e.g. Skills) always use plain text so newlines are preserved;
    // HTML parsing (e.g. <p> per line) would collapse to one line.
    const text =
      pasteMode === "lines"
        ? plainClip
        : hasHtml
          ? htmlToBoldMarkdown(html)
          : plainClip;
    if (!text.trim()) return;
    e.preventDefault();
    const bullets =
      pasteMode === "lines" ? splitPasteIntoLines(text) : splitPasteIntoBullets(text);
    const ta = ref.current;
    if (ta) {
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const next = value.slice(0, start) + bullets + value.slice(end);
      onChange(next);
      const newPos = start + bullets.length;
      requestAnimationFrame(() => {
        ta.setSelectionRange(newPos, newPos);
      });
    } else {
      onChange(value + bullets);
    }
  };

  return (
    <div className={cn(label && label.trim() ? "space-y-0.5" : "", className)}>
      {label && label.trim() ? (
        <Label className="text-xs font-medium">{label}</Label>
      ) : null}
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onPaste={handlePaste}
        placeholder={placeholder}
        className="h-[4.5rem] w-full resize-none overflow-y-auto rounded border border-input bg-background px-2 py-1.5 text-[10px] font-mono leading-snug focus:outline-none focus:ring-1 focus:ring-ring focus:ring-offset-1"
        spellCheck={false}
      />
    </div>
  );
}

export interface ApplicationResumeEditorProps {
  data: ResumeData;
  onSummaryChange?: (value: string) => void;
  /** Raw string (one skill per line); parent parses and sets data.skills */
  onSkillsChange?: (value: string) => void;
  onExperienceDescriptionChange: (expId: string, description: string) => void;
  /** Optional: allow editing role/title per experience (per company) in the modal. */
  onExperienceRoleChange?: (expId: string, role: string) => void;
  /** Optional: visually highlight a target area when a prompt button is used. */
  highlightTarget?: "summary" | "currentCompany" | "lastCompany" | "skills";
  className?: string;
}

/**
 * Dedicated editor for tailoring resume content in the application modal.
 * Summary, skills (one per line), and experience bullets.
 */
export function ApplicationResumeEditor({
  data,
  onSummaryChange,
  onSkillsChange,
  onExperienceDescriptionChange,
  onExperienceRoleChange,
  highlightTarget,
  className,
}: ApplicationResumeEditorProps) {
  const { profile, skills, experience } = data;
  const skillsText = (() => {
    const list = skills ?? [];
    const byCategory = new Map<string, string[]>();
    for (const s of list) {
      const cat = (s.category || "").trim() || "Other";
      if (!byCategory.has(cat)) byCategory.set(cat, []);
      byCategory.get(cat)!.push(s.name);
    }
    return Array.from(byCategory.entries())
      .map(([category, names]) => `${category}: ${names.join(", ")}`)
      .join("\n");
  })();

  return (
    <div className={cn("space-y-2", className)}>
      {onSummaryChange && (
        <BulletTextArea
          label="Summary"
          value={profile.summary ?? ""}
          onChange={onSummaryChange}
          placeholder="Paste or type summary..."
          className={
            highlightTarget === "summary"
              ? "ring-2 ring-sky-400 ring-offset-1 ring-offset-background rounded-md"
              : undefined
          }
        />
      )}
      {(experience ?? []).length === 0 ? (
        <div className="rounded border border-dashed bg-muted/30 p-2 text-xs text-muted-foreground">
          No experience entries. Add experience on your resume first.
        </div>
      ) : (
        experience.map((exp, index) => {
          const isCurrentCompanyHighlight =
            highlightTarget === "currentCompany" && index === 0;
          const isLastCompanyHighlight =
            highlightTarget === "lastCompany" && index === 1;
          return (
          <div
            key={exp.id}
            className={cn(
              "space-y-1.5 rounded border border-border bg-background/40 p-2",
              isCurrentCompanyHighlight || isLastCompanyHighlight
                ? "ring-2 ring-sky-400 ring-offset-1 ring-offset-background"
                : null
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-semibold text-foreground truncate">{exp.company}</div>
              {onExperienceRoleChange && (
                <div className="flex items-center gap-1 min-w-[140px]">
                  <Label className="text-[10px] text-muted-foreground whitespace-nowrap">Role</Label>
                  <Input
                    value={exp.role ?? ""}
                    onChange={(e) => onExperienceRoleChange(exp.id, e.target.value)}
                    placeholder="e.g. Senior Engineer"
                    className="h-6 px-2 py-0 text-[10px]"
                  />
                </div>
              )}
            </div>
            <BulletTextArea
              label={undefined}
              value={exp.description ?? ""}
              onChange={(value) => onExperienceDescriptionChange(exp.id, value)}
            />
          </div>
        );
      })
      )}
      {onSkillsChange && (experience ?? []).length > 0 && <hr className="border-border" />}
      {onSkillsChange && (
        <BulletTextArea
          label="Skills"
          value={skillsText}
          onChange={onSkillsChange}
          placeholder="Category: skill1, skill2, ... (comma separates items)"
          pasteMode="lines"
          className={
            highlightTarget === "skills"
              ? "ring-2 ring-sky-400 ring-offset-1 ring-offset-background rounded-md"
              : undefined
          }
        />
      )}
    </div>
  );
}
