# Validation check – profile refresh, static bullets, last-company flow

**Date:** 2025-03  
**Scope:** Recent changes (profile refresh after save, static bullet content, last-company prompt for all non-current experiences).

---

## Lint

- **Result:** No linter errors in modified files.
- **Files:** `lib/resume-context.tsx`, `desktop/src/lib/resume-context.tsx`, `desktop/src/components/job-applications-view.tsx`, `components/profile-form.tsx`, `desktop/src/components/profile-form.tsx`, `lib/resume-store.ts`, `desktop/src/lib/resume-store.ts`.

---

## Logic and data flow

| Area | Check | Result |
|------|--------|--------|
| Profile refresh | `saveCurrent` runs on every `setData` (every form change). Without debounce, that would trigger PATCH + GET on every keystroke. | **Fixed:** `refreshProfiles()` is now debounced (400 ms) in both web and desktop `resume-context`. One list refresh after user stops typing. |
| Static bullet pre-fill | Modal load uses `loaded.useStaticBullets` and `(loaded.staticBulletContent ?? "").trim()`. Only pre-fills when both are set. | **Valid.** Empty string and missing fields handled. |
| Static in bulk | `runGptPipelineForApplication` uses `staticContent` for `experience[0]` and skips Step 1 when set. `currentBullets` used for summary/skills. | **Valid.** |
| Static in modal API flow | Step 1 skipped when `staticBullets` is set; `currentBullets` used for steps 3 and 4. | **Valid.** |
| Static in modal webview flow | Same as above; Step 1 skipped when static content is set. | **Valid.** |
| Last-company loop | Step 2 loops over `expList` from index 1. Uses `exp?.company?.trim() ?? ""` and `if (!lastCompanyName) continue`. | **Valid.** No out-of-bounds or null access. |
| Empty experience | `exps[0]` and `list[0]` guarded with `if (exps[0])` / `if (list[0])`. `currentCompanyName` falls back to `app.company_name`. | **Valid.** |
| saveCurrent dependency | `saveCurrent` depends on `[currentProfileId, refreshProfiles]`. No circular dependency with `setData`. | **Valid.** |

---

## Critical issue addressed

- **Profile list refresh:** Refreshing the profile list after every PATCH (every keystroke) could cause many GET requests and unnecessary re-renders. **Fix:** Debounce `refreshProfiles()` by 400 ms in `saveCurrent` in both `lib/resume-context.tsx` and `desktop/src/lib/resume-context.tsx`. The list still updates shortly after the user stops editing, without a full page reload.

---

## No issues found

- No infinite render or request loops.
- Optional `useStaticBullets` / `staticBulletContent` keep existing profiles valid.
- Cancellation in modal load (`cancelled`) still used correctly.
- `expList` in Step 2 is read once at start of the async flow; iterating over it is correct even if Step 1 updates state.
