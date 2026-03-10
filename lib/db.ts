import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import type { ResumeData } from "./resume-store";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "app.db");

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

ensureDataDir();

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  data_json TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS job_applications (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  company_name TEXT NOT NULL,
  title TEXT NOT NULL,
  job_url TEXT,
  profile_id TEXT,
  resume_file_name TEXT NOT NULL,
  job_description TEXT NOT NULL,
  applied_manually INTEGER NOT NULL DEFAULT 0,
  gpt_chat_url TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS job_links (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  checked INTEGER NOT NULL,
  check_result TEXT,
  created_at TEXT NOT NULL
);
`);

function genId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

// --- Settings (single-user, key/value) ---

export interface Settings {
  activeProfileId: string | null;
}

export function getActiveProfileId(): string | null {
  const row = db
    .prepare<unknown[], { value: string }>("SELECT value FROM settings WHERE key = 'activeProfileId'")
    .get();
  return row ? (row.value || null) : null;
}

export function setActiveProfileId(activeProfileId: string | null): void {
  const value = activeProfileId ?? "";
  db.prepare("INSERT INTO settings (key, value) VALUES ('activeProfileId', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(value);
}

// --- Profiles ---

export interface ProfileRow {
  id: string;
  name: string;
  data: string;
  created_at: string;
  updated_at: string;
}

/** Returns profiles in stored order (sort_order). */
export function listProfiles(): ProfileRow[] {
  const rows = db
    .prepare<unknown[], { id: string; name: string; data_json: string; created_at: string; updated_at: string }>(
      "SELECT id, name, data_json, created_at, updated_at FROM profiles ORDER BY sort_order ASC"
    )
    .all();
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    data: r.data_json,
    created_at: r.created_at,
    updated_at: r.updated_at,
  }));
}

export function getProfile(id: string): ProfileRow | undefined {
  const row = db
    .prepare<unknown[], { id: string; name: string; data_json: string; created_at: string; updated_at: string }>(
      "SELECT id, name, data_json, created_at, updated_at FROM profiles WHERE id = ?"
    )
    .get(id);
  if (!row) return undefined;
  return {
    id: row.id,
    name: row.name,
    data: row.data_json,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function createProfile(name: string, data: ResumeData): ProfileRow {
  const now = new Date().toISOString();
  const id = genId();
  const maxOrderRow = db.prepare("SELECT MAX(sort_order) as maxOrder FROM profiles").get() as { maxOrder: number | null } | undefined;
  const maxOrder = maxOrderRow?.maxOrder ?? -1;
  const sortOrder = maxOrder + 1;
  db.prepare("INSERT INTO profiles (id, name, data_json, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)").run(
    id,
    name.trim() || "Untitled",
    JSON.stringify(data),
    sortOrder,
    now,
    now
  );
  return {
    id,
    name: name.trim() || "Untitled",
    data: JSON.stringify(data),
    created_at: now,
    updated_at: now,
  };
}

export function updateProfile(
  id: string,
  updates: { name?: string; data?: ResumeData }
): void {
  const existing = db.prepare("SELECT id, name, data_json, created_at, updated_at FROM profiles WHERE id = ?").get(id) as
    | { id: string; name: string; data_json: string; created_at: string; updated_at: string }
    | undefined;
  if (!existing) throw new Error("Profile not found");
  const name = updates.name !== undefined ? updates.name.trim() : existing.name;
  const dataJson = updates.data !== undefined ? JSON.stringify(updates.data) : existing.data_json;
  const updatedAt = new Date().toISOString();
  db.prepare("UPDATE profiles SET name = ?, data_json = ?, updated_at = ? WHERE id = ?").run(
    name,
    dataJson,
    updatedAt,
    id
  );
}

export function deleteProfile(id: string): void {
  db.prepare("DELETE FROM profiles WHERE id = ?").run(id);
}

/** Reorder profiles by the given id order. Ids not in the list keep current order at end. */
export function reorderProfiles(orderedIds: string[]): void {
  const existing = db
    .prepare<unknown[], { id: string; sort_order: number }>("SELECT id, sort_order FROM profiles")
    .all();
  const byId = new Map(existing.map((p) => [p.id, p]));
  const ordered: { id: string; sort_order: number }[] = [];
  let sortOrder = 0;
  for (const id of orderedIds) {
    const p = byId.get(id);
    if (p) {
      ordered.push({ id: p.id, sort_order: sortOrder++ });
      byId.delete(id);
    }
  }
  for (const p of existing) {
    if (byId.has(p.id)) {
      ordered.push({ id: p.id, sort_order: sortOrder++ });
    }
  }
  const stmt = db.prepare("UPDATE profiles SET sort_order = ? WHERE id = ?");
  const tx = db.transaction((rows: { id: string; sort_order: number }[]) => {
    for (const row of rows) {
      stmt.run(row.sort_order, row.id);
    }
  });
  tx(ordered);
}

// --- Job applications ---

export interface JobApplicationRow {
  id: string;
  date: string;
  company_name: string;
  title: string;
  job_url: string | null;
  profile_id: string | null;
  resume_file_name: string;
  job_description: string;
  /** 0 = not applied, 1 = applied */
  applied_manually: number;
  gpt_chat_url: string | null;
  created_at: string;
}

function slug(s: string): string {
  return s
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 80) || "untitled";
}

/** Returns job applications in storage order. If profileId is provided, only rows for that profile. */
export function listJobApplications(profileId?: string | null): JobApplicationRow[] {
  const cols =
    "id, date, company_name, title, job_url, profile_id, resume_file_name, job_description, applied_manually, gpt_chat_url, created_at";
  const order = " ORDER BY rowid ASC";
  if (profileId != null && String(profileId).trim() !== "") {
    const rows = db
      .prepare<
        [string],
        {
          id: string;
          date: string;
          company_name: string;
          title: string;
          job_url: string | null;
          profile_id: string | null;
          resume_file_name: string;
          job_description: string;
          applied_manually: number;
          gpt_chat_url: string | null;
          created_at: string;
        }
      >(`SELECT ${cols} FROM job_applications WHERE profile_id = ?${order}`)
      .all(profileId.trim());
    return rows;
  }
  const rows = db
    .prepare<
      unknown[],
      {
        id: string;
        date: string;
        company_name: string;
        title: string;
        job_url: string | null;
        profile_id: string | null;
        resume_file_name: string;
        job_description: string;
        applied_manually: number;
        gpt_chat_url: string | null;
        created_at: string;
      }
    >(`SELECT ${cols} FROM job_applications${order}`)
    .all();
  return rows;
}

/** Keys (profile_id::normalized_company) that appear more than once in job_applications. Used to highlight duplicate rows. */
export function getDuplicateJobApplicationKeys(): string[] {
  const rows = db
    .prepare<
      unknown[],
      { profile_id: string; company_key: string }
    >(
      `SELECT profile_id, LOWER(TRIM(company_name)) AS company_key
       FROM job_applications
       WHERE profile_id IS NOT NULL AND profile_id != '' AND TRIM(company_name) != ''
       GROUP BY profile_id, LOWER(TRIM(company_name))
       HAVING COUNT(*) > 1`
    )
    .all();
  return rows.map((r) => `${r.profile_id}::${r.company_key}`);
}

export function getJobApplication(id: string): JobApplicationRow | undefined {
  const row = db
    .prepare<
      unknown[],
      {
        id: string;
        date: string;
        company_name: string;
        title: string;
        job_url: string | null;
        profile_id: string | null;
        resume_file_name: string;
        job_description: string;
        applied_manually: number;
        gpt_chat_url: string | null;
        created_at: string;
      }
    >(
      "SELECT id, date, company_name, title, job_url, profile_id, resume_file_name, job_description, applied_manually, gpt_chat_url, created_at FROM job_applications WHERE id = ?"
    )
    .get(id);
  return row ?? undefined;
}

export function createJobApplication(params: {
  date: string;
  company_name: string;
  title: string;
  job_url?: string | null;
  profile_id?: string | null;
  resume_file_name?: string | null;
  job_description?: string | null;
  applied_manually?: number | boolean;
  gpt_chat_url?: string | null;
}): JobApplicationRow {
  let resume_file_name: string;
  if (params.resume_file_name !== undefined && params.resume_file_name !== null) {
    resume_file_name = String(params.resume_file_name).trim();
  } else {
    const profileName =
      params.profile_id != null ? getProfile(params.profile_id)?.name ?? "default" : "default";
    resume_file_name = `${slug(profileName)}_${slug(params.company_name)}_${slug(params.title)}_${params.date}.pdf`;
  }
  const now = new Date().toISOString();
  const id = genId();
  const appliedValue =
    typeof params.applied_manually === "boolean"
      ? params.applied_manually
        ? 1
        : 0
      : typeof params.applied_manually === "number"
      ? params.applied_manually
      : 0;
  const row: JobApplicationRow = {
    id,
    date:
      params.date !== undefined && params.date !== null
        ? String(params.date).trim()
        : now.slice(0, 10),
    company_name: params.company_name.trim(),
    title: params.title.trim(),
    job_url: params.job_url?.trim() || null,
    profile_id: params.profile_id ?? null,
    resume_file_name,
    job_description: typeof params.job_description === "string" ? params.job_description : "",
    applied_manually: appliedValue,
    gpt_chat_url: params.gpt_chat_url ?? null,
    created_at: now,
  };
  db.prepare(
    "INSERT INTO job_applications (id, date, company_name, title, job_url, profile_id, resume_file_name, job_description, applied_manually, gpt_chat_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(
    row.id,
    row.date,
    row.company_name,
    row.title,
    row.job_url,
    row.profile_id,
    row.resume_file_name,
    row.job_description,
    row.applied_manually,
    row.gpt_chat_url,
    row.created_at
  );
  return row;
}

export function updateJobApplication(
  id: string,
  updates: {
    date?: string;
    company_name?: string;
    title?: string;
    job_url?: string | null;
    profile_id?: string | null;
    resume_file_name?: string | null;
    job_description?: string | null;
    applied_manually?: number | boolean;
    gpt_chat_url?: string | null;
  }
): void {
  const existing = getJobApplication(id);
  if (!existing) throw new Error("Job application not found");
  const next: JobApplicationRow = {
    ...existing,
    date: updates.date !== undefined ? updates.date : existing.date,
    company_name: updates.company_name !== undefined ? updates.company_name.trim() : existing.company_name,
    title: updates.title !== undefined ? updates.title.trim() : existing.title,
    job_url: updates.job_url !== undefined ? updates.job_url?.trim() || null : existing.job_url,
    profile_id: updates.profile_id !== undefined ? updates.profile_id : existing.profile_id,
    resume_file_name:
      updates.resume_file_name !== undefined
        ? updates.resume_file_name != null
          ? String(updates.resume_file_name).trim()
          : ""
        : existing.resume_file_name,
    job_description:
      updates.job_description !== undefined
        ? typeof updates.job_description === "string"
          ? updates.job_description
          : ""
        : existing.job_description,
    applied_manually:
      updates.applied_manually !== undefined
        ? typeof updates.applied_manually === "boolean"
          ? updates.applied_manually
            ? 1
            : 0
          : updates.applied_manually
        : existing.applied_manually,
    gpt_chat_url:
      updates.gpt_chat_url !== undefined
        ? updates.gpt_chat_url != null
          ? updates.gpt_chat_url
          : null
        : existing.gpt_chat_url,
  };
  db.prepare(
    "UPDATE job_applications SET date = ?, company_name = ?, title = ?, job_url = ?, profile_id = ?, resume_file_name = ?, job_description = ?, applied_manually = ?, gpt_chat_url = ? WHERE id = ?"
  ).run(
    next.date,
    next.company_name,
    next.title,
    next.job_url,
    next.profile_id,
    next.resume_file_name,
    next.job_description,
    next.applied_manually,
    next.gpt_chat_url,
    id
  );
}

export function deleteJobApplication(id: string): void {
  db.prepare("DELETE FROM job_applications WHERE id = ?").run(id);
}

// --- Job links ---

export interface JobLinkRow {
  id: string;
  url: string;
  title: string;
  date: string;
  checked: boolean;
  check_result: string | null;
  created_at: string;
}

export function listJobLinks(): JobLinkRow[] {
  const rows = db
    .prepare<
      unknown[],
      {
        id: string;
        url: string;
        title: string;
        date: string;
        checked: number;
        check_result: string | null;
        created_at: string;
      }
    >("SELECT id, url, title, date, checked, check_result, created_at FROM job_links ORDER BY date DESC, created_at DESC")
    .all();
  return rows.map((r) => ({
    id: r.id,
    url: r.url,
    title: r.title,
    date: r.date,
    checked: Boolean(r.checked),
    check_result: r.check_result,
    created_at: r.created_at,
  }));
}

export function getJobLink(id: string): JobLinkRow | undefined {
  const row = db
    .prepare<
      unknown[],
      {
        id: string;
        url: string;
        title: string;
        date: string;
        checked: number;
        check_result: string | null;
        created_at: string;
      }
    >("SELECT id, url, title, date, checked, check_result, created_at FROM job_links WHERE id = ?")
    .get(id);
  if (!row) return undefined;
  return {
    id: row.id,
    url: row.url,
    title: row.title,
    date: row.date,
    checked: Boolean(row.checked),
    check_result: row.check_result,
    created_at: row.created_at,
  };
}

export function createJobLink(params: { url: string; title?: string; date?: string }): JobLinkRow {
  const date =
    params.date !== undefined && params.date !== null
      ? String(params.date).trim()
      : new Date().toISOString().slice(0, 10);
  const now = new Date().toISOString();
  const id = genId();
  const row: JobLinkRow = {
    id,
    url: params.url.trim(),
    title: typeof params.title === "string" ? params.title.trim() : "",
    date,
    checked: false,
    check_result: null,
    created_at: now,
  };
  db.prepare(
    "INSERT INTO job_links (id, url, title, date, checked, check_result, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(row.id, row.url, row.title, row.date, row.checked ? 1 : 0, row.check_result, row.created_at);
  return row;
}

export function updateJobLink(
  id: string,
  updates: {
    url?: string;
    title?: string;
    date?: string;
    checked?: boolean;
    checkResult?: string | null;
  }
): void {
  const existing = getJobLink(id);
  if (!existing) throw new Error("Job link not found");
  const next: JobLinkRow = {
    ...existing,
    url: updates.url !== undefined ? updates.url.trim() : existing.url,
    title: updates.title !== undefined ? updates.title.trim() : existing.title,
    date: updates.date !== undefined ? updates.date.trim() : existing.date,
    checked: updates.checked !== undefined ? updates.checked : existing.checked,
    check_result: updates.checkResult !== undefined ? updates.checkResult : existing.check_result,
  };
  db.prepare("UPDATE job_links SET url = ?, title = ?, date = ?, checked = ?, check_result = ? WHERE id = ?").run(
    next.url,
    next.title,
    next.date,
    next.checked ? 1 : 0,
    next.check_result,
    id
  );
}

export function deleteJobLink(id: string): void {
  db.prepare("DELETE FROM job_links WHERE id = ?").run(id);
}
