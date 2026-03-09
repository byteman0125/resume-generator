import path from "path";
import fs from "fs";
import type { ResumeStyle } from "./resume-store";
import { FORMAT_IDS, type FormatId } from "./template-format";

export type { FormatId } from "./template-format";
export { FORMAT_IDS, FORMAT_LIST, formatIdToTemplateId, templateIdToFormatId, FORMAT_TO_TEMPLATE_ID } from "./template-format";

/** Template style stored in JSON file (same shape as ResumeStyle). */
export type TemplateStyleFile = ResumeStyle;

const DATA_DIR = path.join(process.cwd(), "data");
const STYLE_DIR = path.join(DATA_DIR, "template-styles");

function ensureStyleDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(STYLE_DIR)) fs.mkdirSync(STYLE_DIR, { recursive: true });
}

export function getStyleFilePath(formatId: FormatId): string {
  return path.join(STYLE_DIR, `${formatId}-style.json`);
}

/** Read template style from JSON file. Returns null if file missing or invalid. */
export function readTemplateStyle(formatId: FormatId): TemplateStyleFile | null {
  if (!FORMAT_IDS.includes(formatId)) return null;
  ensureStyleDir();
  const fp = getStyleFilePath(formatId);
  if (!fs.existsSync(fp)) return null;
  try {
    const raw = fs.readFileSync(fp, "utf-8");
    return JSON.parse(raw) as TemplateStyleFile;
  } catch {
    return null;
  }
}

/** Write template style to JSON file. Only in dev/local (checks NODE_ENV). */
export function writeTemplateStyle(formatId: FormatId, style: TemplateStyleFile): boolean {
  if (!FORMAT_IDS.includes(formatId)) return false;
  if (process.env.NODE_ENV === "production") return false;
  ensureStyleDir();
  const fp = getStyleFilePath(formatId);
  try {
    fs.writeFileSync(fp, JSON.stringify(style, null, 2), "utf-8");
    return true;
  } catch {
    return false;
  }
}

/** Default style for a format (used when no file exists). */
export function getDefaultTemplateStyle(formatId: FormatId): TemplateStyleFile {
  if (formatId === "format2") {
    return {
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
    };
  }
  if (formatId === "format3") {
    return {
      fontFamily: "Arial, Helvetica, sans-serif",
      nameSize: 24,
      titleSize: 11,
      contactSize: 9,
      sectionSize: 10.5,
      bodySize: 10,
      bodyLineHeight: 1.5,
      bulletChar: "•",
    };
  }
  if (formatId === "format4") {
    return {
      fontFamily: "'Palatino Linotype', 'Book Antiqua', Palatino, serif",
      nameSize: 24,
      titleSize: 11,
      contactSize: 9,
      sectionSize: 10.5,
      bodySize: 10,
      bodyLineHeight: 1.6,
    };
  }
  return {
    nameSize: 22,
    titleSize: 11,
    contactSize: 9.5,
    sectionSize: 10,
    bodySize: 10,
    bodyLineHeight: 1.4,
    bulletChar: "●",
  };
}

/** Get style for format: file if exists, else default. */
export function getTemplateStyle(formatId: FormatId): TemplateStyleFile {
  const fromFile = readTemplateStyle(formatId);
  if (fromFile) return fromFile;
  return getDefaultTemplateStyle(formatId);
}
