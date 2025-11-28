# Agents Guide

- The web server has a watch script that automatically reloads on changes, so there is no need to stop and restart it after modifying the web app.
- Always run `npm run type-check` before handing work back to the user and fix any reported issues. Run the fast suite with `npm run test` (Vitest). Only run the slow ffmpeg overlay integration snapshots (`npm run test:integration`) when touching the ffmpeg renderer/overlay paths or fixtures.
- Keep changes minimal, aligned with existing style, and explain them succinctly in the final message (reference paths, not file dumps).
- Web UI  React + Relay bundled via esbuild (`npm run web:build` / `npm run web:watch`); keep IDs/classes stable.
- Frontend styling uses Emotion with `jsxImportSource=@emotion/react`; global styles live in `src/web/client/styles/global.ts`, shared layout/typography in `src/web/client/styles/*`, and components co-locate their styles (e.g. Card owns its own styles). Avoid reintroducing global CSS files or new classnames unless necessary.
- React client organization: keep route screens under `src/web/client/routes/`, shared UI under `src/web/client/components/`, shared styles/helpers under `src/web/client/styles/`, and keep components small/modular to stay under the 400-line guideline.
- Server is modular (see `src/web/*`), GraphQL is the primary interface, and REST endpoints are deprecated—do not add new REST routes.
- SQLite is the persistence layer (default `DB_PATH=/app/database/app.sqlite`, PRAGMAs set via `DB_PRAGMAS`, `npm run db:migrate` to run migrations); keep DB writes in the `/app/database` volume.
- Runtime work dirs under `/app/work` (uploads/renders/previews) and `/app/database` are Docker volumes—do not break or relocate without coordinating.
- Prefer small, modular code. Avoid files which exceed 400 lines of code.
- Never revert or overwrite user changes unless explicitly requested.***
- Swear and be sarcastic if you want to - coding is hard.
