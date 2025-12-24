# Lap Time Overlay

Overlay karting lap and position info on top of a video using the ffmpeg drawtext pipeline. Use the bundled web UI.

## Prereqs

```
brew install ffmpeg
```
Node 18+ is recommended.

## Install

```
npm install
```

## Web UI

```
npm run web
```

Then open http://localhost:3000.

## Media Library projection

RaceCraft keeps uploaded recordings in a stable raw store at `/app/media/session_recordings/${sessionId}/{recordingId}.mp4`. A user friendly Media Library projection is created under `media/library`:

- Folder per session is nested: `{username}/{YYYY}/{Track Name}/{Mon D}/` (e.g. `jonny/2025/Daytona Sandown Park/Sept 25/`).
- Each ready recording is hard-linked into that folder as `{Track} - {Layout} - {Format} - YYYY-MM-DD[ - {camera}].mp4` with an NFO sharing the same base name.
- Projections are rebuilt automatically when recordings finish combining, overlays are burned, or session metadata changes; deleting a recording or session removes the linked files only (raw media stays put).

You can point a media server (e.g., Jellyfin) at `/app/media/library` (Home Videos). If the projection looks stale, clear the folder—RaceCraft will regenerate it on the next change.

## Work dir cleanup

- Uploads and rendered/previews saved under `/app/temp/` are pruned automatically (renders/uploads after ~24h, previews after ~6h). Copy anything you want to keep somewhere else.

## Database

- SQLite database lives at `/app/database/app.sqlite` by default (set `DB_PATH` to override). The folder is exposed as a Docker volume.
- Default PRAGMAs: `journal_mode=WAL`, `synchronous=NORMAL`, `foreign_keys=ON`. Override with `DB_PRAGMAS="journal_mode=WAL,synchronous=FULL"` if needed.
- Migrations run automatically on server start (`npm run db:migrate` to run manually). 

## Development

- Run type checks before handing back work: `npm run type-check`.

### Docker Setup

```
## mac local dev env.
colima start --arch x86_64

## build
docker build --platform=linux/amd64 -t racecraft .

## tag
docker tag racecraft jonnyreeves83/racecraft:latest

## publish
docker push jonnyreeves83/racecraft:latest

## debug
docker run -it --rm racecraft sh

## run locally from the root of the repo on http://localhost:3008
docker run -it --rm \
  -p 3008:3000 \
  -v $(pwd)/work:/app/work \
  --name racecraft \
  jonnyreeves83/racecraft:latest
```