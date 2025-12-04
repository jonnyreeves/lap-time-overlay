# Agents Guide

## Building
- The web server has a watch script that automatically reloads on changes, the user will always run this during development so there is no need to run the individual build scripts when making changes.
- Always run `npm run check` before handing work back to the user and fix any reported issues. Run the fast suite with `npm run test` (Vitest). Only run the slow ffmpeg overlay integration snapshots (`npm run test:integration`) when touching the ffmpeg renderer/overlay paths or fixtures.


## Libraries
- Typescript is used under the `src` and `tests` directories. Scripts can be written in javascript.
- Frontend styling uses Emotion with `jsxImportSource=@emotion/react`; global styles live in `src/web/client/styles/global.ts`, shared layout/typography in `src/web/client/styles/*`, and components co-locate their styles (e.g. Card owns its own styles). Avoid reintroducing global CSS files or new classnames unless necessary.
- SQLite is the persistence layer (default `DB_PATH=/app/database/app.sqlite`, PRAGMAs set via `DB_PRAGMAS`, `npm run db:migrate` to run migrations); keep DB writes in the `/app/database` volume.
- Runtime work dirs under `/app/work` (uploads/renders/previews) and `/app/database` are Docker volumes—do not break or relocate without coordinating.

## Style
- Keep changes minimal, aligned with existing style, and explain them succinctly in the final message (reference paths, not file dumps).
components small/modular to stay under the 400-line guideline.
- Server is modular (see `src/web/*`), GraphQL is the primary interface, and REST endpoints are deprecated—do not add new REST routes.
- Prefer small, modular code. Avoid files which exceed 400 lines of code.
- Never revert or overwrite user changes unless explicitly requested.***

## GraphQL resolvers
- Layout mirrors `src/web/graphql/resolvers/*` with one file per domain (e.g., `circuit.ts`, `trackSession.ts`, `lap.ts`, `auth.ts`, `user.ts`, `utils.ts` for shared helpers).
- `schema.ts` should only load typeDefs and compose exports from resolver modules; keep business logic in the domain files.
- Tests live under `tests/web/graphql/resolvers/*`, mirroring the source filenames. Mock DB modules at the top of each test file and reset them per test. Use hoisted mocks (`vi.hoisted`) when needed to avoid import-order issues.
- When adding fields or mutations, update the relevant resolver module and fragment/query documents, then run `npm run relay:codex` (included in `npm run check`).
- Add targeted unit tests for new resolver behavior; avoid broad integration unless necessary. Always finish with `npm run check`.
