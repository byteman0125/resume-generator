import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { ResumeStyle } from "@/lib/resume-store";
import { Save, X } from "lucide-react";

const FONT_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Default" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: "'Times New Roman', Times, serif", label: "Times New Roman" },
  { value: "'Helvetica Neue', Helvetica, Arial, sans-serif", label: "Helvetica" },
  { value: "system-ui, -apple-system, sans-serif", label: "System UI" },
];

const BULLET_OPTIONS: { value: string; label: string }[] = [
  { value: "●", label: "● Black circle" },
  { value: "•", label: "• Bullet" },
  { value: "◦", label: "◦ White circle" },
  { value: "-", label: "- Hyphen" },
  { value: "*", label: "* Asterisk" },
  { value: "▪", label: "▪ Square" },
  { value: "▸", label: "▸ Triangle" },
];

const ALIGN_OPTIONS: { value: "left" | "center" | "right"; label: string }[] = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
];

function toHexColor(s: string | undefined): string {
  if (!s || typeof s !== "string") return "#000000";
  const hex = s.replace(/^#/, "").slice(0, 6);
  return /^[0-9A-Fa-f]{6}$/.test(hex) ? `#${hex}` : "#000000";
}

function numVal(n: number | undefined): string {
  if (n === undefined || n === null) return "";
  return String(n);
}

export function TemplateStyleSidebar({
  style,
  onChange,
  onSave,
  onClose,
}: {
  style: ResumeStyle;
  onChange: (style: ResumeStyle) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const update = (patch: Partial<ResumeStyle>) => {
    onChange({ ...style, ...patch });
  };

  const toggleSection = (key: string) => {
    setCollapsed((c) => ({ ...c, [key]: !c[key] }));
  };

  const sectionBtn = (key: string, label: string) => (
    <button
      type="button"
      className="w-full flex items-center justify-between text-xs font-medium py-1.5 text-left hover:bg-muted/50 rounded px-1.5 -mx-1.5"
      onClick={() => toggleSection(key)}
    >
      {label}
      <span className="text-muted-foreground text-[10px]">{collapsed[key] ? "▼" : "▲"}</span>
    </button>
  );

  return (
    <aside className="w-72 flex-shrink-0 border-l border-border bg-background flex flex-col overflow-hidden text-xs">
      <div className="flex-shrink-0 flex items-center justify-between border-b border-border px-3 py-2">
        <h3 className="font-semibold text-xs">Style</h3>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose} aria-label="Close">
            <X className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" className="gap-1 h-7 text-xs px-2" onClick={onSave}>
            <Save className="h-3.5 w-3.5" />
            Save
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <section>
          {sectionBtn("typography", "Typography")}
          {!collapsed.typography && (
            <div className="space-y-1.5 pt-0.5">
              <div>
                <Label className="text-[10px] text-muted-foreground">Font</Label>
                <select
                  className="mt-0.5 flex h-7 w-full rounded border border-input bg-transparent px-2 py-0.5 text-xs"
                  value={style.fontFamily ?? ""}
                  onChange={(e) => update({ fontFamily: e.target.value || undefined })}
                >
                  {FONT_OPTIONS.map((o) => (
                    <option key={o.value || "default"} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { key: "nameSize" as const, label: "Name", unit: "pt" },
                  { key: "titleSize" as const, label: "Title", unit: "pt" },
                  { key: "contactSize" as const, label: "Contact", unit: "pt" },
                  { key: "sectionSize" as const, label: "Section", unit: "pt" },
                  { key: "bodySize" as const, label: "Body", unit: "pt" },
                ].map(({ key, label, unit }) => (
                  <div key={key}>
                    <Label className="text-[10px] text-muted-foreground">{label} ({unit})</Label>
                    <Input
                      type="number"
                      min={8}
                      max={32}
                      step={0.5}
                      className="mt-0.5 h-7 text-xs"
                      value={numVal(style[key])}
                      placeholder="—"
                      onChange={(e) => {
                        const v = e.target.value;
                        update({ [key]: v === "" ? undefined : Number(v) });
                      }}
                    />
                  </div>
                ))}
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Line height</Label>
                <Input
                  type="number"
                  min={1}
                  max={2}
                  step={0.05}
                  className="mt-0.5 h-7 text-xs"
                  value={numVal(style.bodyLineHeight)}
                  placeholder="—"
                  onChange={(e) => {
                    const v = e.target.value;
                    update({ bodyLineHeight: v === "" ? undefined : Number(v) });
                  }}
                />
              </div>
            </div>
          )}
        </section>

        <section>
          {sectionBtn("colors", "Colors")}
          {!collapsed.colors && (
            <div className="space-y-1 pt-0.5">
              {[
                { key: "nameColor" as const, label: "Name" },
                { key: "titleColor" as const, label: "Title" },
                { key: "sectionColor" as const, label: "Section" },
                { key: "bodyColor" as const, label: "Body" },
                { key: "contactColor" as const, label: "Contact" },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center gap-1.5">
                  <input
                    type="color"
                    className="h-7 w-7 rounded border border-input cursor-pointer flex-shrink-0"
                    value={toHexColor(style[key])}
                    onChange={(e) => update({ [key]: e.target.value })}
                  />
                  <Input
                    className="flex-1 h-7 text-[10px] font-mono"
                    value={style[key] ?? ""}
                    onChange={(e) => update({ [key]: e.target.value || undefined })}
                    placeholder="#000000"
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          {sectionBtn("spacing", "Spacing (inches)")}
          {!collapsed.spacing && (
            <div className="space-y-1.5 pt-0.5">
              <div>
                <Label className="text-[10px] text-muted-foreground">Section top (in)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.05}
                  className="mt-0.5 h-7 text-xs"
                  value={numVal(style.sectionTopInches)}
                  placeholder="0"
                  onChange={(e) => update({ sectionTopInches: e.target.value === "" ? undefined : Number(e.target.value) })}
                />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Section bottom (in)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.05}
                  className="mt-0.5 h-7 text-xs"
                  value={numVal(style.sectionBottomInches)}
                  placeholder="0"
                  onChange={(e) => update({ sectionBottomInches: e.target.value === "" ? undefined : Number(e.target.value) })}
                />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Bullet indent (in)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.05}
                  className="mt-0.5 h-7 text-xs"
                  value={numVal(style.bulletIndentInches)}
                  placeholder="0"
                  onChange={(e) => update({ bulletIndentInches: e.target.value === "" ? undefined : Number(e.target.value) })}
                />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Bullet gap (in)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  className="mt-0.5 h-7 text-xs"
                  value={numVal(style.bulletGapInches)}
                  placeholder="0"
                  onChange={(e) => update({ bulletGapInches: e.target.value === "" ? undefined : Number(e.target.value) })}
                />
              </div>
            </div>
          )}
        </section>

        <section>
          {sectionBtn("bullets", "Bullets")}
          {!collapsed.bullets && (
            <div className="pt-0.5">
              <Label className="text-[10px] text-muted-foreground">Bullet character</Label>
              <select
                className="mt-0.5 flex h-7 w-full rounded border border-input bg-transparent px-2 py-0.5 text-xs"
                value={style.bulletChar ?? "●"}
                onChange={(e) => update({ bulletChar: e.target.value })}
              >
                {BULLET_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          )}
        </section>

        <section>
          {sectionBtn("sections", "Sections & header")}
          {!collapsed.sections && (
            <div className="space-y-1.5 pt-0.5">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showSummary"
                  checked={style.showSummary !== false}
                  onChange={(e) => update({ showSummary: e.target.checked })}
                  className="h-3.5 w-3.5"
                />
                <Label htmlFor="showSummary" className="text-[10px]">Show summary</Label>
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Name align</Label>
                <select
                  className="mt-0.5 flex h-7 w-full rounded border border-input bg-transparent px-2 py-0.5 text-xs"
                  value={style.nameTextAlign ?? "left"}
                  onChange={(e) => update({ nameTextAlign: e.target.value as "left" | "center" | "right" })}
                >
                  {ALIGN_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Title align</Label>
                <select
                  className="mt-0.5 flex h-7 w-full rounded border border-input bg-transparent px-2 py-0.5 text-xs"
                  value={style.titleTextAlign ?? "left"}
                  onChange={(e) => update({ titleTextAlign: e.target.value as "left" | "center" | "right" })}
                >
                  {ALIGN_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Contact align</Label>
                <select
                  className="mt-0.5 flex h-7 w-full rounded border border-input bg-transparent px-2 py-0.5 text-xs"
                  value={style.contactTextAlign ?? "left"}
                  onChange={(e) => update({ contactTextAlign: e.target.value as "left" | "center" | "right" })}
                >
                  {ALIGN_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </section>
      </div>
    </aside>
  );
}
