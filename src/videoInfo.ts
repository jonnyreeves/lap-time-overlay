import ffmpeg from "fluent-ffmpeg";

export interface VideoInfo {
  width: number;
  height: number;
  fps: number;
  duration: number;
}

export function ffprobeAsync(filePath: string): Promise<ffmpeg.FfprobeData> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, data) => {
      if (err) return reject(err);
      resolve(data);
    });
  });
}

export function parseFps(rateStr?: string): number {
  if (!rateStr || rateStr === "0/0") return 30;
  const [numStr, denStr] = rateStr.split("/");
  const num = parseFloat(numStr);
  const den = parseFloat(denStr || "1");
  if (!den) return num;
  return num / den;
}

export async function probeVideoInfo(inputVideo: string): Promise<VideoInfo> {
  const meta = await ffprobeAsync(inputVideo);
  const videoStream = meta.streams.find((s) => s.codec_type === "video");
  if (!videoStream) {
    throw new Error("No video stream found in input");
  }

  const width = videoStream.width || 1920;
  const height = videoStream.height || 1080;
  const fps = parseFps(
    (videoStream.r_frame_rate as string) ||
      (videoStream.avg_frame_rate as string)
  );

  const duration =
    Number(videoStream.duration) || Number(meta.format.duration) || 0;
  if (!duration) {
    throw new Error("Unable to determine video duration");
  }

  return { width, height, fps, duration };
}
