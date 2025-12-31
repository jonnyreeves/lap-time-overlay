# Video acceleration

- Enable the TrueNAS SCALE option “Passthrough available (non-NVIDIA) GPUs” so the container can see `/dev/dri/*` (Intel/AMD iGPUs).
- The iGPU can be shared with other apps (e.g., Jellyfin and RaceCraft) but heavy concurrent transcodes will contend for the same hardware.
- In the container, verify GPU passthrough with `/dev/dri` presence plus `ffmpeg -hwaccels` and `ffmpeg -encoders` showing `qsv`/`vaapi` entries.
- RaceCraft automatically probes supported encoders at startup and falls back to CPU if hardware isn’t detected or if GPU encoding fails during a render.
