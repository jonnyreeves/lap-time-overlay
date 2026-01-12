# Upload Tasks - Phase 1 (TUS Integration)

Goal: Add tus uploads end-to-end (client + server) while keeping the legacy PUT upload path intact.

## Scope
- Implement `/api/uploads/tus` endpoints (OPTIONS/POST/HEAD/PATCH).
- Update client upload flow to use Uppy + tus.
- Update GraphQL upload target payloads to include data needed for tus auth.
- Keep legacy upload endpoint and callers in place for now.

## Task List
- [x] Decide the tus upload identifier scheme (e.g., Location = `/api/uploads/tus/{sourceId}`) and document it in the handler.
- [x] Add or extend DB helpers to look up sources by `uploadToken` if the token is not carried in the upload URL.
- [x] Add a shared helper to validate auth + source + recording (reuse existing upload validation without full-body writes).
- [x] Implement `src/web/http/tus.ts` with:
  - [x] `OPTIONS` response headers: `Tus-Resumable`, `Tus-Version`, `Tus-Extension`, `Tus-Max-Size`, and any required CORS headers.
  - [x] `POST` create upload: parse `Upload-Metadata` (base64), validate `Upload-Length`, set `sizeBytes`, mark source `uploading`, return `Location` + `Upload-Offset`.
  - [x] `HEAD` resume: validate auth/token, compute file size offset from disk, return `Upload-Length` + `Upload-Offset`.
  - [x] `PATCH` chunk: validate `Upload-Offset`, append to disk, update `uploadedBytes` with throttling, mark `uploaded` + trigger combine when complete.
  - [x] Add safe logging (no raw tokens), and error handling that returns `Upload-Offset` on offset mismatch.
- [x] Route tus requests in `src/web/server.ts` to the new handler.
- [x] Update `src/web/recordings/service.ts` to expose helpers needed by tus (status updates, combine trigger, upload size limits).
- [x] Update GraphQL upload targets to provide tus auth data (new `uploadToken` field or equivalent) and adjust `UploadRecordingModal` query + generated types.
- [x] Update `src/web/client/components/session/recordingShared.ts`:
  - [x] Replace `fetch` upload with Uppy + `@uppy/tus`.
  - [x] Set `endpoint`, `chunkSize`, `parallelUploads`, `withCredentials`, and `allowedMetaFields`.
  - [x] Attach `sourceId` + `uploadToken` in file metadata and send `Upload-Token` header on all requests.
  - [x] Expose a throttled progress callback so callers can trigger `onRefresh` during upload.
- [x] Update upload call sites (`UploadRecordingModal`, `RecordingsCard`) to pass refresh callbacks and surface errors.
- [x] Manual sanity check: single-file upload, multi-source upload, refresh to resume, and UI progress updates.

## Phase 1.1 - Fix tus parallelUploads + resume artifacts

Goal: Ensure upload progress reflects full file sizes, and eliminate 404/409 churn from stale resume URLs.

## Task List
- [x] Update Uppy Tus config to remove `parallelUploads` (which splits a single file) and instead use the plugin `limit` option for concurrent file uploads.
- [x] Disable tus-js-client resume URL storage for now (`storeFingerprintForResuming: false`, `removeFingerprintOnSuccess: true`) to avoid stale URLs with query tokens.
- [x] Add a brief dev note or one-time localStorage cleanup step to clear old tus fingerprints during rollout.
- [x] Add an integration test in `tests/web/http/tus-upload.integration.test.ts` that simulates a tus POST with `Upload-Length` smaller than the source `sizeBytes` and asserts the server rejects or refuses to shrink `sizeBytes`.
- [x] Manual test with 2 x 4GB files: confirm total bytes matches sum, no HEAD/POST 404s, and uploads run concurrently across files but sequentially per file.

## Out of Scope (Phase 1)
- Removing legacy `/uploads/recordings/:sourceId` handler and client usage.
- Parity integration tests comparing tus vs legacy.
- Any refactors unrelated to upload flows.

# Upload Tasks - Phase 2 (Parity Integration Tests)

Goal: Validate tus uploads against the legacy upload flow (including multi-source) and cover resume behavior.

## Scope
- Add tus upload integration tests under `tests/web/http`.
- Compare tus and legacy upload outcomes for parity.
- Exercise resume (HEAD + PATCH offset sync) behavior.

## Task List
- [x] Review existing legacy upload integration tests/helpers and identify reusable fixtures/data.
- [x] Add `tests/web/http/tus-uploads.test.ts` with temp DB + temp upload dir setup.
- [x] Build a tus test helper that:
  - [x] Sends POST with `Upload-Length`, `Upload-Metadata`, and `Upload-Token`.
  - [x] Sends PATCH chunks with `Upload-Offset` and returns updated offsets.
  - [x] Supports interleaving chunks across multiple sources.
- [x] Add a multi-source tus upload test:
  - [x] Create a recording with 2+ sources via `startTrackRecordingUpload`.
  - [x] Upload fixture data across sources (interleaved chunks).
  - [x] Assert each source status, `uploadedBytes`, and `sizeBytes`.
  - [x] Assert recording status transitions and output file exists with expected size.
- [x] Add parity assertions using the legacy upload helper:
  - [x] Upload the same fixtures via legacy PUT.
  - [x] Compare source statuses, upload byte counts, and output metadata.
- [x] Add a resume test:
  - [x] Upload the first chunk, then call HEAD to confirm `Upload-Offset`.
  - [x] Resume with the next chunk and confirm final offsets/bytes.
- [x] Optional: token mismatch returns 401 and no file is written.
- [x] Run `npm run test` and `npm run check`.

# Upload Tasks - Phase 3 (Remove Legacy Upload Path)

Goal: Remove the legacy PUT upload endpoint and align GraphQL + client code so tus is the only upload path.

## Scope
- Remove the legacy `/uploads/recordings/:sourceId` handler and service helpers.
- Remove the `uploadUrl` field from GraphQL/Relay/client types.
- Clean up tests and docs that reference legacy uploads.

## Task List
- [x] Audit remaining legacy upload references (`/uploads/recordings`, `uploadUrl`, `handleRecordingUploadRequest`, `handleSourceUpload`) and list impacted files before edits.
- [x] Update upload target shape to tus-only:
  - [x] Remove `uploadUrl` from GraphQL type defs and resolver payloads (`src/web/graphql/*`).
  - [x] Update `src/web/recordings/service.ts` to stop generating legacy upload URLs.
  - [x] Update client types/usages (`src/web/client/components/session/recordingShared.ts`, `src/web/client/routes/session/view.tsx`, `src/web/client/components/session/UploadRecordingModal.tsx`).
  - [x] Regenerate Relay artifacts (`npm run relay:codex`) and ensure generated types no longer reference `uploadUrl`.
- [x] Remove the legacy HTTP upload path:
  - [x] Drop `/uploads/recordings/:sourceId` routing in `src/web/server.ts`.
  - [x] Remove `handleRecordingUploadRequest` from `src/web/http/uploads.ts` (keep download handler or split into a download-only module).
  - [x] Remove `handleSourceUpload` and any legacy-only helpers from `src/web/recordings/service.ts`.
- [x] Clean up tests and fixtures:
  - [x] Update resolver tests that expect `uploadUrl` (`tests/web/graphql/resolvers/trackRecording.resolvers.test.ts`).
  - [x] Delete any legacy upload helpers/fixtures that become unused after the cleanup.
- [x] Update docs and communicate breaking changes:
  - [x] Update `docs/design/tus-upload-handling.md` and any README/dev notes to reflect tus-only uploads.
  - [x] Add a breaking-change note that `uploadUrl` and the legacy upload endpoint are removed (GraphQL API change).
- [x] Validation:
  - [x] Manual check: tus upload works; legacy `/uploads/recordings` is gone; download endpoint still works.
  - [x] Run `npm run test` and `npm run check`.

# Upload Tasks - Phase 4 (Post-Implementation Hardening)

Goal: Improve tus resume durability, tighten protocol validation, and clean up remaining upload-related tech debt.

## Scope
- Revisit resumable fingerprint storage now that uploads are tus-only.
- Add cleanup for abandoned/partial uploads.
- Add targeted protocol validation + tests.
- Optional: rename download-only modules for clarity.

## Task List
- [ ] Re-enable safe resume fingerprints:
  - [ ] Implement a custom tus fingerprint that avoids stale tokens (use `sourceId` + file metadata).
  - [ ] Re-enable `storeFingerprintForResuming` and remove the one-time localStorage cleanup once stable.
  - [ ] Add a manual or automated resume-after-refresh check.
- [ ] Add abandoned upload cleanup:
  - [ ] Extend the temp cleanup scheduler to detect stale `uploading` sources and remove partial files.
  - [ ] Mark stale sources as failed (and surface a helpful retry message in UI if needed).
  - [ ] Add a targeted unit/integration test to cover the cleanup behavior.
- [ ] Tighten tus protocol validation:
  - [ ] Require `Tus-Resumable` on POST/HEAD/PATCH and `Content-Type: application/offset+octet-stream` on PATCH.
  - [ ] Add tests for `Upload-Offset` mismatch (409 with `Upload-Offset`) and overrun truncation (413).
- [x] Optional cleanup:
  - [x] Rename `src/web/http/uploads.ts` + `tests/web/http/uploads.test.ts` to download-only naming for clarity.
