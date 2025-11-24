# Lap Time Overlay

Overlay karting lap and position info on top of a video using the ffmpeg drawtext pipeline. Use either the CLI or the bundled web UI.

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

## CLI Usage

```
npm run lap-timer -- \
  --inputVideo "work/video.mp4" \
  --inputLapTimes work/times.txt \
  --lapFormat daytona \
  --startTimestamp 00:12:53.221 \
  --outputFile work/out.mp4
```

- `--startFrame` can be used instead of `--startTimestamp` (frame index).
- `--lapFormat teamsport` needs `--driverName "Your Name"` to select the right column from the table export.
- You can concatenate multiple sources in order with repeated `--inputVideo` flags (e.g. `--inputVideo a.mp4 --inputVideo b.mp4`).
- Overlay is ffmpeg-only in the web UI and CLI to keep the flow simple.

## Development

- Run type checks before handing back work: `npm run type-check`.
