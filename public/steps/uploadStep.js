import { html, render } from "../template.js";
import { formatBytes } from "../formatters.js";
import { setStatus } from "../status.js";
import { uploadVideo, fetchUploadInfo } from "../api.js";

export function renderUploadStep(root) {
  const section = document.createElement("section");
  section.className = "card step step--active";
  section.id = "stepUpload";
  render(
    html`
      <div class="card__header">
        <div class="dot"></div>
        <div>
          <p class="eyebrow">Step 1</p>
          <h2>Upload video</h2>
        </div>
      </div>
      <div class="upload">
        <label for="inputVideo" class="upload__drop">
          <div class="drop__icon">⬆</div>
          <div>
            <div class="drop__title">Drop your MP4 (4GB+ ok)</div>
            <div class="drop__hint">
              Or click to browse. We'll stream it straight to disk.
            </div>
          </div>
          <input type="file" id="inputVideo" accept="video/mp4" />
        </label>
        <button id="uploadBtn" class="btn">Upload video</button>
        <div class="progress" id="uploadProgress">
          <div class="progress__bar" id="uploadProgressBar"></div>
          <div class="progress__text" id="uploadProgressText">
            Waiting to upload…
          </div>
        </div>
        <div class="step-nav">
          <button class="btn btn--primary" id="nextToOffsets" disabled>
            Next: Offsets
          </button>
        </div>
      </div>
    `,
    section
  );
  root.appendChild(section);
}

export function initUploadStep(options) {
  const {
    els,
    state,
    router,
    preparePreview,
    handleUploadInfo,
  } = options;

  function resetForFile(file) {
    state.uploadId = null;
    state.uploadName = file.name;
    state.uploadSize = file.size;
    state.uploadReady = false;
    state.lapText = "";
    state.lapFormat = "daytona";
    state.driverName = "";
    state.startFrame = null;
    state.lastPreviewUrl = null;
    state.textColor = "#ffffff";
    state.boxColor = "#000000";
    state.lapCount = 0;
    state.previewLapNumber = 1;
    els.lapFormatSelect.value = "daytona";
    els.driverSelect.value = "";
    els.lapTextArea.value = "";
    els.driverField.style.display = "none";
    els.startFrameInput.value = "";
    els.nextToOffsets.disabled = true;
    els.nextToLapTimes.disabled = true;
    els.uploadProgressBar.style.width = "0%";
    els.uploadProgressText.textContent = "Waiting to upload…";
    setStatus(
      els.statusBody,
      `Selected ${file.name} (${formatBytes(file.size)})`
    );
    preparePreview(file);
  }

  async function doUpload(file) {
    els.uploadBtn.disabled = true;
    els.nextToOffsets.disabled = true;
    els.nextToLapTimes.disabled = true;
    try {
      const upload = await uploadVideo(file, {
        onProgress: (percent) => {
          els.uploadProgressBar.style.width = `${percent}%`;
          els.uploadProgressText.textContent = `Uploading… ${percent.toFixed(
            1
          )}%`;
        },
      });
      state.uploadId = upload.uploadId;
      state.uploadName = upload.filename;
      state.uploadSize = upload.size;
      state.uploadReady = true;
      setStatus(
        els.statusBody,
        `Uploaded ${upload.filename} (${formatBytes(upload.size)})`
      );
      await loadVideoInfo(upload.uploadId);
      els.nextToOffsets.disabled = false;
    } catch (err) {
      console.error(err);
      setStatus(els.statusBody, "Upload failed. Please try again.", true);
    } finally {
      els.uploadBtn.disabled = false;
    }
  }

  async function loadVideoInfo(uploadId) {
    els.videoMeta.textContent = "Probing fps…";
    try {
      const data = await fetchUploadInfo(uploadId);
      state.videoInfo = data;
      handleUploadInfo(data);
    } catch (err) {
      console.error(err);
      state.videoInfo = null;
      els.videoMeta.textContent = "Using fallback fps (30)";
    }
  }

  els.uploadInput.addEventListener("change", () => {
    const file = els.uploadInput.files?.[0];
    if (!file) return;
    resetForFile(file);
    router.goTo("upload");
  });

  els.uploadBtn.addEventListener("click", async (event) => {
    event.preventDefault();
    const file = els.uploadInput.files?.[0];
    if (!file) {
      setStatus(els.statusBody, "Choose a video file first.", true);
      return;
    }
    await doUpload(file);
  });

  els.nextToOffsets.addEventListener("click", (event) => {
    event.preventDefault();
    if (!state.uploadReady) {
      setStatus(els.statusBody, "Upload a video before marking the start.", true);
      return;
    }
    router.goTo("offsets");
  });
}
