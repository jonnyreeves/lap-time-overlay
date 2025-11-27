export interface UploadedFile {
  id: string;
  filename: string;
  path: string;
  size: number;
  createdAt: number;
}

export const uploads = new Map<string, UploadedFile>();

export function saveUpload(file: UploadedFile): void {
  uploads.set(file.id, file);
}

export function getUpload(id: string): UploadedFile | undefined {
  return uploads.get(id);
}

export function removeUpload(id: string): UploadedFile | undefined {
  const existing = uploads.get(id);
  if (existing) {
    uploads.delete(id);
  }
  return existing;
}

export function listUploadPaths(): string[] {
  return [...uploads.values()].map((upload) => upload.path);
}
