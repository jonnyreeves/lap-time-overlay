import { css } from "@emotion/react";

export type UploadTarget = {
  id: string;
  fileName: string;
  sizeBytes: number | null | undefined;
  uploadedBytes: number;
  status: string;
  ordinal: number;
  uploadUrl?: string | null;
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

export async function uploadToTargets(targets: UploadTarget[], sources: File[]) {
  const orderedTargets = [...targets].sort((a, b) => a.ordinal - b.ordinal);
  for (const target of orderedTargets) {
    const file = sources[target.ordinal - 1];
    if (!file || !target.uploadUrl) {
      throw new Error("Upload target is missing");
    }
    const response = await fetch(target.uploadUrl, {
      method: "PUT",
      body: file,
      credentials: "same-origin",
      headers: { "Content-Type": "application/octet-stream" },
    });
    if (!response.ok) {
      throw new Error(`Upload failed with ${response.status}`);
    }
  }
}
