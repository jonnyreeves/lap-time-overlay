import { css } from "@emotion/react";
import Uppy from "@uppy/core";
import Tus from "@uppy/tus";

export type UploadTarget = {
  id: string;
  fileName: string;
  sizeBytes: number | null | undefined;
  uploadedBytes: number;
  status: string;
  ordinal: number;
  uploadToken: string;
};

export const recordingButtonStyles = css`
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #d7deed;
  background: #fff;
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease;

  &:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
  }

  &:disabled {
    background: #e2e8f4;
    color: #94a3b8;
    cursor: not-allowed;
  }
`;

export function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let val = bytes / 1024;
  let unit = units[0];
  for (let i = 0; i < units.length; i++) {
    if (val < 1024 || i === units.length - 1) {
      unit = units[i];
      break;
    }
    val /= 1024;
  }
  return `${val.toFixed(1)} ${unit}`;
}

type UploadOptions = {
  onProgress?: () => void;
};

function shouldDebugUploadProgress(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage?.getItem("DEBUG_UPLOAD_PROGRESS") === "1";
  } catch {
    return false;
  }
}

function tokenSuffix(token: string | null | undefined): string | null {
  if (!token) return null;
  return token.slice(-6);
}

function clearTusFingerprintsOnce(): void {
  if (typeof window === "undefined") return;
  try {
    const storage = window.localStorage;
    if (!storage) return;
    const cleanupKey = "tus:fingerprints-cleared-v1";
    if (storage.getItem(cleanupKey) === "1") return;
    const keysToRemove: string[] = [];
    for (let i = 0; i < storage.length; i += 1) {
      const key = storage.key(i);
      if (key && key.startsWith("tus::")) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => storage.removeItem(key));
    storage.setItem(cleanupKey, "1");
  } catch {
    return;
  }
}

function createProgressThrottle(callback: (() => void) | undefined, waitMs: number) {
  if (!callback) return null;
  let lastCall = 0;
  let timeout: number | null = null;

  return () => {
    const now = Date.now();
    const remaining = waitMs - (now - lastCall);
    if (remaining <= 0) {
      lastCall = now;
      callback();
      return;
    }
    if (timeout != null) return;
    timeout = window.setTimeout(() => {
      lastCall = Date.now();
      timeout = null;
      callback();
    }, remaining);
  };
}

export async function uploadToTargets(
  targets: UploadTarget[],
  sources: File[],
  options: UploadOptions = {}
) {
  const orderedTargets = [...targets].sort((a, b) => a.ordinal - b.ordinal);
  const uppy = new Uppy({ autoProceed: true });
  const debugUploadProgress = shouldDebugUploadProgress();

  clearTusFingerprintsOnce();

  uppy.use(Tus, {
    endpoint: "/api/uploads/tus",
    chunkSize: 10 * 1024 * 1024,
    limit: 3,
    storeFingerprintForResuming: false,
    removeFingerprintOnSuccess: true,
    withCredentials: true,
    allowedMetaFields: ["name", "type", "sourceId", "uploadToken"],
    headers: (file) => ({
      "Upload-Token": String(file?.meta?.uploadToken ?? ""),
    }),
  });

  orderedTargets.forEach((target) => {
    const file = sources[target.ordinal - 1];
    if (!file) {
      throw new Error("Upload target is missing");
    }
    if (!target.uploadToken) {
      throw new Error("Upload token is missing");
    }

    if (debugUploadProgress) {
      console.info("Upload target prepared", {
        targetId: target.id,
        ordinal: target.ordinal,
        fileName: file.name,
        fileSize: file.size,
        targetSizeBytes: target.sizeBytes ?? null,
        uploadTokenSuffix: tokenSuffix(target.uploadToken),
      });
    }

    uppy.addFile({
      name: file.name,
      type: file.type,
      data: file,
      meta: {
        sourceId: target.id,
        uploadToken: target.uploadToken,
      },
    });
  });

  const throttledRefresh = createProgressThrottle(options.onProgress, 750);
  if (throttledRefresh) {
    uppy.on("upload-progress", throttledRefresh);
    uppy.on("upload-success", throttledRefresh);
  }

  try {
    const result = await uppy.upload();
    if (!result) {
      throw new Error("Upload did not start");
    }
    if (result.failed?.length) {
      const message = result.failed[0]?.error ?? "Upload failed";
      throw new Error(message);
    }
  } finally {
    uppy.destroy();
  }
}
