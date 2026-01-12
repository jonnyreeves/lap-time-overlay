# TUS Upload Handling Plan

## Goal
Replace the legacy single-request upload flow with tus-based resumable uploads (Uppy + tus-js-client) while preserving existing recording creation, processing, and UI flows. This plan describes how to integrate tus, add integration tests, and then remove the legacy upload path safely.

Note: Phase 3 removed the legacy `/uploads/recordings/:sourceId` endpoint and the `RecordingUploadTarget.uploadUrl` field, so tus is now the only upload path.

## 1) TUS library and integration details

### 1.1 Background: tus protocol and tus-js-client
- tus is a protocol for resumable uploads. The client sends a POST to create an upload, then PATCH requests with chunked data and an Upload-Offset header. The server responds with Upload-Offset to indicate where to resume.
- tus-js-client is the reference client; Uppy uses it under the hood (via @uppy/tus). It manages fingerprinting to resume on refresh and can re-query the server for offsets.

### 1.2 Client integration (Uppy + @uppy/tus)
- Use @uppy/core and @uppy/tus in the browser; configure Uppy in a shared helper (existing `uploadToTargets` is the right home).
- Keep the upload targets returned from GraphQL. Each upload target maps to a single file and a server-side storage path.
- Set Uppy tus options:
  - `endpoint: /api/uploads/tus`
  - `chunkSize` (10MB has been working well)
  - Avoid `parallelUploads` (it splits a single file into multiple uploads and changes Upload-Length); use the plugin `limit` option to cap concurrent files instead.
  - `withCredentials: true` so session cookies are sent
  - `allowedMetaFields: ["name", "type", "sourceId", "uploadToken"]`
- For now, disable tus resume URL storage to avoid stale/legacy URLs: `storeFingerprintForResuming: false` and `removeFingerprintOnSuccess: true`.
- Pass both `sourceId` (target id) and `uploadToken` (target auth token) in `file.meta`.
- Always send `Upload-Token` header on POST/HEAD/PATCH; this is required for resume auth.
- Track progress from Uppy (upload-progress event) and update UI via the existing refresh polling. A throttled refresh callback is enough.

### 1.3 Server integration (tus endpoint)
- Create a dedicated tus endpoint in the Node server: `/api/uploads/tus`.
- Implement endpoints:
  - OPTIONS: reply with `Tus-Resumable`, `Tus-Version`, `Tus-Extension`, `Tus-Max-Size`. We assume same-origin, so no extra CORS headers for now.
  - POST (create upload):
    - Extract `sourceId` from Upload-Metadata; if missing, resolve source by upload token (token is already associated with the source).
    - Validate auth using session cookies and `Upload-Token` header.
    - Require Upload-Length (no defer-length). Enforce 4GB limit.
    - Ensure source and recording are valid and not already finished.
    - Mark status as uploading and set sizeBytes.
    - Respond with Location (`/api/uploads/tus/{sourceId}`) and Upload-Offset.
  - HEAD (resume status):
    - Validate auth using session cookies and `Upload-Token` header.
    - Return Upload-Length and Upload-Offset from the file size on disk (and sync `uploadedBytes` if it drifted).
  - PATCH (upload chunk):
    - Validate auth using session cookies and `Upload-Token` header.
    - Validate Upload-Offset header against disk offset.
    - If mismatch, respond with Upload-Offset to allow the client to resync.
    - Append chunk to storage path; update uploadedBytes periodically.
    - When uploadedBytes == total, mark source uploaded and trigger combine.
- Ensure server uses the existing logic for: create recording record, tracking upload progress, and triggering concat/processing.

### 1.4 Data model
- Keep the existing track_recording_sources row for each source file.
- Use `uploadToken` to authorize writes to a specific source.
- Use `uploadedBytes` to support upload progress and resume after refresh.

## 2) Integration test for parity with legacy flow

### 2.1 Test goals
- Validate that tus uploads produce the same server-side state as the legacy PUT upload path.
- Ensure multi-source (split) recordings can upload multiple files and combine successfully.
- Confirm upload progress and final metadata are correct (status transitions to READY, sizeBytes populated, etc.).

### 2.2 Test location and structure
- Add a new integration test under `tests/web/http/` (e.g., `tests/web/http/tus-uploads.test.ts`).
- Use a temp database and temp upload dir (the project already supports these for tests).
- Reuse existing test fixtures used by legacy upload tests (or small new fixtures if needed).

### 2.3 Test scenario outline
- Arrange:
  - Create a session, a recording with 2+ sources using the GraphQL resolver (`startTrackRecordingUpload`), which returns upload targets and tokens.
  - Extract target IDs and tokens.
- Act (tus upload):
  - Simulate the POST to `/api/uploads/tus` with Upload-Length, Upload-Metadata (sourceId + uploadToken), and Upload-Token header. Capture the Location.
  - Send PATCH requests with incremental chunks for each source (use the same in-memory fixture data used by legacy tests).
  - Interleave chunks across sources to validate parallel/multi-source handling.
  - After final chunk, verify the response Upload-Offset equals total size.
- Assert:
  - Each source is marked uploaded with the correct uploadedBytes and storage path populated.
  - Recording status transitions to COMBINING and then READY (if combine is synchronous in tests) or at least READY after job finishes.
  - Output file exists and size matches concatenation expectation.

### 2.4 Parity checks vs legacy upload (Phase 2)
- Compared tus vs legacy outputs using the old PUT endpoint helper.
- Removed parity checks once the legacy endpoint was deleted in Phase 3.

### 2.5 Failure cases
- Add a resume case:
  - Start a tus upload, send only the first chunk, then issue a HEAD (with Upload-Token) and confirm Upload-Offset.
  - Send next chunk with the correct offset to confirm resume works.
- Optional: verify token mismatch returns 401 and no file is written.

## 3) Removing the legacy upload path

### 3.1 Identify legacy usage
- Legacy upload flow was the PUT `/uploads/recordings/:sourceId?token=...` endpoint.
- UI and GraphQL no longer return `uploadUrl`; all uploads use tus.
- Remove remaining client calls that use the PUT endpoint (fetch-based uploadToTargets).

### 3.2 Migration plan
1) Gate removal behind feature validation:
   - Ensure tus uploads work end-to-end with progress, resume, and multi-source.
   - Ensure tests pass for tus integration.
2) Remove `uploadUrl` from GraphQL upload targets and rely on the tus endpoint.
3) Remove legacy HTTP handler and routing:
   - Delete `/uploads/recordings` upload handling from server.
   - Remove `handleRecordingUploadRequest` entry point if no longer used.
4) Remove any remaining client or server helpers referencing legacy uploads.

### 3.3 Clean-up items
- Update docs and README to point to tus endpoint.
- Remove any tests specifically targeting the legacy upload path.
- Remove any helper functions now unused (e.g., writeUploadToDisk if only used by legacy).

## 4) Additional steps to consider

### 4.1 Backward compatibility in dev
- If existing recordings were partially uploaded via legacy path, decide whether to support resuming those or require re-upload.

### 4.2 Large file handling
- Confirm server limits (4GB) align with Docker volumes and tmp directories.
- Ensure sufficient disk space and clean-up of failed uploads via existing temp cleanup scheduler.

### 4.3 Security
- Validate upload token on every request.
- Limit upload size and reject unexpected paths.
- Ensure authenticated session required.

### 4.4 Monitoring and logs
- Add structured logs for upload start, progress, completion, and failure to help debug.

## 6) Known issue: tus parallelUploads + resume artifacts

### 6.1 Symptom
- Upload progress shows totals around 1/3 of the real file size when uploading two large files.
- Browser logs show HEAD/POST 404s and PATCH 409s during upload.

### 6.2 Root cause
- `parallelUploads` in tus-js-client splits **one file** into N parts. Each part reports `Upload-Length = fileSize / N`, so the server overwrites `sizeBytes` with a partial size and totals are wrong.
- tus-js-client stores previous upload URLs; stale URLs with query tokens can be retried, leading to HEAD/POST 404s.

### 6.3 Mitigation plan
- Remove `parallelUploads` from the Tus config and use the Uppy `limit` option to control concurrent files.
- Temporarily disable tus resume URL storage (`storeFingerprintForResuming: false`, `removeFingerprintOnSuccess: true`) and clear existing tus fingerprints during rollout.
- Dev note: clear stale fingerprints in localStorage by removing keys with the `tus::` prefix (for example, `Object.keys(localStorage).filter((key) => key.startsWith("tus::")).forEach((key) => localStorage.removeItem(key))`).
## 5) Final validation checklist
- Upload single file via tus and confirm UI progress.
- Upload multiple files and confirm combine result.
- Resume after refresh and confirm offsets.
- Run `npm run check` and ensure all tests pass.
