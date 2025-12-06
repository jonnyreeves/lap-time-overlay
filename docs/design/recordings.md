# Track session recordings

## Goals
- Let a user upload onboard video files which are then combined into a single video file and associated with a track session so they can review it at a later date.
- Keep the combined file tied to session ownership and available through GraphQL.

## Scope and assumptions
- Reuse the existing `track_recordings` table (`id`, `session_id`, `media_id`, `lap_one_offset`, `description`, timestamps) but feel free to extend this table as needed (eg: add `user_id`) and relevant metadata such as size, fps, etc.
- Ignore lapOneOffset - `lap_one_offset` can default to 0. We will add this functionality later.
- Storage should live in a durable work dir (e.g., `/app/work/media/session_recordings`).
- A session may have multiple recordings.
- The user's footage may be split across multiple source files which will need to be combined into a single file using ffmpeg. Combining the separate files must use ffmpeg copy stream to preserve metadata.
- Upload transport must handle 4GB files efficiently; prefer staged/resumable streaming initiated via GraphQL (upload session + streaming target) over inline GraphQL uploads.

## Data and storage
- Persist uploaded video files under a durable directory; and under a Track Session subfolder (eg: `/app/work/media/session_recordings/<track_session_id>`). Keep filenames unique (UUID) and record the location/key as `mediaId`.
- Deleting a recording should delete both the DB row and the stored file; deleting a session should cascade its recordings and files.
- Source uploads are only needed for the combine step; keep them in per-session staging and delete them (and any partial outputs) once combine succeeds or fails so only the combined file remains.

## User flows
### Attach a recording to a session
1. From the session detail page, user clicks “Attach footage" and can select / drag-drop one or more source files. If the user has dropped more than one file provide controls to set the order.
2. User clicks the "Upload footage" button; the client streams the files using staged/resumable upload suited for 4GB inputs (GraphQL mutation allocates the upload session + streaming target), tracks upload progress, and kicks off a background job to combine the footage once uploads finish in the chosen order.
3. Combine job runs with ffmpeg stream copy (no transcoding). If inputs use mismatched codecs/containers, fail fast with a user-visible error; otherwise, save the output file and metadata, validate ownership/inputs, store the row, and clean up staged sources and temporary files.
4. The session view lists attachments.

Upload and combine progress should be surfaced to the client (status fields, polling, or subscription) so users can see progress and errors.

### Manage attachments
- Delete: remove a recording, which deletes the DB row and the underlying file.

### Use in overlay/render
- Rendering the overlay is out of scope at this time.

## Client UX
- Session detail page gets a “Video” card listing recordings with description, created-at, and actions (download/view, edit, delete).
- Show per-file upload progress and overall combine progress with error states and retry/cancel affordances.

## Ops and cleanup
- Ensure new media dir is created at startup (`ensureWorkDirs`).
- Removal paths (delete recording/session) must unlink files from disk and handle missing files gracefully.
- Source staging directories should be removed after combine completion (success or failure) so only the combined recording persists.
