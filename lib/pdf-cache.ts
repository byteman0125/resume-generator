import path from "path";
import fs from "fs";
import type { ResumeData } from "./resume-store";

const TTL_MS = 5 * 60 * 1000; // 5 minutes
const CACHE_DIR = path.join(process.cwd(), "data", "pdf-cache");

function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

function safeToken(token: string): string {
  if (!/^[a-zA-Z0-9-]+$/.test(token) || token.length > 64) return "";
  return token;
}

function filePath(token: string): string {
  return path.join(CACHE_DIR, `${token}.json`);
}

export interface PdfCachePayload {
  data: ResumeData;
  templateId?: string;
}

export function setPdfData(token: string, data: ResumeData, templateId?: string): void {
  const safe = safeToken(token);
  if (!safe) return;
  ensureCacheDir();
  const payload = { storedAt: Date.now(), data, templateId };
  fs.writeFileSync(filePath(safe), JSON.stringify(payload), "utf-8");
}

export function getPdfData(token: string): PdfCachePayload | null {
  const safe = safeToken(token);
  if (!safe) return null;
  const fp = filePath(safe);
  if (!fs.existsSync(fp)) return null;
  try {
    const raw = fs.readFileSync(fp, "utf-8");
    const { storedAt, data, templateId } = JSON.parse(raw) as {
      storedAt: number;
      data: ResumeData;
      templateId?: string;
    };
    if (Date.now() - storedAt > TTL_MS) {
      fs.unlinkSync(fp);
      return null;
    }
    return { data, templateId };
  } catch {
    try {
      fs.unlinkSync(fp);
    } catch {}
    return null;
  }
}

export function createToken(): string {
  return crypto.randomUUID();
}

/** Delete expired cache files (where storedAt is older than TTL). Returns number of files removed. */
export function clearExpiredPdfCache(): number {
  if (!fs.existsSync(CACHE_DIR)) return 0;
  const now = Date.now();
  let removed = 0;
  const entries = fs.readdirSync(CACHE_DIR, { withFileTypes: true });
  for (const ent of entries) {
    if (!ent.isFile() || !ent.name.endsWith(".json")) continue;
    const fp = path.join(CACHE_DIR, ent.name);
    try {
      const raw = fs.readFileSync(fp, "utf-8");
      const { storedAt } = JSON.parse(raw) as { storedAt: number };
      if (now - storedAt > TTL_MS) {
        fs.unlinkSync(fp);
        removed++;
      }
    } catch {
      try {
        fs.unlinkSync(fp);
        removed++;
      } catch {}
    }
  }
  return removed;
}
