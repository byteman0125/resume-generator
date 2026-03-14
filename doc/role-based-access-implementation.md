# Role-Based Access Implementation

Summary of the role-based access control (RBAC) implementation for the Resume Builder desktop app.

## Backend

### Auth & DB (already present)
- **`lib/db.ts`**: `users` table and helpers: `hasAnyUser`, `getUserByUsername`, `getUserById`, `listUsers`, `createUser`, `updateUser`, `updateUserPassword`, `deleteUser`, `countAdminUsers`, `getApplicationCountByProfileId`.
- **`lib/auth.ts`**: `hashPassword`, `verifyPassword`, `signToken`, `verifyToken`, `getAuthFromRequest`, `requireUser`, `generateRandomPassword`.

### API routes

1. **Job applications**
   - **`GET/POST /api/job-applications`**: Require auth. Admin: use `profile_id` query/body. User: forced to `user.assigned_profile_id` (empty list if none).
   - **`GET/PATCH/DELETE /api/job-applications/[id]`**: Require auth. User can only access rows where `row.profile_id === user.assigned_profile_id`.
   - **`GET/POST /api/job-applications/[id]/pdf`**: Same profile check as above.
   - **`GET /api/job-applications/duplicate-keys`**: Require auth. User: keys filtered to `assigned_profile_id::*`.

2. **Profiles**
   - **`GET/PATCH/DELETE /api/profiles/[id]`**: Require auth. User can only access `id === user.assigned_profile_id`.
   - **`GET /api/profiles/[id]/pdf`**: Same.

3. **Templates & AI (admin only)**
   - **`GET/PATCH /api/templates/[formatId]/style`**: Require auth; 403 for non-admin.
   - **`GET/PUT /api/ai/prompts`**: Require auth; 403 for non-admin.
   - **`POST /api/ai/generate`**: Require auth; 403 for non-admin.

4. **Other**
   - **`POST /api/pdf`**: Require auth (any role).
   - **`GET/PATCH /api/settings`**: Require auth. User: `activeProfileId` can only be set to `user.assigned_profile_id` or null.

5. **Users API**
   - **`GET /api/users`**: Admin only. Returns list with `assigned_profile_name`, `application_count`; no password.
   - **`POST /api/users`**: If no users exist, no auth (first admin). Otherwise admin only. Body: `username`, optional `role`, `assigned_profile_id`, `start_date`. Creates user with random password; returns `user` + one-time `plainPassword`.
   - **`PATCH /api/users/[id]`**: Admin only. Body: `username`, `role`, `assigned_profile_id`, `start_date`, optional `resetPassword`. If `resetPassword`, returns one-time `plainPassword`.
   - **`DELETE /api/users/[id]`**: Admin only. Prevents deleting the last admin (`countAdminUsers()`).

## Desktop

### Auth flow
- **`desktop/src/api.ts`**: `getAuthToken`, `setAuthToken`, `clearAuthToken` (localStorage).
- **`desktop/src/lib/auth-context.tsx`**: `AuthProvider`, `useAuth()`. State: `user`, `token`, `loading`. `login(serverIp, port, username, password)` persists base URL and token, then fetches `/api/auth/me`. `logout()` clears token and user. On mount (when token exists), calls `GET /api/auth/me`; on 401 clears auth. Polls `GET /api/auth/me` every 20s; on 401 logs out. Listens for `auth:401` (from fetch patch) and logs out.
- **`desktop/src/main.tsx`**: Fetch patch: relative URLs go to `getBaseUrl()`; add `Authorization: Bearer <token>` when token exists; on 401 for API (except login/setup-status) clear token and dispatch `auth:401`.

### Pages
- **`AuthPage`** (`desktop/src/pages/AuthPage.tsx`): Single flow. Step 1: Server IP, Port, “Continue” → set base URL, `GET /api/auth/setup-status`. Step 2a: If `hasUsers`, show Login (username, password). Step 2b: If no users, show Create first admin (username) → `POST /api/users` → show one-time password → “Log in with this password” calls `login(...)` and enters app.
- **`App.tsx`**: Wrapped with `AuthProvider`. Renders `AppWithProviders` in `main.tsx`. When `!token` and not loading, render `AuthPage`; otherwise render `AppShell` (header + routes). Route `/users` added for `UsersPage`.
- **`AppHeader`**: Server IP/Port removed. Nav: Profile, Templates (admin), AI (admin), Application, Users (admin). User menu (top-right) with “Log out” (logout + full reload).
- **`UsersPage`** (admin): Table of users (username, role, assigned profile name, application count, password “Copy” when one-time available). Add user (modal), Edit (modal: username, role, assigned profile, reset password), Delete (confirm; blocks last admin).

### Scoped UI
- **`job-applications-view.tsx`**: `useAuth()`. For `user?.role === "user"`, `effectiveProfileFilterId` is forced to `user.assignedProfileId`; profile dropdown hidden. All fetches and API bodies use `effectiveProfileFilterId`. Effect syncs `profileFilterId` to `assignedProfileId` when role is user.

## Immediate logout when admin removes user
- Every API request sends Bearer token; backend returns 401 if user is missing or token invalid.
- Fetch patch clears token and dispatches `auth:401` on 401.
- Poll of `GET /api/auth/me` every 20s; 401 → logout.
- AuthContext listener for `auth:401` calls `logout()`, so UI switches to `AuthPage`.

## Files touched (summary)
- **Backend**: `app/api/job-applications/route.ts`, `app/api/job-applications/[id]/route.ts`, `app/api/job-applications/[id]/pdf/route.ts`, `app/api/job-applications/duplicate-keys/route.ts`, `app/api/profiles/[id]/route.ts`, `app/api/profiles/[id]/pdf/route.ts`, `app/api/templates/[formatId]/style/route.ts`, `app/api/ai/prompts/route.ts`, `app/api/ai/generate/route.ts`, `app/api/pdf/route.ts`, `app/api/settings/route.ts`, `app/api/users/route.ts`, `app/api/users/[id]/route.ts`.
- **Desktop**: `api.ts`, `main.tsx`, `App.tsx`, `lib/auth-context.tsx`, `pages/AuthPage.tsx`, `pages/UsersPage.tsx`, `components/AppHeader.tsx`, `components/job-applications-view.tsx`.
