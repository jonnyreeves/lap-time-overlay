const uploadInput = document.getElementById("inputVideo");
const uploadBtn = document.getElementById("uploadBtn");
const uploadProgressBar = document.getElementById("uploadProgressBar");
const uploadProgressText = document.getElementById("uploadProgressText");
const lapTextArea = document.getElementById("lapText");
const lapFormatSelect = document.getElementById("lapFormat");
const driverField = document.getElementById("driverField");
const driverSelect = document.getElementById("driverName");
const startFrameInput = document.getElementById("startFrame");
const overlaySelect = document.getElementById("overlayMode");
const renderForm = document.getElementById("renderForm");
const renderBtn = document.getElementById("renderBtn");
const statusBody = document.getElementById("statusBody");
const previewVideo = document.getElementById("previewVideo");
const markStartBtn = document.getElementById("markStartBtn");
const stepBackBtn = document.getElementById("stepBackBtn");
const stepForwardBtn = document.getElementById("stepForwardBtn");
const videoMeta = document.getElementById("videoMeta");
const timeReadout = document.getElementById("timeReadout");

let uploadState = { id: null, name: null, size: 0 };
let pollTimer = null;
let videoInfo = null;
let previewUrl = null;
const FALLBACK_FPS = 30;

uploadInput.addEventListener("change", () => {
  const file = uploadInput.files?.[0];
  if (!file) return;
  uploadState = { id: null, name: file.name, size: file.size };
  startFrameInput.value = "";
  videoInfo = null;
  markStartBtn.disabled = true;
  stepBackBtn.disabled = true;
  stepForwardBtn.disabled = true;
  videoMeta.textContent = `Selected: ${formatBytes(file.size)} (upload for fps)`;
  uploadProgressBar.style.width = "0%";
  uploadProgressText.textContent = "Waiting to upload…";

  if (previewUrl) {
    URL.revokeObjectURL(previewUrl);
  }
  previewUrl = URL.createObjectURL(file);
  previewVideo.src = previewUrl;
  previewVideo.load();
});

uploadBtn.addEventListener("click", async (event) => {
  event.preventDefault();
  const file = uploadInput.files?.[0];
  if (!file) {
    setStatus("Choose a video file first.", true);
    return;
  }
  uploadBtn.disabled = true;
  renderBtn.disabled = true;
  try {
    const upload = await uploadVideo(file);
    uploadState = {
      id: upload.uploadId,
      name: upload.filename,
      size: upload.size,
    };
    setStatus(`Uploaded ${upload.filename} (${formatBytes(upload.size)})`);
    await fetchUploadInfo(upload.uploadId);
    markStartBtn.disabled = false;
    stepBackBtn.disabled = false;
    stepForwardBtn.disabled = false;
    renderBtn.disabled = false;
  } catch (err) {
    console.error(err);
    setStatus("Upload failed. Please try again.", true);
  } finally {
    uploadBtn.disabled = false;
  }
});

renderForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!uploadState.id) {
    setStatus("Upload a video before rendering.", true);
    return;
  }

  const lapText = lapTextArea.value.trim();
  if (!lapText) {
    setStatus("Paste your lap times first.", true);
    return;
  }

  const lapFormat = lapFormatSelect.value;
  const driverName = driverSelect.value;
  if (lapFormat === "teamsport" && !driverName) {
    setStatus("Pick a driver for TeamSport laps.", true);
    return;
  }

  const startFrame = startFrameInput.value.trim();
  if (!startFrame) {
    setStatus("Enter a start frame (0 = first frame).", true);
    return;
  }

  renderBtn.disabled = true;
  setStatus("Starting render…");
  clearInterval(pollTimer);

  try {
    const job = await startRender({
      uploadId: uploadState.id,
      lapText,
      lapFormat,
      driverName,
      startFrame: Number(startFrame),
      overlayMode: overlaySelect.value,
    });
    setStatus(`Render queued (#${job.jobId}). Polling for updates…`);
    pollJob(job.jobId);
  } catch (err) {
    console.error(err);
    setStatus("Render request failed. Check inputs and try again.", true);
    renderBtn.disabled = false;
  }
});

lapTextArea.addEventListener("input", () => {
  if (lapFormatSelect.value !== "teamsport") return;
  const drivers = extractDrivers(lapTextArea.value);
  populateDrivers(drivers);
});

lapFormatSelect.addEventListener("change", () => {
  const format = lapFormatSelect.value;
  driverField.style.display = format === "teamsport" ? "flex" : "none";
  if (format !== "teamsport") {
    driverSelect.value = "";
  } else {
    const drivers = extractDrivers(lapTextArea.value);
    populateDrivers(drivers);
  }
});

previewVideo.addEventListener("timeupdate", updateTimeReadout);
previewVideo.addEventListener("loadedmetadata", updateTimeReadout);

markStartBtn.addEventListener("click", (event) => {
  event.preventDefault();
  const frame = currentFrame();
  startFrameInput.value = frame;
  setStatus(
    `Start frame set to ${frame} (t=${formatTime(
      previewVideo.currentTime || 0
    )})`
  );
});

stepBackBtn.addEventListener("click", (event) => {
  event.preventDefault();
  stepFrames(-1);
});

stepForwardBtn.addEventListener("click", (event) => {
  event.preventDefault();
  stepFrames(1);
});

function uploadVideo(file) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(
      "POST",
      `/api/upload?filename=${encodeURIComponent(file.name)}`
    );
    xhr.responseType = "json";
    xhr.setRequestHeader("Content-Type", "application/octet-stream");

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const percent = Math.min(100, (event.loaded / event.total) * 100);
      uploadProgressBar.style.width = `${percent}%`;
      uploadProgressText.textContent = `Uploading… ${percent.toFixed(1)}%`;
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300 && xhr.response?.uploadId) {
        uploadProgressBar.style.width = "100%";
        uploadProgressText.textContent = "Upload complete.";
        resolve(xhr.response);
      } else {
        reject(new Error("Upload failed"));
      }
    };

    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.send(file);
  });
}

async function startRender(payload) {
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

async function fetchUploadInfo(uploadId) {
  videoMeta.textContent = "Probing fps…";
  try {
    const res = await fetch(
      `/api/upload/${encodeURIComponent(uploadId)}/info`
    );
    if (!res.ok) {
      throw new Error("Probe failed");
    }
    const data = await res.json();
    videoInfo = data;
    videoMeta.textContent = `${data.fps.toFixed(2)} fps • ${formatDuration(
      data.duration
    )}`;
    updateTimeReadout();
  } catch (err) {
    console.error(err);
    videoInfo = null;
    videoMeta.textContent = `Using fallback fps (${FALLBACK_FPS})`;
  }
}

function pollJob(jobId) {
  pollTimer = setInterval(async () => {
    try {
      const res = await fetch(`/api/jobs/${encodeURIComponent(jobId)}`);
      if (!res.ok) throw new Error("Status error");
      const data = await res.json();
      renderStatus(jobId, data);
      if (data.status === "complete" || data.status === "error") {
        clearInterval(pollTimer);
        renderBtn.disabled = false;
      }
    } catch (err) {
      console.error(err);
      setStatus("Lost connection while polling job status.", true);
      clearInterval(pollTimer);
      renderBtn.disabled = false;
    }
  }, 1500);
}

function renderStatus(jobId, data) {
  if (data.status === "error") {
    statusBody.innerHTML = `<div class="status__line">Job #${jobId}: <strong>Failed</strong><br>${data.error || "Unknown error"}</div>`;
    return;
  }

  if (data.status === "complete") {
    const link = data.downloadUrl
      ? `<a class="status__link" href="${data.downloadUrl}">Download overlay</a>`
      : "";
    statusBody.innerHTML = `
      <div class="status__line">Job #${jobId}: <strong>Complete</strong></div>
      <div class="status__actions">
        ${link}
        ${data.outputName ? `<span class="badge">${data.outputName}</span>` : ""}
      </div>
    `;
    return;
  }

  statusBody.innerHTML = `<div class="status__line">Job #${jobId}: ${data.status || "queued"}…</div>`;
}

function stepFrames(delta) {
  const fps = videoInfo?.fps || FALLBACK_FPS;
  const step = 1 / fps;
  const duration =
    Number.isFinite(previewVideo.duration) && previewVideo.duration > 0
      ? previewVideo.duration
      : videoInfo?.duration;
  const nextTime = Math.max(
    0,
    Math.min(
      (previewVideo.currentTime || 0) + delta * step,
      Number.isFinite(duration) ? duration : Infinity
    )
  );
  previewVideo.currentTime = nextTime;
  updateTimeReadout();
}

function updateTimeReadout() {
  const t = Number(previewVideo.currentTime) || 0;
  const fps = videoInfo?.fps || FALLBACK_FPS;
  const frame = Math.max(0, Math.floor(t * fps));
  timeReadout.textContent = `${formatTime(t)} • frame ${Number.isFinite(
    frame
  )
    ? frame
    : "--"} @ ${fps.toFixed(2)} fps`;
}

function currentFrame() {
  const t = Number(previewVideo.currentTime) || 0;
  const fps = videoInfo?.fps || FALLBACK_FPS;
  return Math.max(0, Math.floor(t * fps));
}

function extractDrivers(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (!lines.length) return [];
  const header = splitCells(lines[0]);
  return header.slice(1).filter(Boolean);
}

function splitCells(line) {
  const tabParts = line.split(/\t+/);
  if (tabParts.length > 1) return tabParts.map((p) => p.trim());
  return line.split(/ {2,}/).map((p) => p.trim());
}

function populateDrivers(drivers) {
  driverSelect.innerHTML = '<option value="">Pick a driver</option>';
  drivers.forEach((name) => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    driverSelect.appendChild(opt);
  });
}

function setStatus(message, isError = false) {
  statusBody.innerHTML = `<p class="status__line ${
    isError ? "error" : ""
  }">${message}</p>`;
}

function formatTime(seconds) {
  const t = Math.max(0, seconds || 0);
  const ms = Math.floor((t % 1) * 1000);
  const total = Math.floor(t);
  const s = total % 60;
  const m = Math.floor(total / 60);
  return `${m.toString().padStart(2, "0")}:${s
    .toString()
    .padStart(2, "0")}.${ms.toString().padStart(3, "0")}`;
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds)) return "unknown duration";
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value >= 10 || value < 1 ? 1 : 2)} ${units[unit]}`;
}

// Initialize driver field visibility
driverField.style.display = lapFormatSelect.value === "teamsport" ? "flex" : "none";
markStartBtn.disabled = true;
stepBackBtn.disabled = true;
stepForwardBtn.disabled = true;
updateTimeReadout();
