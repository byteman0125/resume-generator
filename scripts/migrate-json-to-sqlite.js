/* One-time migration: move data/*.json into data/app.db (SQLite).
 *
 * - Profiles: data/profiles.json -> profiles table
 * - Job applications: data/job-applications.json -> job_applications table
 * - Settings: data/settings.json -> settings table (activeProfileId)
 *
 * Safe to run multiple times: uses INSERT OR IGNORE on primary keys.
 */

const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "app.db");

function fileExists(p) {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
}

function readJson(p, fallback) {
  if (!fileExists(p)) return fallback;
  try {
    const raw = fs.readFileSync(p, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to read JSON from", p, e);
    return fallback;
  }
}

function main() {
  if (!fileExists(DB_PATH)) {
    console.error("SQLite DB not found at", DB_PATH, "- start the app once so lib/db.ts can create it.");
    process.exit(1);
  }

  const db = new Database(DB_PATH);

  // Ensure tables exist (match lib/db.ts)
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
  created_at TEXT NOT NULL
);
`);

  // 1) Profiles
  const profilesPath = path.join(DATA_DIR, "profiles.json");
  const profiles = readJson(profilesPath, []);
  if (Array.isArray(profiles) && profiles.length > 0) {
    console.log("Migrating", profiles.length, "profiles from", profilesPath);
    const insertProfile = db.prepare(
      "INSERT OR IGNORE INTO profiles (id, name, data_json, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
    );
    const tx = db.transaction((rows) => {
      for (let i = 0; i < rows.length; i++) {
        const p = rows[i];
        if (!p || !p.id) continue;
        const sortOrder =
          typeof p.sortOrder === "number"
            ? p.sortOrder
            : i; // fallback: index order if sortOrder missing
        insertProfile.run(
          String(p.id),
          String(p.name || "").trim() || "Untitled",
          typeof p.data === "string" ? p.data : JSON.stringify(p.data ?? {}),
          sortOrder,
          String(p.created_at || new Date().toISOString()),
          String(p.updated_at || p.created_at || new Date().toISOString())
        );
      }
    });
    tx(profiles);
  } else {
    console.log("No profiles to migrate (", profilesPath, ")");
  }

  // 2) Job applications
  const appsPath = path.join(DATA_DIR, "job-applications.json");
  const apps = readJson(appsPath, []);
  if (Array.isArray(apps) && apps.length > 0) {
    console.log("Migrating", apps.length, "job applications from", appsPath);
    const insertApp = db.prepare(
      "INSERT OR IGNORE INTO job_applications (id, date, company_name, title, job_url, profile_id, resume_file_name, job_description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    const updateResumeFileName = db.prepare(
      "UPDATE job_applications SET resume_file_name = ? WHERE id = ?"
    );
    const tx = db.transaction((rows) => {
      for (const a of rows) {
        if (!a || !a.id) continue;
        const resumeFileName = String(a.resume_file_name ?? "").trim();
        insertApp.run(
          String(a.id),
          String(a.date || "").trim(),
          String(a.company_name || "").trim(),
          String(a.title || "").trim(),
          a.job_url != null ? String(a.job_url) : null,
          a.profile_id != null ? String(a.profile_id) : null,
          resumeFileName,
          a.job_description != null ? String(a.job_description) : "",
          String(a.created_at || new Date().toISOString())
        );
        // Repair already-migrated rows: keep applied state from source (empty = unapplied)
        updateResumeFileName.run(resumeFileName, String(a.id));
      }
    });
    tx(apps);
  } else {
    console.log("No job applications to migrate (", appsPath, ")");
  }

  // 3) Settings (activeProfileId)
  const settingsPath = path.join(DATA_DIR, "settings.json");
  const settings = readJson(settingsPath, {});
  if (settings && typeof settings.activeProfileId === "string" && settings.activeProfileId.trim()) {
    console.log("Migrating activeProfileId from", settingsPath);
    db.prepare(
      "INSERT INTO settings (key, value) VALUES ('activeProfileId', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
    ).run(String(settings.activeProfileId));
  } else {
    console.log("No activeProfileId in", settingsPath);
  }

  console.log("Migration complete.");
  db.close();
}

main();

