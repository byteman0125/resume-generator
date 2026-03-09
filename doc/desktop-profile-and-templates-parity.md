# Desktop: Profile & Template Pages Parity

## Summary

Aligned the desktop app’s **Profile** and **Templates** pages with the web app so they look and behave the same, and fixed why the template page “wasn’t working.”

---

## 1. Why the profile page was different

The desktop had a **simplified** profile page: only a list of profile cards with “Set active” and “New profile.”  
The web app has a **full** profile page with:

- **Profile cards**: Copyable name, email, address, phone, birthday, LinkedIn; career/education preview
- **Drag-and-drop** to reorder profiles
- **Set active** (star) and **Edit** (pencil) opening a modal
- **Context menu** (right-click) to remove a profile
- **New profile** with `defaultResumeData` and opening the edit modal
- **Profile edit modal** with full form: basic info, experience, education (accordion sections)

### What was done

- **UI**
  - Added `desktop/src/components/ui/accordion.tsx` (Radix accordion).
  - Added `desktop/src/lib/usa-locations.ts` (US states; cities still loaded from `/api/usa-cities`).
- **Profile form & modal**
  - Ported `profile-form.tsx` (Profile + Experience + Education + Skills with drag reorder, accordion).
  - Ported `profile-edit-modal.tsx` (dialog wrapping `ProfileForm` with sections profile, experience, education).
- **Profile page**
  - Replaced the simple profile page with the full one: grid of cards, copyable lines, drag handle, star, edit button, context menu (Remove), “New profile” that creates with `defaultResumeData` and opens the modal.
  - No framer-motion; plain `div` layout.
- **Dependency**
  - `@radix-ui/react-accordion` added for the profile form.

Result: Desktop profile page now matches the web (same layout, edit modal, reorder, delete, copy).

---

## 2. Why the template page wasn’t working

The desktop **Templates** page was a **placeholder**: a single card saying to use the web app for template features.  
The web app has a real **template format** page that:

- Lists templates in a sidebar and shows a selected template’s **PDF preview** (from `/api/pdf`).
- Loads/saves **template style** via `/api/templates/:formatId/style` (GET/PATCH).
- Lets you **edit style** in a sidebar (typography, colors, spacing, bullets, alignment).
- **Download PDF** for the current template with sample data.

### What was done

- **Templates lib**
  - `desktop/src/lib/templates/template-utils.ts` – shared helpers (e.g. `groupSkillsByCategory`, `formatDateRange`).
  - `template-1.tsx` … `template-4.tsx` – same four resume templates as web (PdfResume, Template2, Template3, Template4).
  - `desktop/src/lib/templates/index.ts` – registry and `getTemplate(id)`.
- **Template style sidebar**
  - Ported `template-style-sidebar.tsx` (font, sizes, colors, spacing, bullets, section/header options).
- **Template page**
  - Replaced the placeholder with the full flow:
    - `useParams()` for `formatId`, `useNavigate()` to redirect invalid format to `/template/format1`.
    - Left sidebar: template list using `Link` to `/template/format1` … `format4`.
    - Load style with `GET /api/templates/:formatId/style`; generate PDF with `POST /api/pdf` (sample data + current style).
    - Center: PDF preview in an iframe, or live React preview when “Edit” is open.
    - “Edit” opens the style sidebar; “Save” calls `PATCH /api/templates/:formatId/style`.
    - “Download PDF” uses the current blob URL.
- **Routing**
  - Single route: `/template/:formatId` (replacing four separate `/template/format1` … `format4` routes). Header “Templates” still links to `/template/format1`.

Result: Desktop template page now works like the web: choose template → see PDF → edit style → save → download PDF (backend must be running and reachable).

---

## Files touched / added

| Area | Files |
|------|--------|
| Profile – UI | `desktop/src/components/ui/accordion.tsx`, `desktop/src/lib/usa-locations.ts` |
| Profile – form/modal | `desktop/src/components/profile-form.tsx`, `desktop/src/components/profile-edit-modal.tsx` |
| Profile – page | `desktop/src/pages/ProfilePage.tsx` (full rewrite) |
| Templates – lib | `desktop/src/lib/templates/template-utils.ts`, `template-1.tsx` … `template-4.tsx`, `index.ts` |
| Templates – sidebar | `desktop/src/components/template-style-sidebar.tsx` |
| Templates – page & routes | `desktop/src/pages/TemplatePage.tsx` (full rewrite), `desktop/src/App.tsx` (single `/template/:formatId` route) |

---

## How to verify

1. **Profile**
   - Open Profile: same card grid, copyable fields, drag reorder, set active, edit (modal with full form), right-click Remove, New profile → modal.
2. **Templates**
   - Open Templates: sidebar with 4 templates, PDF preview (or “Generating PDF…” / error if backend is down), Edit → style sidebar, Save, Download PDF. Backend must serve `/api/templates/:formatId/style` and `/api/pdf`.

Build: `npm run build` in `desktop/` (completed successfully).
