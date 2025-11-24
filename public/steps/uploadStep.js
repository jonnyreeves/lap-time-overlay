import { combineUploads, fetchUploadInfo, uploadVideo } from "../api.js";
import { formatBytes } from "../formatters.js";
import { setStatus } from "../status.js";
import { html, render } from "../template.js";

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
        <label for="inputVideo" class="upload__drop" id="uploadDrop">
          <div class="drop__icon">⬆</div>
          <div>
            <div class="drop__title">Choose MP4s in the order they should play</div>
            <div class="drop__hint">
              Click to browse. We'll stream each file to disk and combine them.
            </div>
          </div>
          <input type="file" id="inputVideo" accept="video/mp4" multiple />
        </label>
        <div class="upload__list" id="uploadList">
        </div>
        <button id="uploadBtn" class="btn">Upload files</button>
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
    preparePreviewFromFile,
    preparePreviewFromUpload,
    handleUploadInfo,
  } = options;

  let segments = [];
  let isUploading = false;

  if (els.uploadDrop) {
    ["dragenter", "dragover", "drop"].forEach((eventName) => {
      els.uploadDrop.addEventListener(eventName, (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (eventName === "drop") {
          setStatus(
            els.statusBody,
            "Drag-and-drop is disabled. Click to choose files.",
            true
          );
        }
      });
    });
  }

  ["dragover", "drop"].forEach((eventName) => {
    window.addEventListener(eventName, (event) => {
      event.preventDefault();
    });
  });

  function resetForFiles(files) {
    state.uploadId = null;
    state.uploadName = null;
    state.uploadSize = 0;
    state.videoInfo = null;
    state.uploadSegments = [];
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
    els.uploadProgressText.textContent = files.length
      ? `Ready to upload ${files.length} file${files.length > 1 ? "s" : ""}…`
      : "Waiting to upload…";
    els.videoMeta.textContent = "Waiting for upload…";
    setStatus(
      els.statusBody,
      files.length
        ? `Selected ${files.length} file${files.length > 1 ? "s" : ""}.`
        : "Choose one or more videos to start."
    );
    if (files[0]) {
      preparePreviewFromFile?.(files[0]);
    }
  }

  function applyFileList(files) {
    segments = files.map((file) => ({
      file,
      name: file.name,
      size: file.size,
      status: "pending",
      uploadId: null,
    }));
    resetForFiles(files);
    renderUploads();
    router.goTo("upload");
  }

  function renderUploads() {
    if (!els.uploadList) return;
    const uploading = segments.some((s) => s.status === "uploading") || isUploading;
    render(
      html`
        ${segments.length === 0
          ? html`<p class="muted">No files selected yet.</p>`
          : html`
              <ol class="upload__items">
                ${segments.map(
            (item, idx) => html`
                    <li class="upload__item">
                      <div class="upload__item-main">
                        <span class="upload__order">${idx + 1}.</span>
                        <span class="upload__name">${item.name}</span>
                        <span class="upload__size">
                          (${formatBytes(item.size)})
                        </span>
                      </div>
                      <div class="upload__controls">
                        <button
                          type="button"
                          class="upload__control"
                          data-action="move-up"
                          data-index="${idx}"
                          ?disabled=${uploading || idx === 0}
                          aria-label="Move segment up"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          class="upload__control"
                          data-action="move-down"
                          data-index="${idx}"
                          ?disabled=${uploading || idx === segments.length - 1}
                          aria-label="Move segment down"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          class="upload__control upload__control--danger"
                          data-action="remove"
                          data-index="${idx}"
                          ?disabled=${uploading}
                          aria-label="Remove segment"
                        >
                          ✕
                        </button>
                      </div>
                      <span
                        class="upload__status upload__status--${item.status}"
                      >
                        ${item.status === "uploading"
                ? "Uploading"
                : item.status === "uploaded"
                  ? "Uploaded"
                  : "Pending"}
                      </span>
                    </li>
                  `
          )}
              </ol>
              ${state.uploadReady
              ? html`<p class="muted">
                    Combined video ready: ${state.uploadName} (${formatBytes(
                state.uploadSize
              )})
                  </p>`
              : ""}
            `}
      `,
      els.uploadList
    );
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

  async function finalizeUpload(upload) {
    state.uploadId = upload.uploadId;
    state.uploadName = upload.filename;
    state.uploadSize = upload.size;
    state.uploadReady = true;
    renderUploads();
    preparePreviewFromUpload?.(upload.uploadId);
    await loadVideoInfo(upload.uploadId);
    els.nextToOffsets.disabled = false;
    setStatus(
      els.statusBody,
      `Ready: ${upload.filename} (${formatBytes(upload.size)})`
    );
  }

  async function combineSegments() {
    const uploadIds = state.uploadSegments.map((s) => s.uploadId);
    if (!uploadIds.length) {
      setStatus(els.statusBody, "Upload files before combining.", true);
      return;
    }
    if (uploadIds.length === 1) {
      const single = state.uploadSegments[0];
      await finalizeUpload({
        uploadId: single.uploadId,
        filename: single.filename,
        size: single.size,
      });
      return;
    }

    els.uploadProgressBar.style.width = "15%";
    els.uploadProgressText.textContent = "Combining files in order…";
    try {
      const res = await combineUploads(uploadIds);
      els.uploadProgressBar.style.width = "100%";
      els.uploadProgressText.textContent = "Combined and ready.";
      renderUploads();
      await finalizeUpload(res);
      setStatus(
        els.statusBody,
        `Combined ${uploadIds.length} files into ${res.filename} (${formatBytes(
          res.size
        )})`
      );
    } catch (err) {
      console.error(err);
      els.uploadProgressText.textContent =
        "Combine failed. Check files and try again.";
      setStatus(
        els.statusBody,
        "Combine failed. Check files and try again.",
        true
      );
      state.uploadId = null;
      state.uploadName = null;
      state.uploadSize = 0;
      state.uploadReady = false;
      els.nextToOffsets.disabled = true;
      renderUploads();
    }
  }

  async function uploadAll() {
    if (!segments.length) {
      setStatus(els.statusBody, "Choose at least one MP4 first.", true);
      return;
    }
    if (segments.some((seg) => !seg.file)) {
      setStatus(
        els.statusBody,
        "One or more selected files are missing; reselect and try again.",
        true
      );
      return;
    }
    els.uploadBtn.disabled = true;
    els.nextToOffsets.disabled = true;
    els.nextToLapTimes.disabled = true;
    isUploading = true;
    state.uploadReady = false;
    state.uploadSegments = [];
    segments = segments.map((seg) => ({
      ...seg,
      status: "pending",
      uploadId: null,
    }));
    renderUploads();

    try {
      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        seg.status = "uploading";
        els.uploadProgressBar.style.width = "0%";
        els.uploadProgressText.textContent = `Uploading file ${i + 1
          } of ${segments.length}…`;
        renderUploads();
        const upload = await uploadVideo(seg.file, {
          onProgress: (percent) => {
            els.uploadProgressBar.style.width = `${percent}%`;
            els.uploadProgressText.textContent = `Uploading file ${i + 1
              } of ${segments.length}… ${percent.toFixed(1)}%`;
          },
        });
        seg.status = "uploaded";
        seg.uploadId = upload.uploadId;
        seg.size = upload.size;
        state.uploadSegments.push({
          uploadId: upload.uploadId,
          filename: upload.filename,
          size: upload.size,
        });
        setStatus(
          els.statusBody,
          `Uploaded ${upload.filename} (${formatBytes(upload.size)})`
        );
        renderUploads();
      }
      els.uploadProgressBar.style.width = "100%";
      els.uploadProgressText.textContent = "Uploads complete.";
      await combineSegments();
    } catch (err) {
      console.error(err);
      els.uploadProgressText.textContent = "Upload failed. Please try again.";
      setStatus(els.statusBody, "Upload failed. Please try again.", true);
    } finally {
      els.uploadBtn.disabled = false;
      isUploading = false;
    }
  }

  els.uploadInput.addEventListener("change", () => {
    const newFiles = Array.from(els.uploadInput.files ?? []);
    if (!newFiles.length) return;

    const shouldStartFresh =
      state.uploadReady ||
      state.uploadSegments.length > 0 ||
      segments.some((seg) => seg.uploadId);

    const existingFiles =
      shouldStartFresh || segments.length === 0
        ? []
        : segments
          .map((seg) => seg.file)
          .filter((file) => Boolean(file));

    const combinedFiles = [...existingFiles, ...newFiles];
    applyFileList(combinedFiles);
  });

  els.uploadBtn.addEventListener("click", async (event) => {
    event.preventDefault();
    await uploadAll();
  });

  els.uploadList?.addEventListener("click", (event) => {
    const actionTarget = event.target.closest("[data-action]");
    if (!actionTarget) return;
    if (isUploading || segments.some((seg) => seg.status === "uploading")) {
      setStatus(
        els.statusBody,
        "Wait for uploads to finish before reordering.",
        true
      );
      return;
    }
    const idx = Number(actionTarget.getAttribute("data-index"));
    if (!Number.isInteger(idx) || idx < 0 || idx >= segments.length) return;
    const files = segments.map((seg) => seg.file).filter(Boolean);

    const action = actionTarget.getAttribute("data-action");
    if (action === "remove") {
      files.splice(idx, 1);
      applyFileList(files);
      setStatus(els.statusBody, "Removed segment. Re-upload to combine.");
    } else if (action === "move-up" && idx > 0) {
      const [file] = files.splice(idx, 1);
      files.splice(idx - 1, 0, file);
      applyFileList(files);
      setStatus(els.statusBody, "Reordered segments. Re-upload to combine.");
    } else if (action === "move-down" && idx < files.length - 1) {
      const [file] = files.splice(idx, 1);
      files.splice(idx + 1, 0, file);
      applyFileList(files);
      setStatus(els.statusBody, "Reordered segments. Re-upload to combine.");
    }
  });

  els.nextToOffsets.addEventListener("click", (event) => {
    event.preventDefault();
    if (!state.uploadReady) {
      setStatus(els.statusBody, "Upload a video before marking the start.", true);
      return;
    }
    router.goTo("offsets");
  });

  renderUploads();

  return { renderUploads };
}
