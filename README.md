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

Then open http://localhost:3000 and walk through the steps:

1. **Upload video** – select one or more MP4s in order (streamed to disk, 4GB+ ok).
2. **Set offsets** – scrub the preview and mark the start frame.
3. **Lap data** – paste laps, pick format/driver (TeamSport), save.
4. **Preview** – auto-generates a single-frame overlay just after your start; tweak text/box colors.
5. **Transform & download** – queue the render, poll status, and download the overlaid MP4.

The web UI always uses the ffmpeg renderer.

## Work dir cleanup

- Uploads and rendered/previews saved under `work/` are pruned automatically (renders/uploads after ~24h, previews after ~6h). Copy anything you want to keep somewhere else.

## Database

- SQLite database lives at `/app/database/app.sqlite` by default (set `DB_PATH` to override). The folder is exposed as a Docker volume.
- Default PRAGMAs: `journal_mode=WAL`, `synchronous=NORMAL`, `foreign_keys=ON`. Override with `DB_PRAGMAS="journal_mode=WAL,synchronous=FULL"` if needed.
- Migrations run automatically on server start (`npm run db:migrate` to run manually). No schema is defined yet.

## Development

- Run type checks before handing back work: `npm run type-check`.

### Docker Setup

```
## mac local dev env.
colima start --arch x86_64

## build
docker build --platform=linux/amd64 -t lap-timer .

## debug
docker run -it --rm lap-timer sh

## run locally from the root of the repo on http://localhost:3008
docker run -it --rm \
  -p 3008:3000 \
  -v $(pwd)/work:/app/work \
  --name lap-timer \
  jonnyreeves83/lap-timer:latest

## tag
docker tag lap-timer jonnyreeves83/lap-timer:latest

## publish
docker push jonnyreeves83/lap-timer:latest

```
