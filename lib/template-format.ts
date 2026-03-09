import type { ResumeStyle } from "./resume-store";

/** Format id used in URL (e.g. format1, format2). Client-safe (no Node.js). */
export type FormatId = "format1" | "format2" | "format3" | "format4";

/** Map formatId to template id. */
export const FORMAT_TO_TEMPLATE_ID: Record<FormatId, string> = {
  format1: "template-1",
  format2: "template-2",
  format3: "template-3",
  format4: "template-4",
};

export const FORMAT_IDS: FormatId[] = ["format1", "format2", "format3", "format4"];

const TEMPLATE_TO_FORMAT: Record<string, FormatId> = {
  "template-1": "format1",
  "template-2": "format2",
  "template-3": "format3",
  "template-4": "format4",
};

export function formatIdToTemplateId(formatId: string): string | null {
  if (FORMAT_IDS.includes(formatId as FormatId)) return FORMAT_TO_TEMPLATE_ID[formatId as FormatId];
  return null;
}

export function templateIdToFormatId(templateId: string): FormatId | null {
  return TEMPLATE_TO_FORMAT[templateId] ?? null;
}

/** For nav: formatId + label (name, description). */
export const FORMAT_LIST: { formatId: FormatId; name: string; description: string }[] = [
  { formatId: "format1", name: "Template 1", description: "Current resume configuration" },
  { formatId: "format2", name: "Template 2", description: "Modern Minimal — clean sans-serif, navy accent" },
  { formatId: "format3", name: "Template 3", description: "Split header layout with structured grid skills" },
  { formatId: "format4", name: "Template 4", description: "Warm editorial design with cream tones, brown headings, and double-line dividers" },
];

/** Default style values per format (client-safe). Used to fill the edit sidebar so current effective values are shown. */
const DEFAULT_STYLE_FORMAT1: Partial<ResumeStyle> = {
  nameSize: 22,
  titleSize: 11,
  contactSize: 9.5,
  sectionSize: 10,
  bodySize: 10,
  bodyLineHeight: 1.4,
  bulletChar: "●",
  sectionTopInches: 0.15,
  sectionBottomInches: 0.1,
  bulletIndentInches: 0.25,
  bulletGapInches: 0.05,
};

const DEFAULT_STYLE_FORMAT2: Partial<ResumeStyle> = {
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  nameSize: 26,
  titleSize: 12,
  contactSize: 9,
  sectionSize: 10.5,
  bodySize: 10,
  bodyLineHeight: 1.55,
  nameColor: "#1e3a5f",
  sectionColor: "#1e3a5f",
  bulletChar: "●",
  sectionTopInches: 0.16,
  sectionBottomInches: 0.1,
  bulletIndentInches: 0.25,
  bulletGapInches: 0.04,
};

const DEFAULT_STYLE_FORMAT3: Partial<ResumeStyle> = {
  fontFamily: "Arial, Helvetica, sans-serif",
  nameSize: 24,
  titleSize: 11,
  contactSize: 9,
  sectionSize: 10.5,
  bodySize: 10,
  bodyLineHeight: 1.5,
  nameColor: "#111827",
  sectionColor: "#111827",
  bulletChar: "•",
  sectionTopInches: 0.14,
  sectionBottomInches: 0.1,
  bulletIndentInches: 0.25,
  bulletGapInches: 0.04,
};

const DEFAULT_STYLE_FORMAT4: Partial<ResumeStyle> = {
  fontFamily: "'Palatino Linotype', 'Book Antiqua', Palatino, serif",
  nameSize: 24,
  titleSize: 11,
  contactSize: 9,
  sectionSize: 10.5,
  bodySize: 10,
  bodyLineHeight: 1.6,
};

const DEFAULT_STYLES: Record<FormatId, Partial<ResumeStyle>> = {
  format1: DEFAULT_STYLE_FORMAT1,
  format2: DEFAULT_STYLE_FORMAT2,
  format3: DEFAULT_STYLE_FORMAT3,
  format4: DEFAULT_STYLE_FORMAT4,
};

/** Default style for a format. Use when opening the edit sidebar so saved style is merged with defaults and all fields show current values. */
export function getDefaultStyleForFormat(formatId: FormatId): Partial<ResumeStyle> {
  return DEFAULT_STYLES[formatId] ?? {};
}
