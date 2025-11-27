# User accounts and login

## Goals
- Allow a visitor to create an account and log in with a username + password.
- Keep the flow simple and local-first (SQLite, no third-party identity provider).
- Expose auth state through GraphQL (no new REST) so the React + Relay client can gate the UI.

## Assumptions
- Single deployment may host multiple users; no org/tenant concept.
- Accounts are created directly in the web UI (no CLI bootstrap step).
- Sessions should survive restarts while the SQLite volume is intact.
- HTTPS will sit in front of the container in production; we can still run locally over HTTP.
- Password reset / change is out of scope for this iteration.
- Rate limiting / CAPTCHA is out of scope unless we add it later.
- Minimum password length is 3 characters.
- Sessions should last 14 days before expiring.
- Routes should require login; if a user is not logged in the default behavior should be to redirect them to the login screen.

## Data model (SQLite)
- `users` (new table)
  - `id` TEXT primary key (uuid v4)
  - `username` TEXT unique, case-insensitive compare enforced in code, stored as entered
  - `password_hash` TEXT (scrypt output with salt + params)
  - `created_at` INTEGER (ms)
  - `updated_at` INTEGER (ms)
- `sessions` (new table)
  - `id` TEXT primary key (random token)
  - `user_id` TEXT references `users(id)` ON DELETE CASCADE
  - `created_at` INTEGER (ms)
  - `expires_at` INTEGER (ms) for idle timeout
  - Index on `user_id` for cleanup
- Migration order: add `users`, then `sessions`.

## Password handling
- Use Node `crypto.scrypt` with per-user 16 byte salt; store as `scrypt:<N>:<r>:<p>:<salt_b64>:<key_b64>` so params are explicit for future upgrades.
- Validation: trim username, enforce non-empty; password minimum length is 3 characters.
- On login, re-run scrypt with stored params and constant-time compare.
- Do not log credentials; only emit generic error messages for invalid login attempts.

## Session handling
- On successful register or login, create a session row and issue an HttpOnly cookie `session_id=<token>`; `SameSite=Lax`, `Path=/`, `Max-Age` based on expiry, `Secure` when `NODE_ENV=production`.
- Tokens: 32 random bytes, hex or base64url; store hashed token (`sha256`) in DB to limit leakage impact.
- On each request:
  - Parse cookies, look up session by hashed token, ensure `expires_at` > now, and fetch the user.
  - Optionally slide expiry (update `expires_at`) on active usage.
  - Attach `{ currentUser, sessionId }` to the GraphQL context.
- Logout mutation deletes the session row and clears the cookie.
- Add a periodic cleanup job (or reuse existing startup cleanup) to purge expired sessions.

## GraphQL surface
- Query
  - `viewer: User` (nullable) returns the current user with `id`, `username`, `createdAt`.
- Mutations
  - `register(input: { username: String!, password: String! }): AuthPayload`
  - `login(input: { username: String!, password: String! }): AuthPayload`
  - `logout: LogoutResult`
- Types
  - `type User { id: ID!, username: String!, createdAt: String! }`
  - `type AuthPayload { user: User!, sessionExpiresAt: String! }`
  - `type LogoutResult { success: Boolean! }`
- Errors: use GraphQL errors with codes (`USER_EXISTS`, `INVALID_CREDENTIALS`, `VALIDATION_FAILED`); keep messages generic.

## Server changes
- Extend GraphQL handler to build a context from cookies and inject it into resolvers.
- Implement user + session store modules using better-sqlite3 (reusing `getDb()`).
- Add migration files and wire them into `src/db/migrations/index.ts`.
- Add small helpers for hashing/verification and cookie parsing/serialization (no new frameworks).
- Ensure the static/REST endpoints remain accessible as-is; only GraphQL gains auth awareness.

## Client changes (React + Relay)
- On app load, issue `viewer` query to determine auth state.
- Add a simple auth shell: if unauthenticated, show tabs for Login / Create account with username + password fields; on success refetch `viewer` and show the existing app.
- Show current username + logout button in the header when authenticated.
- Keep form errors inline and generic (“Invalid username or password”).
- Relay: add mutations for `login`, `register`, `logout`; keep store update minimal (set viewer, clear store on logout).

## Routing (React Router + Relay)
- Add `react-router-dom` and wrap the client root (`src/web/client/index.tsx`) with a `RouterProvider`. Keep Relay at the top level so `RequireAuth` can run a `viewer` query.
- Route map: `/login` and `/register` (public), `/` for the overlay UI (protected), `*` for 404. Default route is `/` and is protected.
- Auth gating: a `RequireAuth` wrapper issues the `viewer` query; if null, redirect to `/login` with `from` state so we can bounce back after login; if present, render children.
- Layouts: `AuthLayout` for login/register, `AppShell` for the main overlay flow. Keep existing IDs/classes inside routed pages untouched.
- Navigation: after successful login/registration, navigate to `from` (or `/`), refetch `viewer`, and show the protected shell. Logout clears the session then routes to `/login`.

## Validation and UX
- Username: trim, lowercase for comparison, allow [a-z0-9._-], length 3–32 (unless requirements differ).
- Password: minimum length 3; no password confirmation on login; add confirmation on registration.
- Session expiry warning is out of scope; user simply re-logs in after expiry.

## Testing approach
- Unit test hashing helpers (round-trip, invalid password).
- Resolver tests for register/login/logout flows (happy path, duplicate username, wrong password, expired session).
- Verify cookies set/cleared in HTTP responses from GraphQL handler.
- Keep `npm run type-check` + `npm run test` green.
