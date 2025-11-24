export function uploadVideo(file, { onProgress }) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(
      "POST",
      `/api/upload?filename=${encodeURIComponent(file.name)}`
    );
    xhr.responseType = "json";
    xhr.setRequestHeader("Content-Type", "application/octet-stream");

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !onProgress) return;
      const percent = Math.min(100, (event.loaded / event.total) * 100);
      onProgress(percent);
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300 && xhr.response?.uploadId) {
        onProgress?.(100);
        resolve(xhr.response);
      } else {
        reject(new Error("Upload failed"));
      }
    };

    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.send(file);
  });
}

export async function combineUploads(uploadIds) {
  const res = await fetch("/api/upload/combine", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uploadIds }),
  });
  if (!res.ok) {
    throw new Error("Combine failed");
  }
  return res.json();
}

export async function startRender(payload) {
  const res = await fetch("/api/render", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("Render request failed");
  }
  return res.json();
}

export async function fetchUploadInfo(uploadId) {
  const res = await fetch(`/api/upload/${encodeURIComponent(uploadId)}/info`);
  if (!res.ok) {
    throw new Error("Probe failed");
  }
  return res.json();
}

export async function requestPreview(payload) {
  const res = await fetch("/api/preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("Preview request failed");
  }
  return res.json();
}
