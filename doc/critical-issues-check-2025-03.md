# Critical issues check (March 2025)

## Summary

A pass was done on profile handling, job-applications view, and API/DB to find critical bugs.

---

## Fixed: Stale profile filter after deleting selected profile

**Issue:** The job-applications table filter (`profileFilterId`) is local state. When the user deletes the profile that is currently selected in the dropdown:

- `profileFilterId` was left pointing at the deleted profile id.
- The dropdown had no option for that id (invalid controlled value).
- Rows with that `profile_id` (orphans) could still appear because they are not cascade-deleted.

**Fix:** In both **web** (`components/job-applications-view.tsx`) and **desktop** (`desktop/src/components/job-applications-view.tsx`), an effect was added:

- When `profileFilterId` is set but not present in `profiles` (e.g. profile was deleted), set `profileFilterId` to `profiles[0]?.id ?? ""`.

So after deleting the selected profile, the table automatically switches to the first remaining profile.

---

## Checked and OK

- **Profile assignment:** New/pasted rows use `profileFilterId || null`; no “All” option; data is scoped per profile.
- **API:** POST job-applications accepts `profile_id` (string or null); DB does not enforce FK on `profile_id` (orphans allowed; filter sync above avoids UX issues when a profile is deleted).
- **Duplicate keys:** Backend and UI use `profile_id::company_lower`; behavior is consistent.
- **DB:** `createJobApplication` defaults date only when `date` is undefined/null; empty string is preserved. Resume file name default uses profile name when `profile_id` is set.

---

## Backend filtering (March 2025)

Job applications are now loaded per profile from the backend:

- **API:** `GET /api/job-applications?profile_id=xxx` returns only rows for that profile. No query param returns all rows (backward compatible).
- **DB:** `listJobApplications(profileId?: string | null)` in `lib/db.ts` filters by `profile_id` when provided.
- **Web & desktop:** On load and when the profile dropdown changes, the app calls the API with the current `profileFilterId`. `applications` state holds only the selected profile's rows. Undo/redo and refetch-after-mutation use `fetchApplications(profileFilterId)`.

---

## Non-critical notes

- **No profiles:** When `profiles.length === 0`, the profile dropdown has no options and `profileFilterId` stays `""`; table shows no rows. Acceptable until the user creates a profile.
- **Orphan job applications:** Deleting a profile does not delete its job applications. They remain in the DB and would only show if the user could select that profile (they can’t after the fix). A future cleanup could set `profile_id = null` or delete them when a profile is deleted.
