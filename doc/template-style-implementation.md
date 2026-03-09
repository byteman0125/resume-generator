# Template + Style Implementation (Plan Complete)

Summary of what was implemented for the full "template + style" plan.

## 1. TemplateStyleSidebar (`components/template-style-sidebar.tsx`)

- **Purpose:** Right sidebar on the template page to edit a template’s style (temporary until Save).
- **Props:** `style`, `onChange`, `onSave`, `onClose`.
- **Sections (collapsible):**
  - **Typography:** Font (dropdown), name/title/contact/section/body sizes (pt), line height.
  - **Colors:** Name, title, section, body, contact (color picker + hex input).
  - **Spacing:** Padding top/right/bottom/left, section top/bottom (in), bullet indent, bullet gap (in).
  - **Bullets:** Bullet character dropdown (● • ◦ - * ▪ ▸).
  - **Sections & header:** Show summary, header divider, name/title/contact text align (left/center/right).
- **Actions:** Save (calls `onSave()`), Close (X).

## 2. Skills by category (Template 1 and Template 2)

- **Template 1** (`lib/templates/template-1.tsx`): Skills section now uses `groupSkillsByCategory(skills)` and renders each group with a category header (same convention as Template 2).
- **Template 2** (`lib/templates/template-2.tsx`): Already used `groupSkillsByCategory` with category headers.
- Per `doc/TEMPLATE_CONVENTIONS.md`: category is mandatory; no flat skill list without headers.

## 3. Replacing ResumePreview with lib templates

- **ScaledResumePreview** (`components/scaled-resume-preview.tsx`):
  - Renders a lib template via `getTemplate(templateId).Component` with `data` and `style` (ResumeStyle).
  - Props: `data`, `scale`, `templateId` (default `template-1`), `style`, `forPdf`, `className`.
  - When `forPdf`, the inner wrapper uses `RESUME_PREVIEW_ID` from `lib/generate-pdf` for PDF export.
- **PrintPreviewClient** (`components/print-preview-client.tsx`): Uses `ScaledResumePreview` with `data`, `scale={1}`, `forPdf` (no `styleSettings`).
- **PreviewModal** (`components/preview-modal.tsx`): Renders the default lib template inside a div with `RESUME_PREVIEW_ID`; uses `RESUME_PREVIEW_ID` from `lib/generate-pdf` for PDF download.
- **ResumeEditor** (`components/resume-editor.tsx`): Live preview uses `getTemplate(DEFAULT_TEMPLATE_ID).Component` with `data` and `style={{}}`.

## 4. PDF export ID

- **`lib/generate-pdf.ts`:** Exports `RESUME_PREVIEW_ID = "resume-preview-content"` so any component that needs to be the PDF target can use it.

## 5. Editor page and nav

- **`app/(builder)/editor/page.tsx`:** Replaced with a client redirect to `/template/format1` (no standalone Editor page).
- **`components/app-header.tsx`:** Editor nav link removed. Nav: Profile, Job applications, Templates.

## 6. Template page: PDF download and routing

- **Download PDF:** On `app/(builder)/template/[formatId]/page.tsx`, the preview wrapper has `id={RESUME_PREVIEW_ID}` so client-side PDF export works. A "Download PDF" button calls `downloadResumeAsPdf(RESUME_PREVIEW_ID, filename)`.
- **Nav:** "Templates" in the app header links to `/template/format1` (and is active when `pathname.startsWith("/template/")`).
- **/templates:** The previous list page at `app/(builder)/templates/page.tsx` now redirects to `/template/format1`.

## 7. Bullet character in templates

- **Template 1 and Template 2** read `style.bulletChar` (default `"•"`) and render that character before each bullet list item (experience bullets and, in Template 1, skill items). The sidebar’s Bullets section controls this.

## 8. Already in place (from prior work)

- Style storage: `data/template-styles/<formatId>-style.json`; API `GET/PATCH` at `app/api/templates/[formatId]/style/route.ts` (PATCH disabled in production).
- Template format page: `app/(builder)/template/[formatId]/page.tsx` — preview card, Edit button, right sidebar with `TemplateStyleSidebar`, load/save style via API.
- Format mapping: `lib/template-style-file.ts` — `format1`/`format2` ↔ `template-1`/`template-2`, `FORMAT_LIST`, etc.

## Conventions

- Skills: Category is mandatory; templates show skills **grouped by category with category headers** (see `doc/TEMPLATE_CONVENTIONS.md`).
- Bullet character is configurable in style and stored in the template’s style JSON.
