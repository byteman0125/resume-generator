# Platform Plan: From Single-User JSON to Multi-User Owner/Supporter

## 1. Current State (Today)

### 1.1 Storage (file-based)

- **Settings:** `data/settings.json`
  - Shape: `{ activeProfileId: string | null }`
  - Used to remember the active profile.

- **Profiles:** `data/profiles.json`
  - Array of:
    - `{ id, name, data, created_at, updated_at, sortOrder }`
  - `data` is the full resume JSON.
  - `sortOrder` controls card/list ordering.

- **Job applications:** `data/job-applications.json`
  - Array of `JobApplicationRow`:
    - `id`, `date`, `company_name`, `title`, `job_url`, `profile_id`, `resume_file_name`, `job_description`, `created_at`.
  - **No extra order column.**
  - **Sequence = JSON array order**.
  - New rows are **appended** (`push`), so the table shows jobs in the exact order you added them.

- **Job links (not yet fully used):** `data/job-links.json`
  - File exists to support a “saved jobs” concept, but routes do not use it yet.

All of this is implemented in `lib/db.ts` as a **synchronous file-based store**, with helpers:

- `getActiveProfileId()`, `setActiveProfileId(activeProfileId)`
- `listProfiles()`, `getProfile(id)`, `createProfile(name, data)`, `updateProfile(id, updates)`, `deleteProfile(id)`, `reorderProfiles(orderedIds)`
- `listJobApplications()`, `getJobApplication(id)`, `createJobApplication(params)`, `updateJobApplication(id, updates)`, `deleteJobApplication(id)`

IDs are generated via `crypto.randomUUID()` where available, or a timestamp + random string fallback.

### 1.2 Frontend behavior

- **Job applications table (web + desktop):**
  - Uses `/api/job-applications` to load the array.
  - Does **not** sort on the frontend.
  - Renders rows in the order received → matches the order in `job-applications.json`.
  - New rows are appended in state (`[...prev, toShow]`), preserving visual sequence.

- **Profiles and settings:**
  - Profile list and active profile selection are bound to the file-based store.

Result: you have a **single-user**, **single-machine** tool where:

- Job applications live in one file.
- Order is exactly the order you wrote them.
- All logic is implemented in code; files are just storage.


## 2. Target State: Multi-User with Owner & Supporter

You want to evolve this into a **multi-user platform** with:

- **Owner**:
  - Sees all profiles and all job applications.
  - Has a manager portal to list supporters and assign which profiles they may work on.
  - Can access the AI page.

- **Supporter**:
  - Has their own account (login/registration).
  - Sees **only assigned profiles** and job applications tied to those profiles.
  - Cannot see the AI page.
  - Saved jobs (not yet applied) should be **private per supporter**, not global.

- **Rules**:
  - No sorting based on date; **sequence is insertion order** (per your preference).
  - Do not apply to the **same company with the same profile more than once**.
  - You can “fire” a supporter (turn off access) but keep their history, and optionally reactivate them later.


## 3. Recommended Database Model (PostgreSQL or SQLite)

You can keep your **current logic and table behavior** and only replace the underlying storage:

- Today: `lib/db.ts` → JSON files.
- Future: `lib/db.ts` → SQL queries (PostgreSQL or SQLite).

The core schema for the multi-user case:

### 3.1 `users`

- `id` (UUID, PK)
- `email` (unique, not null)
- `password_hash` (bcrypt)
- `role` (`'owner' | 'supporter'`)
- `status` (`'active' | 'suspended' | 'terminated'`) or `active: boolean`
- `name` (optional)
- `created_at`, `updated_at`

Usage:

- Owners manage supporters.
- Supporters log in and access only assigned profiles.
- Firing a supporter = set `status` non-active (no need to delete).

### 3.2 `profiles`

- `id` (UUID, PK)
- `name` (string)
- `data` (JSONB / TEXT) — resume JSON
- `sort_order` (int)
- `created_at`, `updated_at`

Notes:

- No `user_id` here; profiles are global.
- Owner sees all profiles.
- Supporter sees only profiles assigned to them (see 3.3).

### 3.3 `user_profile_assignments`

- `user_id` (UUID, FK → `users.id`)
- `profile_id` (UUID, FK → `profiles.id`)
- `assigned_by` (UUID, FK → `users.id`, owner)
- `assigned_at` (timestamp)

This table says **which supporter can see which profiles**.

### 3.4 `job_applications`

Keep your existing shape:

- `id` (UUID, PK)
- `date` (string)
- `company_name` (string)
- `title` (string)
- `job_url` (string, nullable)
- `profile_id` (UUID, FK → `profiles.id`, nullable only for “saved” if you choose option B below)
- `resume_file_name` (string)
- `job_description` (text)
- `created_at` (timestamp)

Optional extras:

- `created_by` (UUID, FK → `users.id`) — who created it.
- `status` (`'saved' | 'applying' | 'applied'`) — if you want to track pipeline stage.
- `company_norm` (string) — normalized company name for duplication checks.

Sequence rule:

- Insert with `created_at = now()` and **never sort** in your code; use `ORDER BY created_at` only if you want consistent DB retrieval.
- This matches the current behavior where append order is the visible sequence.

### 3.5 `settings`

- `user_id` (UUID, PK, FK → `users.id`)
- `active_profile_id` (UUID, FK → `profiles.id`, nullable)

Per-user “current profile” for the editor/PDF pages.

### 3.6 Job PDFs

- Keep your existing pattern: `data/job-pdfs/{application_id}.pdf`.
- No schema change required.


## 4. Saved Jobs vs Applications

You often **copy jobs before applying** (no profile yet). These should not pollute real applications or be visible to other users unexpectedly.

Two good options:

### 4.1 Option A (recommended): Separate `saved_jobs`

Table/structure:

- `id`
- `user_id` (owner/supporter who saved it)
- `job_url`
- `company_name`
- `title`
- `job_description`
- `created_at`
- (optional) `notes`, `tags`

Rules:

- Saved jobs are **private per user** (`user_id`).
- Owner can optionally see a supporter’s saved jobs via a manager view.
- When you click “Apply” on a saved job:
  - Choose a `profile_id`.
  - Create a `job_applications` row with the same data and your existing Apply modal logic.
  - Optionally mark/delete the saved job.

### 4.2 Option B: Status in `job_applications`

If you want a single table:

- Add `status` field:
  - `"saved"` — no `profile_id` required.
  - `"applying"` / `"applied"` — must have `profile_id`.
- Queries:
  - Saved jobs = rows where `status = 'saved'` and `created_by = currentUser.id`.
  - Applications = rows where `status != 'saved'` (and `profile_id` is set).

Option A keeps the mental model simpler; B keeps the number of tables smaller.


## 5. Role-Based Access Rules

Core rules for Owner vs Supporter:

- **Owner**:
  - See all profiles.
  - See all job applications.
  - Access AI page.
  - Access manager portal (list supporters, assign profiles, manage supporter `status`).

- **Supporter**:
  - See only:
    - Profiles where `user_profile_assignments.user_id = supporter.id`.
    - Job applications whose `profile_id` is one of those.
  - See only their own saved jobs (if using `saved_jobs.user_id`).
  - No AI page; no manager portal.

Enforcement:

- In each API route, inspect `req.user.role` and `req.user.id`.
- For supporters, always filter:
  - Profiles by `user_profile_assignments`.
  - Applications by allowed `profile_id`s.
  - Saved jobs by `user_id`.


## 6. Preventing Duplicate Applications per Profile + Company

Business rule:

- **Never apply to the same company with the same profile more than once**.

Implementation idea:

1. Normalize company names:
   - `company_norm = company_name.trim().toLowerCase()` (and optionally strip punctuation).
2. In JSON / file-based mode:
   - Before creating an application, scan existing rows:
     - If any row has same `profile_id` and same `company_norm`, reject with a clear error.
   - This is O(n) over your ~3k rows and is cheap.
3. In SQL mode:
   - Add `company_norm` column.
   - Create a **unique index**:
     - `UNIQUE (profile_id, company_norm)` optionally filtered to `status IN ('applying','applied')`.
   - This enforces the rule at the database level and keeps checks fast.


## 7. Supporter Lifecycle (Firing / Rehiring)

Do **not** hard-delete real supporters; use a status flag.

- `users.status` in (`'active'`, `'suspended'`, `'terminated'`) or `active: boolean`.
- Login middleware allows only `status = 'active'`.
- “Firing” a supporter:
  - Set `status` to `'terminated'` (or `active = false`).
  - Remove / reassign their `user_profile_assignments`.
  - Keep all their historical work (applications, saved jobs) intact.
- Rehire:
  - Flip `status` back to `'active'`.
  - Reassign profiles as needed.

Hard-delete only for:

- Test accounts.
- Obvious mistakes.
- Legal erasure requests.


## 8. Migration Path from Current JSON to DB

You can move in stages while keeping your table/UI behavior unchanged.

1. **Stage 1 – Stay JSON, add rules in code**
   - Keep `lib/db.ts` file-based.
   - Add:
     - Duplicate-check by `profile_id + company_norm` before inserting.
     - (Optional) Saved jobs structure per user in JSON.

2. **Stage 2 – Introduce Users & Roles (still JSON-backed)**
   - Add `data/users.json`, `data/user-profile-assignments.json` (or similar).
   - Implement:
     - Owner vs Supporter logic in routes.
     - Filtering by assigned profiles.
     - Status flag on supporters.

3. **Stage 3 – Move to SQL (PostgreSQL or SQLite)**
   - Create the tables in a real DB (users, profiles, user_profile_assignments, job_applications, settings, saved_jobs if you choose that).
   - Update `lib/db.ts` to use SQL instead of JSON files, but keep the same function signatures and behaviors.
   - Add database-level constraints and indexes (including the unique constraint for profile+company).
   - Keep job PDFs on disk as now.

4. **Stage 4 – Clean up**
   - Deprecate JSON files as the source of truth (use them only for backup/export).
   - Keep your UI exactly the same; only data storage and auth/permissions are now more powerful.


## 9. Summary

- You can **keep your current table logic** (no sort, insertion order only) while scaling to:
  - Multiple users.
  - Owner/Supporter roles.
  - Profile-based access control.
  - Per-user saved jobs.
  - Duplicate-application protection.
- The key is to:
  - Use a **single `job_applications` collection/table** with `profile_id` and normalized company name.
  - Add `users` and `user_profile_assignments`.
  - Keep saved jobs either in a separate per-user collection (`saved_jobs`) or as `status = 'saved'` rows.
  - Use a **status flag** for supporters instead of deleting them.

