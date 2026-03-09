# Resume PDF Rendering and Adding New Templates

This document describes how the app renders PDFs and how to add or design new resume templates so another tool or platform can implement them.

---

## 1. How PDF is rendered (full pipeline)

### High-level flow

```
Client (Apply modal or Templates page)
  → POST /api/pdf with body: { data: ResumeData }
  → Server: store data in cache (token), open URL in Playwright
  → GET /print/preview?token=... (server-rendered page with same data)
  → Page renders one React template component with that data
  → Playwright waits for [data-pdf-ready="true"], then page.pdf()
  → Server returns PDF bytes to client
  → Client shows PDF in iframe (blob URL) or downloads it
```

### Step-by-step

| Step | Where | What happens |
|------|--------|----------------|
| 1 | Client | Sends `POST /api/pdf` with JSON body `{ data: ResumeData }`. No HTML is sent. |
| 2 | `app/api/pdf/route.ts` | Validates `data` (profile, experience, education, skills). Creates a token, calls `setPdfData(token, data)` to write data to disk (`data/pdf-cache/<token>.json`). |
| 3 | Same route | Builds URL: `{baseUrl}/print/preview?token={token}`. Launches Chromium (Playwright), opens that URL. |
| 4 | `app/print/preview/page.tsx` | Server component: reads `token` from URL, calls `getPdfData(token)` to get `ResumeData`, renders `<PdfResumeClient data={data} />`. |
| 5 | `components/pdf-resume-client.tsx` | Renders `<PdfResume data={data} />`. `PdfResume` is the actual layout (currently re-exported from Template 1). |
| 6 | Template component (e.g. `lib/templates/template-1.tsx`) | Renders a single root element with `data-pdf-ready="true"` and the full resume as HTML (sections, typography, etc.). Uses only `data` (no separate “style” object for this pipeline). |
| 7 | `app/api/pdf/route.ts` | Waits for selector `[data-pdf-ready="true"]`, then `page.pdf({ format: "Letter", printBackground: true, margin: {...} })`. Margins apply to **every page** (including page 2, 3, …); see `doc/PDF_MARGINS_AND_PAGES.md`. |
| 8 | Client | Receives PDF blob, creates `URL.createObjectURL(blob)`, shows in iframe or triggers download. |

So: **input is only `ResumeData`**. The “design” is entirely inside the template component that turns that data into HTML. Playwright then turns that HTML into PDF.

---

## 2. Data shape: what the template receives

Every template component receives a single prop: **`data: ResumeData`**.

### Type definitions (from `lib/resume-store.ts`)

```ts
interface Profile {
  name: string;
  title: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  location: string;   // legacy single-line
  birthday: string;
  summary: string;
  image?: string;
  linkedin?: string;
  website?: string;
}

interface Experience {
  id: string;
  company: string;
  role: string;
  location?: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;   // multiline, bullets often \n-separated; **bold** supported
}

interface Education {
  id: string;
  school: string;
  degree: string;
  field?: string;
  startDate: string;
  endDate: string;
  description?: string;
}

interface Skill {
  id: string;
  name: string;
  category?: string;   // e.g. "Languages", "Frameworks"
  level?: string;
}

interface ResumeData {
  profile: Profile;
  experience: Experience[];
  education: Education[];
  skills: Skill[];
}
```

### Text formatting in content

- **Bold:** Text between `**` is bold (e.g. `**Category**: text`).
- **Bullets:** In `profile.summary` and `experience[].description`, bullets are usually one per line (`\n`). The template can split on `\n` and render as list items.
- **Optional:** Strip a leading bullet character like `●` or `-` if present before rendering.

---

## 3. What you must implement for a new template

### 3.1 One file per template

- **Location:** `lib/templates/template-<N>.tsx` (e.g. `template-3.tsx`).
- **Exports:**
  - A React component that renders the resume layout. It must:
    - Accept exactly one prop: `data: ResumeData`.
    - Render a **single root element** that has the attribute **`data-pdf-ready="true"`** (so Playwright knows when to capture).
    - Use the data to render profile, experience, education, skills (or a subset).
  - Optionally export a `template<N>Style: ResumeStyle` object if you later use it for non-PDF preview (e.g. style settings).

### 3.2 Technical constraints (for PDF capture)

- **Root element:** One wrapper (e.g. `<div>`) with `data-pdf-ready="true"`.
- **Page size:** Layout should fit US Letter (e.g. max width ~7.5in or 816px) so it prints cleanly. Playwright uses `format: "Letter"` and margins (e.g. top 0.7in, bottom 0.5in, left/right 0.65in).
- **Print-friendly:** Use `printBackground: true` if you rely on background colors.
- **Styling:** Use Tailwind CSS and/or inline styles. Fonts/sizes in the template file define the “design”; no separate HTML is passed in.

### 3.3 Reference implementation: Template 1

- **File:** `lib/templates/template-1.tsx`.
- **Exports:** `template1Style`, `PdfResume`.
- **Structure:** Header (name, title, contact) → Summary → Professional Experience → Education → Skills & Technologies. Uses `renderWithBold()` for `**bold**`, `formatContact()` for contact line, and splits `description` by `\n` for bullets.
- **Critical:** Root `<div ... data-pdf-ready="true" style={{ maxWidth: "7.5in" }}>`.

You can copy this file, rename to `template-3.tsx`, and change layout/typography/colors to get a new design; the **data contract** stays the same.

---

## 4. Wiring a new template into the app

### 4.1 Barrel export

In **`lib/templates/index.ts`** add:

```ts
export { PdfResume, template1Style } from "./template-1";
export { template2Style } from "./template-2";
export { Template3Resume, template3Style } from "./template-3";  // example
```

### 4.2 Use this template for PDF generation

Right now **all** PDFs use the same component: the one re-exported as `PdfResume` from `components/pdf-resume.tsx`, which comes from `lib/templates/index.ts` (Template 1).

To use a **different** template for PDF:

- **Option A – Single “active” template:** Keep one global `PdfResume`. To switch to Template 3, change `components/pdf-resume.tsx` to re-export the component from `template-3` (or from the barrel), and ensure the print preview and API still render that same component.
- **Option B – Template chosen by request:** Extend the API to accept a template id (e.g. `body: { data, templateId: "template-3" }`). Store `templateId` in the cache with the data. Then:
  - **Print preview page** (`app/print/preview/page.tsx`): Read `templateId` from cache (you’d need to store it next to `data`), and render the corresponding component (e.g. `<Template3Resume data={data} />` or a map of id → component).
  - **PdfResumeClient** would need to receive `templateId` and render the right template, or the print page would render the template directly instead of going through PdfResumeClient.

So today: **no template id is passed**; the design is fixed by whatever component is rendered under `/print/preview` (currently Template 1’s `PdfResume`).

### 4.3 Templates page (preview list)

- **File:** `app/(builder)/templates/page.tsx`.
- **Behavior:** Template 1 triggers a PDF fetch and shows it in an iframe. Template 2 shows “Empty” (no design).
- To add Template 3: add an entry to the `TEMPLATES` array and, when `selectedId === "template-3"`, either call `POST /api/pdf` (if the API can return Template 3’s PDF) and show the iframe, or show “Empty” until that template is wired end-to-end.

---

## 5. Checklist for another tool creating a new template

1. **Implement a single React component** that:
   - Takes `{ data: ResumeData }`.
   - Renders one root node with `data-pdf-ready="true"`.
   - Renders `data.profile`, `data.experience`, `data.education`, `data.skills` (layout and styling are up to you).
2. **Use the data types above** (Profile, Experience, Education, Skill, ResumeData). Optional fields can be omitted in the UI.
3. **Support `**bold**`** in text fields (e.g. summary, experience description) if you want parity with the app.
4. **Keep width within Letter** (e.g. max width 7.5in) and avoid huge fixed heights so the PDF is one or more Letter pages.
5. **Save the component** in `lib/templates/template-<N>.tsx` and export it (and optionally a `template<N>Style`).
6. **Register** in `lib/templates/index.ts`.
7. **Switch PDF to this design** by either making `pdf-resume.tsx` re-export this component, or by adding template selection to the API + print preview and using this component when the chosen template is this one.

---

## 6. File map (quick reference)

| File | Role |
|------|------|
| `app/api/pdf/route.ts` | Receives `data`, caches it, opens `/print/preview?token=...`, captures PDF with Playwright. |
| `lib/pdf-cache.ts` | `setPdfData(token, data)`, `getPdfData(token)`, `createToken()`. |
| `app/print/preview/page.tsx` | Loads data by token, renders `<PdfResumeClient data={data} />`. |
| `components/pdf-resume-client.tsx` | Renders `<PdfResume data={data} />`. |
| `components/pdf-resume.tsx` | Re-exports `PdfResume` from `@/lib/templates` (currently Template 1). |
| `lib/templates/index.ts` | Barrel: exports template components and style objects. |
| `lib/templates/template-1.tsx` | Template 1: `PdfResume` + `template1Style`. |
| `lib/templates/template-2.ts` | Template 2: only `template2Style` (no PDF component yet). |
| `lib/resume-store.ts` | Defines `ResumeData`, `Profile`, `Experience`, `Education`, `Skill`, `ResumeStyle`. |

---

## 7. Summary

- **PDF = data only:** The API gets `ResumeData` and passes it to a single React template. The template’s JSX + CSS **is** the design. No HTML string is sent from the client.
- **One template component per design:** Implement a component that receives `ResumeData`, renders HTML with `data-pdf-ready="true"`, and fits Letter size. That component can live in `lib/templates/template-<N>.tsx`.
- **To add a new design:** Add the new template file, export it from `lib/templates/index.ts`, and either replace the current `PdfResume` re-export or add template selection (API + print preview) and render the new component when that template is selected.

This is everything another platform or tool needs to implement new resume designs and plug them into the same PDF pipeline.

---

## 8. PDF cache cleanup (scheduled job)

PDF cache files are stored under `data/pdf-cache/` with a 5-minute TTL. Expired entries are removed when `getPdfData` runs, but untouched files can remain on disk. A scheduled job clears them.

- **API:** `GET /api/cron/clear-pdf-cache`  
  - Calls `clearExpiredPdfCache()` and returns `{ ok: true, removed: number }`.
- **Auth:** If `CRON_SECRET` is set in the environment, the request must send it via `Authorization: Bearer <CRON_SECRET>` or `?secret=<CRON_SECRET>`.
- **Local env:** The Vercel cron does **not** run when you use `next dev`. Locally, expired cache is cleared automatically on **every PDF request** (the `POST /api/pdf` handler calls `clearExpiredPdfCache()` before creating a new token). So you don't need to run anything extra locally.
- **Vercel / production:** `vercel.json` has a cron that hits this route every 5 minutes (`*/5 * * * *`). Set `CRON_SECRET` in the project env if you want to require auth.
- **Other hosts:** Use system cron, GitHub Actions, or any scheduler to call this endpoint every 5 minutes (with the secret if `CRON_SECRET` is set).
- **Implementation:** `lib/pdf-cache.ts` exports `clearExpiredPdfCache()`; the route is in `app/api/cron/clear-pdf-cache/route.ts`.
