# Multi-User Design: Owner & Supporter with Role-Based Access

## Scenario Summary

- **Owner**: Sees all profiles and all job applications; has a manager portal to list supporters and assign profiles; can use AI page.
- **Supporter**: Registers an account; sees only **assigned** profile(s) and job applications for those profiles; cannot see AI page; access is job-application channel only.
- **Auth**: Login page; role-based access; supporters can self-register; owner sees supporters in manager portal and assigns profiles to them.

---

## Recommended Database: **PostgreSQL**

- Multiple concurrent users, user isolation, and relationships (users → assignments → profiles → applications) are easier and safer with a real DB.
- **SQLite** is an option for a small team and single-server deploy (no separate DB server); use it if you prefer minimal setup. Schema below works for both; use PostgreSQL for production with “several people.”

---

## Database Schema

### 1. `users`

| Column         | Type        | Notes                    |
|----------------|-------------|--------------------------|
| id             | UUID (PK)   |                          |
| email          | VARCHAR     | UNIQUE, NOT NULL         |
| password_hash  | VARCHAR     | NOT NULL (bcrypt)        |
| role           | VARCHAR     | `'owner'` \| `'supporter'` |
| name           | VARCHAR     | optional                 |
| created_at     | TIMESTAMPTZ |                          |
| updated_at     | TIMESTAMPTZ |                          |

- One or more owners (e.g. first user or seeded). Supporters register and get `role = 'supporter'`.

### 2. `profiles`

| Column      | Type        | Notes                          |
|-------------|-------------|--------------------------------|
| id          | UUID (PK)   |                                |
| name        | VARCHAR     |                                |
| data        | TEXT/JSONB  | Resume JSON                    |
| sort_order  | INT         | For display order              |
| created_at  | TIMESTAMPTZ |                                |
| updated_at  | TIMESTAMPTZ |                                |

- No `user_id` here: profiles are “global” from the owner’s perspective. Owner sees all; supporter sees only those assigned to them via `user_profile_assignments`.

### 3. `user_profile_assignments`

| Column      | Type        | Notes                          |
|-------------|-------------|--------------------------------|
| user_id     | UUID (PK,FK)| → users.id (supporter)         |
| profile_id  | UUID (PK,FK)| → profiles.id                  |
| assigned_by | UUID (FK)   | → users.id (owner)             |
| assigned_at | TIMESTAMPTZ |                                |

- Which supporter can see which profile. Owner assigns; supporter’s list of profiles = rows where `user_id = current_user.id`.

### 4. `job_applications`

| Column           | Type        | Notes        |
|------------------|-------------|--------------|
| id               | UUID (PK)   |              |
| date             | VARCHAR     |              |
| company_name     | VARCHAR     |              |
| title            | VARCHAR     |              |
| job_url          | VARCHAR     | nullable     |
| profile_id       | UUID (FK)   | → profiles.id|
| resume_file_name | VARCHAR     |              |
| job_description  | TEXT        |              |
| created_at       | TIMESTAMPTZ |              |

- Optional: `created_by` (FK → users) to track who added the row. For “supporter sees only assigned profile’s applications,” filtering by `profile_id IN (assigned_profile_ids)` is enough.

### 5. `settings`

| Column            | Type        | Notes        |
|-------------------|-------------|--------------|
| user_id           | UUID (PK,FK)| → users.id   |
| active_profile_id | UUID (FK)   | → profiles.id, nullable |

- Per-user “current profile” (e.g. for builder/PDF). Owner: any profile; supporter: only one of their assigned profiles.

### 6. Job PDFs on disk

- Keep `data/job-pdfs/{application_id}.pdf` as now. No DB change.

---

## Role-Based Access Rules

| Resource / Action        | Owner                         | Supporter                                      |
|--------------------------|-------------------------------|------------------------------------------------|
| Login                    | Yes                           | Yes (after registration)                      |
| All profiles             | Yes                           | No – only assigned (via user_profile_assignments) |
| All job applications     | Yes                           | No – only applications whose profile_id is in assigned set |
| Assign profile to user   | Yes (manager portal)          | No                                             |
| Manager portal (list supporters, assign) | Yes                    | No (route hidden or 403)                       |
| AI page                  | Yes                           | No (route hidden or 403)                      |
| Create / edit / delete applications | Yes (any profile)      | Yes (only for assigned profiles)              |
| Create / edit profiles   | Yes                           | No (only owner creates profiles)              |

- **Owner**: `listProfiles()` → all; `listJobApplications()` → all; can list users where role = supporter; can create/update/delete assignments.
- **Supporter**: `listProfiles()` → only profiles in `user_profile_assignments` for current user; `listJobApplications()` → only where `profile_id IN (assigned profile ids)`; no AI page, no manager portal.

---

## Auth & Registration Flow

1. **Login page**: Email + password → validate, create session (e.g. JWT or session cookie), store `user.id` and `user.role`.
2. **Registration**: New user signs up → insert into `users` with `role = 'supporter'` (or pending until owner approves, if you add that later).
3. **Owner**: Seeded or first user; or set `role = 'owner'` in DB for your account.
4. Every API route that returns profiles or applications checks `req.user.role` and, if supporter, filters by `user_profile_assignments` and allowed `profile_id`s.

---

## API Layer (conceptual)

- **Auth middleware**: Resolve session/JWT → `req.user = { id, email, role }`. Return 401 if not logged in.
- **Profile list**:  
  - Owner: `SELECT * FROM profiles ORDER BY sort_order`.  
  - Supporter: `SELECT p.* FROM profiles p JOIN user_profile_assignments a ON a.profile_id = p.id WHERE a.user_id = :userId ORDER BY p.sort_order`.
- **Application list**:  
  - Owner: `SELECT * FROM job_applications ORDER BY created_at` (or your chosen order).  
  - Supporter: same query but `WHERE profile_id IN (SELECT profile_id FROM user_profile_assignments WHERE user_id = :userId)`.
- **Manager portal (owner only)**:  
  - List supporters: `SELECT * FROM users WHERE role = 'supporter'`.  
  - Assign profile: `INSERT INTO user_profile_assignments (user_id, profile_id, assigned_by) VALUES (...)`.
- **AI routes**: Check `req.user.role === 'owner'` (or equivalent); return 403 for supporters.

---

## Suggested Stack

- **DB**: PostgreSQL (or SQLite for small single-server).
- **ORM / queries**: Prisma or Drizzle (migrations, type-safe queries).
- **Auth**: NextAuth.js (credentials provider, JWT or DB sessions) or custom JWT with bcrypt for passwords.
- **File store**: Keep `data/job-pdfs/{id}.pdf` and `data/profiles.json`-style data in `profiles.data` (or move profile JSON into DB as in schema above).

---

## Migration from Current JSON Setup

1. Add PostgreSQL (and Prisma or Drizzle), define the tables above.
2. Migrate existing `data/profiles.json` → `profiles` table; `data/job-applications.json` → `job_applications` table; `data/settings.json` → `settings` keyed by a single “default” owner user.
3. Create one owner user (e.g. your email), set `active_profile_id` in `settings` for that user.
4. Replace current file-based `lib/db.ts` with DB calls that respect `userId` and `role` (owner vs supporter) and use `user_profile_assignments` for supporters.
5. Add login page, auth middleware, and manager portal (owner-only) for listing supporters and assigning profiles.
6. Hide AI page (and any other owner-only features) in the UI for supporters and enforce in API with role checks.

This gives you a clear path from “JSON file for job application manage” to “multi-user, role-based, owner/supporter” on a proper DB with a structure that matches your scenario.
