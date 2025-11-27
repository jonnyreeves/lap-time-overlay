export type JobStatus = "queued" | "running" | "error" | "complete";

export interface RenderJob {
  id: string;
  status: JobStatus;
  startedAt?: number;
  finishedAt?: number;
  progress?: number;
  error?: string;
  outputPath?: string;
  outputName?: string;
  uploadId?: string;
  inputPath: string;
}

export const jobs = new Map<string, RenderJob>();

export function registerJob(job: RenderJob): void {
  jobs.set(job.id, job);
}

export function getJob(id: string): RenderJob | undefined {
  return jobs.get(id);
}

export function listJobPaths(): string[] {
  const paths: string[] = [];
  for (const job of jobs.values()) {
    if (job.inputPath) paths.push(job.inputPath);
    if (job.outputPath) paths.push(job.outputPath);
  }
  return paths;
}
