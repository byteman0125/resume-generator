# Template 2: Modern Minimal — Implementation

## What was done

- **Shared template utilities** (`lib/templates/template-utils.ts`)
  - `renderWithBold(text)` — parses `**bold**` and returns React nodes (strings + `<strong>`).
  - `splitBullets(description)` — splits text by newlines into bullet lines.
  - `formatLocation(city, state, location)` — formats location string.
  - `formatDateRange(start, end, current)` — e.g. "Jan 2020 – Present".
  - `groupSkillsByCategory(skills)` — groups skills by optional `category` (for future use).

- **Template 2 component** (`lib/templates/template-2.tsx`)
  - "Modern Minimal" design: Helvetica-style sans-serif, navy accent `#1e3a5f`.
  - Header: name (accent), title, contact row (email, phone, location, LinkedIn, website).
  - Accent bar under header.
  - Sections: Summary, Experience, Education, Skills (flat skill tags with light background).
  - Root has `data-pdf-ready="true"` for PDF pipeline.
  - Imports types from `@/lib/resume-store` and helpers from `./template-utils`.
  - `template2Style` remains a `ResumeStyle` export (empty object) for compatibility with `APPLICATION_RESUME_STYLE` in `resume-store`.

- **Exports and Templates page**
  - `lib/templates/index.ts` exports `Template2` and `template2Style`.
  - Templates page (`app/(builder)/templates/page.tsx`) renders `<Template2 data={sampleResumeData} />` when Template 2 is selected, so the Modern Minimal layout is visible in the preview.

## Files touched

- **Created:** `lib/templates/template-utils.ts`
- **Replaced:** `lib/templates/template-2.tsx` (full Modern Minimal layout)
- **Updated:** `lib/templates/index.ts` (export `Template2`)
- **Updated:** `app/(builder)/templates/page.tsx` (import `Template2`, render preview, description text)
- **Removed:** `lib/templates/template-utils.tsx` (logic moved to `.ts` for correct module resolution)

## Template registry (use template as value)

- **Single Template 2 file:** Only `lib/templates/template-2.tsx` exists (no separate `.ts` re-export file).
- **Registry** (`lib/templates/registry.ts`): Templates are looked up by **id** (value), not embedded in code.
  - `TEMPLATE_IDS` — all template ids.
  - `TEMPLATE_LIST` — `{ id, name, description }[]` for pickers.
  - `getTemplate(id)` — returns `{ Component, style, name, description }` or `undefined`.
  - `DEFAULT_TEMPLATE_ID` — `"template-1"`.
- **Templates page** uses `TEMPLATE_LIST` for the sidebar and `getTemplate(selectedId)` to get `PreviewComponent`; it renders `<PreviewComponent data={...} />` with no hardcoded template names.
- To use a template when applying or generating PDF: pass `templateId` (e.g. from a dropdown), then `getTemplate(templateId)` and use `.Component` and `.style`.

## Notes

- PDF generation still uses Template 1 (`PdfResume`) until the API accepts `templateId` and the print preview renders by template id.
- Skills are shown as a flat list of tags; `groupSkillsByCategory` is available in utils if you want a grouped Skills section later.
