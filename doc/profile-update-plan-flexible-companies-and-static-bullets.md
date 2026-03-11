# Plan: Flexible Companies, Static Bullets, and Profile Page Sync

## Overview

This document plans three improvements:

1. **Flexible company count (3–5+)**: Support more than two career entries and use the **second company** (index 1) for “last company” bullets in the GPT flow.
2. **Static bullet content**: In the profile edit modal, add a “Use static bullets” option with a text area (bold support) so you can paste fixed bullet content instead of or before GPT.
3. **Profile page not updating**: After saving in the profile edit modal, the profile cards should reflect new info without a full page refresh.

---

## 1. Flexible company count and “last company” bullets

### Current behavior

- `ResumeData.experience` is already an array; templates render all entries (`experience.map(...)`).
- The **GPT flow** (application modal and bulk) assumes:
  - **Current company** = `experience[0]`
  - **Last company** = `experience[1]`
- So today the system effectively targets “two companies” for AI bullets; the rest are shown on the resume but not fed into “last company” prompts.

### Desired behavior

- Keep supporting **any number** of experience entries (3, 5, or more) on the resume.
- **“Last company” for bullets** = always the **second** experience entry (`experience[1]`), when present.
  - So: first company = current role, second = “last” for prompt wording; additional entries are still shown on the resume and in the data model but are not used as “last company” in the AI pipeline unless we extend the design later (e.g. configurable index).
- No change to `Experience` or `ResumeData` schema; only to where we read “current” vs “last” in the GPT flow.

### Implementation tasks

| Task | Location | Notes |
|------|----------|--------|
| **Done:** Use last-company prompt for all non-current experiences | `desktop/src/components/job-applications-view.tsx` | Step 1 = current (`experience[0]`). Step 2 = loop over `experience[1]`, `[2]`, …; for each, call bulletsLast with that company, set description, accumulate for summary/skills. Applied in bulk pipeline, modal API flow, and modal webview flow. |
| Document convention | This doc, optional `doc/desktop-gpt-button-flow.md` | State that “last company” = second company (index 1); templates already support N entries. |
| Optional later | Profile or app settings | If needed, add “Last company for bullets” = experience index (default 1) so power users can point at 2nd, 3rd, etc. |

---

## 2. Static bullet content in profile (edit modal) (implemented)

### Goal

- In the **profile edit modal** (Edit profile: contact, experience, education), add:
  - A checkbox: **“Use static bullet content”**.
  - When checked, show a **text area** where the user can paste or type bullet content.
- The text area should support **bold** in a way consistent with the application modal (e.g. same paste/formatting behavior or same visual style).
- This content is stored with the profile and can be used when building resumes (e.g. pre-fill current company bullets or use as the single source for that slot).

### Data model

- Add to the stored profile data (e.g. on `ResumeData` or a small extension used by the profile form):
  - `useStaticBullets?: boolean`
  - `staticBulletContent?: string`
- If `useStaticBullets` is true, downstream flows (application modal, bulk generate, PDF) can:
  - **Option A**: Pre-fill the first experience’s `description` with `staticBulletContent` when opening the modal or generating PDF.
  - **Option B**: Use `staticBulletContent` only for “current company” bullets and skip or supplement GPT for that slot.
- Recommendation: start with **Option A** (pre-fill / use as initial content) so the same GPT flow can still run if the user wants to refine; later add Option B (skip GPT for current when static is set) if desired.

### UI (profile edit modal)

| Element | Behavior |
|--------|----------|
| Checkbox | “Use static bullet content” – toggles visibility of the text area and persists `useStaticBullets`. |
| Text area | Multi-line; user pastes or types bullets. Shown only when checkbox is checked. |
| Bold support | Reuse the same approach as in the application modal: e.g. paste HTML with `<b>`/`<strong>` normalized to a stored format (e.g. `**text**`), and/or a small toolbar or shortcut for bold so the stored string supports rich display in the application modal and in PDF. |

### Implementation tasks

| Task | Location | Notes |
|------|----------|--------|
| Extend data model | `lib/resume-store.ts` | Add `useStaticBullets?: boolean` and `staticBulletContent?: string` to the type used for profile data (e.g. `ResumeData` or a wrapper). Ensure `defaultResumeData` and any migrations stay consistent. |
| Profile form | `components/profile-form.tsx` (and desktop copy if any) | Add a section (e.g. under experience or a new “Resume content” section): checkbox + conditional text area. On change, call `onChange` with updated `useStaticBullets` / `staticBulletContent`. |
| Bold in text area | Same form | Reuse logic from `application-resume-editor.tsx`: e.g. paste handler that converts HTML bold to `**`, and/or a simple bold button that wraps selection. Ensure the same convention is used when this content is shown in the application modal. |
| Application modal / PDF | `desktop/.../job-applications-view.tsx`, PDF build | When loading profile data for an application, if `useStaticBullets` and `staticBulletContent` are set, pre-fill the first experience’s `description` (or the “current” slot) with that content so it appears in the editor and in the generated PDF. |

---

## 3. Profile page not updating after edit (implemented)

### Problem

- User edits a profile in the **profile edit modal** and saves (e.g. name, contact, experience, education).
- The in-memory `data` is updated and persisted via `setData` → `saveCurrent` → `PATCH /api/profiles/:id`.
- The **profile list** (`profiles`) is **not** refetched after that PATCH, so the profile **cards** still show old summary data (title, email, experience, education) until the user refreshes the page.

### Cause

- In `lib/resume-context.tsx`, `saveCurrent` explicitly does not refresh the profile list (comment: “Don't refresh profile list on data save”).
- The list is only refreshed on create, rename, delete, and reorder.

### Fix

- After a **successful** `PATCH` in `saveCurrent`, call `refreshProfiles()` so that `GET /api/profiles` runs and the cards get updated summary data (title, email, experience, education, etc.).
- This keeps a single source of truth: the list is derived from the API; after any save, the list is updated so the UI stays in sync.

### Implementation tasks (done)

| Task | Location | Notes |
|------|----------|--------|
| Refresh list after save | `lib/resume-context.tsx` | **Done.** After successful PATCH, `await refreshProfiles()`. `refreshProfiles` in dependency array of `saveCurrent`. |
| Desktop | `desktop/src/lib/resume-context.tsx` | **Done.** Same change applied. |

---

## Implementation order

1. **Profile page sync** (fix refresh after save) – small change, immediate UX win.
2. **Static bullet content** – data model, then profile form (checkbox + text area + bold), then use in application modal/PDF.
3. **Flexible companies** – clarify and document “last company = index 1”; optionally add configurable index later.

---

## Doc references

- GPT flow: `doc/desktop-gpt-button-flow.md`
- Profile/templates parity: `doc/desktop-profile-and-templates-parity.md`
- Application modal: `doc/add-application-modal-layout.md`
