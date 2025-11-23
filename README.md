# Lap Time Overlay

Overlay karting lap and position info on top of a video using the ffmpeg drawtext pipeline.

## Prereqs

```
brew install pkg-config cairo pango libpng jpeg giflib librsvg ffmpeg
```
Node 18+ is recommended.

## Install

```
npm install
```

## Usage

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
- Overlay is ffmpeg-only in the web UI and CLI to keep the flow simple.

## Development

- Run type checks before handing back work: `npm run type-check`.
