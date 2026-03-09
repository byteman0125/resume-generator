# File-based data layer (lib/db.ts)

## Summary

`lib/db.ts` no longer uses Prisma. It was replaced with a **file-based store** so the app runs without a database or the `./prisma` module.

## Behavior

- **Settings:** `data/settings.json` — `{ activeProfileId }`.
- **Profiles:** `data/profiles.json` — array of `{ id, name, data, created_at, updated_at, sortOrder }`. Order is by `sortOrder`; reorder updates `sortOrder` and saves.
- **Job applications:** `data/job-applications.json` — array of `JobApplicationRow` (snake_case). Listed by date desc, then created_at desc.
- **Job links:** `data/job-links.json` — array of `JobLinkRow`. Not used by current API routes; implemented for interface compatibility.

All functions are **synchronous** and match how the API routes call them (no `userId`; single-user / local data).

## API compatibility

- `getActiveProfileId()`, `setActiveProfileId(activeProfileId)`
- `listProfiles()`, `getProfile(id)`, `createProfile(name, data)`, `updateProfile(id, updates)`, `deleteProfile(id)`, `reorderProfiles(orderedIds)`
- `listJobApplications()`, `getJobApplication(id)`, `createJobApplication(params)`, `updateJobApplication(id, updates)`, `deleteJobApplication(id)`
- Job link functions use the same file-based pattern (no `userId`).

## IDs

Generated with `crypto.randomUUID()` when available, otherwise `Date.now()` + random string.

## Files

- `lib/db.ts` — file-based implementation only; no Prisma import.
