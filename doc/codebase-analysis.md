# Resume Builder – Codebase Analysis

**Date:** March 2025 (updated)  
**Scope:** Full project analysis (app, lib, components, APIs, templates, data flow).

---

## 1. Project overview

- **Stack:** Next.js 14, React 18, TypeScript, Tailwind CSS, Radix UI (accordion, dialog, label, tabs), html2pdf.js (client PDF), Playwright (server PDF), Framer Motion, Lucide React.
- **Purpose:** Multi-profile resume editor with multiple templates, job-application tracking, AI-assisted content (DeepSeek), and PDF export (browser and server).

---

## 2. Directory structure (source)

| Path | Role |
|------|------|
| **app/** | Next.js App Router: pages, layouts, API routes |
| **app/(builder)/** | Builder flows: profile, editor, template/[formatId], templates list |
| **app/ai/** | AI prompts config page |
| **app/applications/** | Job applications list page |
| **app/print/** | Print preview (token-based, for server PDF) |
| **app/api/** | REST endpoints: profiles, job-applications, pdf, ai (prompts, generate), templates style, settings, cron |
| **lib/** | Core types, DB, templates, PDF cache, resume context, utils |
| **lib/templates/** | Template components (1–4), registry, utils, style file I/O |
| **components/** | UI primitives (shadcn-style), feature components (resume-preview, pdf-resume, job-applications-view, etc.) |
| **data/** | JSON persistence (gitignored): profiles.json, job-applications.json, settings.json, ai-prompts.json, template-styles, pdf-cache, job-pdfs |

---

## 3. Data layer

### 3.1 Persistence (`lib/db.ts`)

- **File-based:** No SQLite; all data in `data/` as JSON.
- **Profiles:** `data/profiles.json` — array of `{ id, name, data (ResumeData JSON), created_at, updated_at }`. CRUD: list, get, create, update, delete, reorder.
- **Job applications:** `data/job-applications.json` — array of `{ id, date, company_name, title, job_url, profile_id, resume_file_name, job_description, created_at }`. CRUD + slug-based default `resume_file_name`. **No sort:** `listJobApplications()` returns storage order (insertion order), not sorted by date.
- **Settings:** `data/settings.json` — `{ activeProfileId }`. Read/write via `getActiveProfileId` / `setActiveProfileId`.

### 3.2 Types (`lib/resume-store.ts`)

- **ResumeData:** profile, experience[], education[], skills[].
- **Profile:** name, title, email, phone, address, city, state, postalCode, location, birthday, summary, image, linkedin, website.
- **Experience / Education / Skill:** id, plus role-specific fields; Skill has category for grouping.
- **ResumeStyle:** extensive options (section order, padding, typography sizes/colors, bullet char/indent/gap, visibility toggles, page-break controls, fontFamily, etc.).
- **StoredProfileData:** ResumeData & { style?: ResumeStyle }.
- **ResumePreviewStyleSettings:** derived from ResumeStyle for preview/PDF (margins, typography, visibility). Conversion: `styleSettingsFromStyle`, `resumeStyleFromSettingsPatch`, `getApplicationResumeStyleSettings`.

---

## 4. Templates

### 4.1 Registry (`lib/templates/registry.ts`)

- **TemplateId:** "template-1" | "template-2" | "template-3" | "template-4".
- **TemplateEntry:** id, name, description, Component({ data, style }), style (ResumeStyle).
- **FormatId (URL):** format1–format4; mapped in `lib/template-format.ts` (FORMAT_TO_TEMPLATE_ID, FORMAT_LIST, default styles per format).

### 4.2 Template components

- **Template 1 (`template-1.tsx`):** PdfResume — Tailwind-based, section order, bullet count (global + per-experience), typography from style.
- **Template 2 (`template-2.tsx`):** “Modern Minimal” — inline styles, navy accent, Helvetica; skills as plain text “Category: skill1, skill2” (no colored boxes).
- **Template 3 (`template-3.tsx`):** “Crisp” — two-row header, Arial; skills same plain-text style as template 2.
- **Template 4 (`template-4.tsx`):** “Ivory” — cream/brown, serif, double-line dividers; skills as “Category: skill1 · skill2”.

Shared helpers in `template-utils.ts`: `renderWithBold`, `splitBullets`, `formatLocation`, `formatDateRange`, `groupSkillsByCategory`.

### 4.3 Template styles

- **File I/O:** `lib/template-style-file.ts` — read/write per-format JSON in `data/template-styles/` (dev-only writes). Defaults in `getDefaultTemplateStyle(formatId)`.
- **API:** GET/PUT `app/api/templates/[formatId]/style/route.ts` for loading/saving style per format.

---

## 5. API routes

| Route | Methods | Purpose |
|-------|---------|---------|
| **/api/profiles** | GET, POST | List profiles; create profile (name + ResumeData) |
| **/api/profiles/[id]** | GET, PATCH, DELETE | Get/update (name, data)/delete profile |
| **/api/profiles/[id]/pdf** | GET | Profile PDF (likely uses same PDF pipeline as below) |
| **/api/job-applications** | GET, POST | List (storage order, no sort); create application |
| **/api/job-applications/[id]** | GET, PATCH, DELETE | Get/update/delete application |
| **/api/job-applications/[id]/pdf** | GET | Generate and return PDF for that application (resume + template/style) |
| **/api/pdf** | POST | Body: { data: ResumeData, templateId? }. Creates token, stores in pdf-cache, opens Playwright, hits /print/preview?token=…, returns PDF bytes. |
| **/api/pdf-data** | (if used) | Likely returns payload for a token (used by print preview). |
| **/api/ai/prompts** | GET, PUT | Read/write `data/ai-prompts.json` (summary, bulletsCurrent, bulletsLast, skills). |
| **/api/ai/generate** | POST | Body: apiKey?, mode (bulletsCurrent | bulletsLast | summary | skills), jobDescription, currentCompany, lastCompany, prompts, optional generatedBullets. Uses **only** user prompts (no built-in fallbacks); fills {{company}}, {{job_description}}; calls DeepSeek chat/completions; returns { mode, text, usage }. |
| **/api/settings** | GET, PATCH | Read/update settings (e.g. activeProfileId). |
| **/api/cron/clear-pdf-cache** | GET/POST | Clears expired pdf-cache entries. |

---

## 6. PDF flow

### 6.1 Server-side PDF (`/api/pdf`, job application PDF)

1. Request body: ResumeData + optional templateId.
2. `pdf-cache`: create token, write `data/pdf-cache/{token}.json` (storedAt, data, templateId). TTL 5 min; `clearExpiredPdfCache` runs on each PDF request (and via cron).
3. Playwright: launch Chromium, open `/print/preview?token=…`, wait for `[data-pdf-ready="true"]`, then `page.pdf()` with letter size and margins from `lib/pdf-constants`.
4. Response: PDF bytes, `Content-Disposition: inline; filename="…"`.

### 6.2 Print preview page (`app/print/preview/page.tsx`)

- Server component: reads `token` from searchParams, `getPdfData(token)` from pdf-cache. If missing/expired, renders error and `data-pdf-ready="error"`. Otherwise renders `PdfResumeClient` with `payload.data` and `payload.templateId`.

### 6.3 Client PDF (`lib/generate-pdf.ts`)

- `downloadResumeAsPdf(elementId, filename)` uses html2pdf.js on a DOM element (e.g. `resume-preview-content`), margin 0, letter, pagebreak CSS/legacy. Used where the app exports from the visible preview (e.g. builder).

### 6.4 PdfResumeClient (`components/pdf-resume-client.tsx`)

- Renders a wrapper (letter width, white background) and the template Component from registry (by templateId or default), with `data` and `stored?.style`. No inline template list; single component per view.

---

## 7. AI flow

- **Prompts:** Stored in `data/ai-prompts.json`; editable on `/ai` page; loaded/saved via `/api/ai/prompts`.
- **Generate:** Client (e.g. job-applications-view) sends to `/api/ai/generate` with user’s apiKey (or env DEEPSEEK_API_KEY), mode, job description, company names, and prompts. API builds a single prompt from the user’s template (and optional “Here are the experience bullets…” for summary/skills). DeepSeek model/config from env (DEEPSEEK_MODEL, DEEPSEEK_API_BASE). Response: `{ mode, text, usage }`.
- **API key:** Client stores key in `localStorage` (`resume-builder-ai-api-key`); persisted on blur and on “Save key” on `/ai` page; sent in request body (not stored on server).

---

## 8. Key components

### 8.1 Layout and shell

- **app/layout.tsx:** Inter font, ThemeProvider, ResumeProvider, ConditionalShell.
- **ConditionalShell:** Wraps children; likely shows AppHeader/nav only on certain routes.
- **AppHeader:** Nav links, profile selector, theme.

### 8.2 Resume editing and preview

- **ResumeProvider (`lib/resume-context.tsx`):** Holds profiles, current profile id, resume data; provides load/save/switch/create/delete profile; syncs to API and local state.
- **ResumePreview (`components/resume-preview.tsx`):** Large component: renders header (name, title, contact), summary, experience, education, skills from ResumeData; respects style settings (section order, bullet count, typography, visibility, page breaks). Can be editable (bullets), draggable sections, forPdf with RESUME_PREVIEW_ID for client PDF.
- **PdfResume (`components/pdf-resume.tsx`):** Uses template from registry (e.g. template-1) and style; renders the same structure for PDF.
- **ProfileForm:** Accordion: profile, experience, education, skills; uses ResumeData + onChange.
- **TemplateStyleSidebar:** Edits style (ResumeStyle) for the selected format; reads/writes via API or local state.

### 8.3 Job applications

- **JobApplicationsView (`components/job-applications-view.tsx`):** Large component. Table of applications (columns: No, Date, Company, Title, Job URL, Profile, Resume file name, actions). **Search & filter:** Search bar above table (live match count, search input, up/down nav buttons, profile filter dropdown). **Profile filter:** When a profile is selected, table shows only rows with that `profile_id` (`dataRows`); empty rows and “Add more” only when “All profiles”. **Search:** Matches in date, company, title, jobUrl, profile, resume (case-insensitive); Ctrl+F focuses search bar (browser find prevented via document keydown capture); F3 = next match, Shift+F3 = previous; selection and scroll follow current match. “Add” / “Apply” opens a modal: form + resume editor/preview and AI actions. API key from localStorage for `/api/ai/generate`. Resizable columns (localStorage); scroll/load-more for large lists. Spec: `doc/search-feature.md`.

### 8.4 Builder pages

- **Profile page:** Current profile card; rename, delete.
- **Editor page:** Likely ResumeEditor: form + preview + preview modal.
- **Templates page:** List of formats/templates.
- **Template [formatId] page:** Pick template, edit style (TemplateStyleSidebar), preview.

---

## 9. State and data flow (summary)

- **Profiles and resume data:** ResumeProvider + API (profiles CRUD). Current profile and its ResumeData drive the builder and preview.
- **Job applications:** Table and modal read/write via `/api/job-applications` and `/api/job-applications/[id]`; PDF via `/api/pdf` or `/api/job-applications/[id]/pdf` with ResumeData + template/style.
- **Template/style:** Format chosen in UI; style loaded from `data/template-styles/{formatId}-style.json` or defaults; saved via `/api/templates/[formatId]/style` or template-style-file in dev.
- **PDF:** Either client (html2pdf.js on preview div) or server (Playwright + tokenized print preview). Cache is token-based, short TTL, cleaned on demand and by cron.

---

## 10. Conventions and patterns

- **Templates:** All receive `data: ResumeData` and `style?: ResumeStyle`; use template-utils for bullets, dates, location, skill grouping; follow TEMPLATE_CONVENTIONS (section headers, skills by category).
- **Styles:** ResumeStyle is the source of truth; converted to ResumePreviewStyleSettings for preview/PDF; patches from UI converted back via `resumeStyleFromSettingsPatch`.
- **API:** JSON in/out; 400 for validation (e.g. missing prompt/mode/apiKey), 500 on server errors; PDF routes return binary or JSON error.

---

## 11. Possible improvements (concise)

1. **Modularity:** Split `job-applications-view.tsx` and `resume-preview.tsx` into smaller components/hooks (table, row, modal, apply form, preview block, etc.) for readability and reuse.
2. **DB layer:** If scale or consistency becomes important, consider abstracting persistence (e.g. Repository interface) so switching from file-based to DB is localized.
3. **API key:** Already client-only and optional env server-side; ensure no logging of key in API route.
4. **Error handling:** Standardize API error shape (e.g. `{ error: string, code?: string }`) and client handling/toasts.
5. **Tests:** Add unit tests for template-utils, buildPrompt (AI), and style conversion; integration tests for critical API routes and PDF token flow.
6. **Types:** Keep shared types in `resume-store.ts`; avoid duplicating Prompts/GenerateRequestBody between API and client if they drift.
7. **Docs:** Keep `doc/` updated when adding features (e.g. AI prompt-only behavior, template skill display changes) as in this analysis.

---

## 12. Recent behavior (summary)

- **Job applications list:** No sorting; order is storage/insertion order (`lib/db.ts` `listJobApplications()` returns `readJobApplications()` as-is).
- **Data folder:** Entire `/data/` directory is gitignored; repo no longer tracks any files under `data/`.
- **Applications table:** Search bar with match count, profile filter, up/down match navigation; Ctrl+F and F3/Shift+F3; browser find suppressed on the applications page.

---

## 13. File reference (key files)

- **Data & types:** `lib/db.ts`, `lib/resume-store.ts`
- **Templates:** `lib/templates/registry.ts`, `lib/templates/template-*.tsx`, `lib/templates/template-utils.ts`, `lib/template-format.ts`, `lib/template-style-file.ts`
- **PDF:** `lib/pdf-cache.ts`, `lib/pdf-constants.ts`, `lib/generate-pdf.ts`, `app/api/pdf/route.ts`, `app/print/preview/page.tsx`, `components/pdf-resume-client.tsx`
- **AI:** `app/api/ai/generate/route.ts`, `app/api/ai/prompts/route.ts`, `app/ai/page.tsx`
- **Profiles & settings:** `app/api/profiles/route.ts`, `app/api/profiles/[id]/route.ts`, `app/api/settings/route.ts`, `lib/resume-context.tsx`
- **Job applications:** `app/api/job-applications/route.ts`, `app/api/job-applications/[id]/route.ts`, `app/api/job-applications/[id]/pdf/route.ts`, `components/job-applications-view.tsx`
- **UI:** `app/layout.tsx`, `components/conditional-shell.tsx`, `components/resume-preview.tsx`, `components/application-resume-editor.tsx`, `components/profile-form.tsx`
- **Docs:** `doc/codebase-analysis.md`, `doc/search-feature.md`
