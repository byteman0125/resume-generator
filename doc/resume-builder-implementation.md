# Resume Builder – Implementation Summary

## What was done

The Resume Builder project was implemented from scratch so it runs locally with a full editing and PDF export flow.

### 1. Project setup

- **package.json** – Next.js 14, React 18, Tailwind CSS, Radix UI (accordion, dialog, label, tabs, slot), `html2pdf.js`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `tailwindcss-animate`
- **next.config.mjs** – default Next config
- **tsconfig.json** – path alias `@/*`
- **tailwind.config.ts** – dark mode `class`, content paths, theme colors from CSS variables (background, foreground, primary, card, etc.), `tailwindcss-animate`
- **postcss.config.mjs** – Tailwind + Autoprefixer
- **.gitignore** – standard Next/Node ignores
- **components.json** – shadcn-style config (baseColor slate, CSS variables)

### 2. App and layout

- **app/globals.css** – Tailwind layers; CSS variables for light/dark (background, foreground, primary, card, muted, border, radius, etc.)
- **app/layout.tsx** – Inter font, `ThemeProvider` wrapping children
- **app/page.tsx** – client page that renders `ResumeEditor`

### 3. Lib and types

- **lib/utils.ts** – `cn()` using `clsx` + `tailwind-merge`
- **lib/resume-store.ts** – types and defaults: `Profile`, `Experience`, `Education`, `Skill`, `ResumeData`; `defaultResumeData`; `createId()`
- **lib/generate-pdf.ts** – `downloadResumeAsPdf(elementId, filename)` using `html2pdf.js` (client-side)
- **types/html2pdf.d.ts** – module declaration for `html2pdf.js`

### 4. UI components (shadcn-style)

- **components/ui/button.tsx** – variants (default, destructive, outline, secondary, ghost, link), sizes
- **components/ui/input.tsx** – styled input
- **components/ui/label.tsx** – Radix Label
- **components/ui/card.tsx** – Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
- **components/ui/tabs.tsx** – Radix Tabs (Tabs, TabsList, TabsTrigger, TabsContent)
- **components/ui/dialog.tsx** – Radix Dialog with overlay, content, header, footer, title, description, close button
- **components/ui/textarea.tsx** – styled textarea
- **components/ui/separator.tsx** – horizontal/vertical
- **components/ui/avatar.tsx** – Avatar, AvatarImage, AvatarFallback
- **components/ui/accordion.tsx** – Radix Accordion (AccordionItem, AccordionTrigger, AccordionContent)

### 5. Feature components

- **components/theme-provider.tsx** – theme state (light/dark/system), `useTheme()`, syncs `class` on `<html>` and `localStorage`
- **components/resume-preview.tsx** – renders `ResumeData` (header with avatar, contact, summary; experience; education; skills). Optional `forPdf` sets `id="resume-preview-content"` for PDF target. Experience bullets support a **style-level global bullet count** and optional **per-company overrides**. The contact line supports a configurable **personal info order** (address / phone / email / birthday) driven from the style page and saved per profile. Typography (font size & color) for name, title, contact line, section headings, and body text can be adjusted on the style page and is also persisted per profile.
- **components/profile-form.tsx** – accordion sections: Profile (name, title, email, phone, location, summary, image URL, LinkedIn, website), Experience (add/remove entries), Education (add/remove), Skills (add/remove). Uses `ResumeData` and `onChange`
- **components/preview-modal.tsx** – Dialog with scrollable `ResumePreview` (forPdf) and “Download PDF” calling `downloadResumeAsPdf(RESUME_PREVIEW_ID, filename)`
- **components/resume-editor.tsx** – header (title, theme toggle, “Preview & PDF” button); two-column layout: left = Card with `ProfileForm`, right = live `ResumePreview`; `PreviewModal` controlled by button

### 6. Run and docs

- **run.sh** – `pnpm install` then `pnpm dev`
- **README.md** – how to install, run, and main scripts/features
- **doc/resume-builder-implementation.md** – this file

## How to run

```bash
cd e:\Project\Resume_Builder
pnpm install
pnpm dev
```

Open http://localhost:3000. Use “Preview & PDF” to open the modal and download the resume as PDF.

## Multiple profiles & local SQLite

- **lib/db.ts** – SQLite (better-sqlite3) with `data/resume.db`. Table `profiles`: id, name, data (JSON), created_at, updated_at. CRUD: listProfiles, getProfile, createProfile, updateProfile, deleteProfile.
- **app/api/profiles/route.ts** – GET (list), POST (create).
- **app/api/profiles/[id]/route.ts** – GET (one + data), PATCH (name and/or data), DELETE.
- **lib/resume-context.tsx** – Extended with: profiles list, currentProfileId, switchProfile(id), createProfile(name), renameProfile(id, name), deleteProfile(id). Data auto-saves to the current profile on edit; “New profile” uses in-memory default until you click “New” to save.
- **components/profile-selector.tsx** – Navbar dropdown to switch profile or choose “New profile”, plus “New” button to create a profile.
- **Profile page** – “This profile” card when a profile is selected: rename name, delete profile (with confirm).
- Database file: `data/resume.db` (created on first run; ignored by git).

## Job applications (home path `/`)

- **Table `job_applications`** in the same SQLite DB: id, date, company_name, title, job_url, profile_id (nullable), resume_file_name, created_at. Resume file name is auto-generated as `profile_company_title_date.pdf` (slugs) when not provided.
- **API**: GET/POST `/api/job-applications`, GET/PATCH/DELETE `/api/job-applications/[id]`.
- **Home page (`/`)** is the job applications view: table with No, Date, Company, Title, Job URL, Profile (selected or Default), Resume file path (resume_file_name). "Add application" opens a dialog (date, company, title, job URL, profile selector). Profile defaults to the currently selected navbar profile. Delete per row. Job URL is a link.

## Job applications table – scroll, memory & layout

- **Scroll + load more:** Scroll handling in `job-applications-view.tsx` listens to the table container and, when you get close to the bottom, automatically increases the number of empty rows in small batches (up to a limit). After the limit, an “Add more” row appears which lets you extend the limit in larger chunks (e.g. next 1000 rows).
- **Simple empty rows:** For stability and predictable behavior, empty rows are rendered directly instead of being virtualized with spacer rows. This keeps the scroll height intuitive and avoids jitter.
- **Resizable columns with persistence:** Column widths for the job applications table are now resizable per column using a drag handle in the header. Widths are stored in `localStorage` under `jobApplicationsColumnWidths` (merged with defaults on load) so user changes persist across page reloads.

## Letter height and multi-page flow

- **components/resume-preview.tsx** – The visible resume is split by letter page height (279 mm). A hidden “measure” div renders the full content; `ResizeObserver` measures its height and converts to mm using the same scale as the 216 mm width. If that height exceeds one page, the preview shows multiple fixed-height “pages” (279 mm each) with `overflow: hidden`; the same content is rendered in each page viewport with `translateY(-i * 279mm)` so content flows from page 1 to 2, etc. Single-page resumes show one block; multi-page resumes show stacked page boxes. Page count is recomputed when `data`, `styleSettings`, or `sectionsOrder` change.

## Notes

- PDF is generated in the browser via `html2pdf.js` from the preview div in the modal.
- Theme is persisted in `localStorage` under `resume-theme`.
- Only the UI components used by the app were added; the rest of the shadcn list from your original file list were omitted to keep the repo minimal.
