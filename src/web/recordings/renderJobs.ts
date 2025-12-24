import { updateTrackRecording } from "../../db/track_recordings.js";

export type RenderJobType = "combine" | "overlay";

interface ActiveRenderJobRecord {
  recordingId: string;
  userId: string;
  type: RenderJobType;
  promise: Promise<void>;
  cancel: () => void;
  startedAt: number;
  canceled: boolean;
}

const activeJobs = new Map<string, ActiveRenderJobRecord>();

export interface ActiveRenderJobSummary {
  recordingId: string;
  userId: string;
  type: RenderJobType;
  startedAt: number;
  canceled: boolean;
}

export function getActiveRenderJobs(): ActiveRenderJobSummary[] {
  return Array.from(activeJobs.values()).map(
    ({ recordingId, userId, type, startedAt, canceled }) => ({
      recordingId,
      userId,
      type,
      startedAt,
      canceled,
    })
  );
}

export function getRenderJob(recordingId: string): ActiveRenderJobRecord | undefined {
  return activeJobs.get(recordingId);
}

export function startRenderJob(params: {
  recordingId: string;
  userId: string;
  type: RenderJobType;
  promise: Promise<void>;
  cancel: () => void;
}): Promise<void> {
  const existing = activeJobs.get(params.recordingId);
  if (existing) {
    return existing.promise;
  }

  const job: ActiveRenderJobRecord = {
    ...params,
    startedAt: Date.now(),
    canceled: false,
  };

  job.promise.finally(() => {
    if (activeJobs.get(job.recordingId) === job) {
      activeJobs.delete(job.recordingId);
    }
  });

  activeJobs.set(job.recordingId, job);
  return job.promise;
}

export function cancelRenderJob(recordingId: string): boolean {
  const job = activeJobs.get(recordingId);
  if (!job || job.canceled) {
    return false;
  }

  job.canceled = true;
  updateTrackRecording(recordingId, {
    status: "failed",
    error: "Canceled by admin",
    combineProgress: 0,
  });

  try {
    job.cancel();
  } catch (err) {
    console.error("Failed to cancel render job", err);
  }

  return true;
}
