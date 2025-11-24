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
        <button id="uploadBtn" class="btn">Combine files</button>
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
  let modalRoot = null;
  let modalVideo = null;
  const clearFileInput = () => {
    if (els.uploadInput) {
      els.uploadInput.value = "";
    }
  };

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

  const setChooserEnabled = (enabled) => {
    if (els.uploadInput) {
      els.uploadInput.disabled = !enabled;
    }
    if (els.uploadDrop) {
      els.uploadDrop.classList.toggle("upload__drop--disabled", !enabled);
    }
  };

  function resetForFiles(files) {
    state.uploadId = null;
    state.uploadName = null;
    state.uploadSize = 0;
    state.videoInfo = null;
    state.uploadSegments = [];
    state.uploadCombined = false;
    state.uploadReady = false;
    state.lapText = "";
    state.lapFormat = "daytona";
    state.driverName = "";
    state.startFrame = null;
    state.lastPreviewUrl = null;
    state.textColor = "#ffffff";
    state.boxColor = "#000000";
    state.showLapCounter = true;
    state.showPosition = true;
    state.showCurrentLapTime = true;
    state.overlayPosition = "bottom-left";
    state.overlayWidthPct = 45;
    state.overlayOpacityPct = 60;
    state.lapCount = 0;
    state.previewLapNumber = 1;
    els.lapFormatSelect.value = "daytona";
    els.driverSelect.value = "";
    els.lapTextArea.value = "";
    els.driverField.style.display = "none";
    els.startFrameInput.value = "";
    if (els.showLapCounterInput) els.showLapCounterInput.checked = true;
    if (els.showPositionInput) els.showPositionInput.checked = true;
    if (els.showCurrentLapTimeInput) els.showCurrentLapTimeInput.checked = true;
    if (els.overlayPositionSelect) els.overlayPositionSelect.value = "bottom-left";
    if (els.overlayWidthInput) els.overlayWidthInput.value = "45";
    if (els.overlayWidthLabel) els.overlayWidthLabel.textContent = "45%";
    if (els.overlayOpacityInput) els.overlayOpacityInput.value = "60";
    if (els.overlayOpacityLabel) els.overlayOpacityLabel.textContent = "60%";
    els.nextToOffsets.disabled = true;
    els.nextToLapTimes.disabled = true;
    els.uploadProgressBar.style.width = "0%";
    setChooserEnabled(true);
    els.uploadProgressText.textContent = files.length
      ? `Ready to combine ${files.length} file${files.length > 1 ? "s" : ""}…`
      : "Waiting to combine…";
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

  function revokeSegmentPreviews(list = segments) {
    list.forEach((seg) => {
      if (seg.previewUrl) {
        URL.revokeObjectURL(seg.previewUrl);
      }
    });
  }

  function applyFileList(files) {
    revokeSegmentPreviews(segments);
    segments = files.map((file) => ({
      file,
      name: file.name,
      size: file.size,
      status: "pending",
      uploadId: null,
      previewUrl: URL.createObjectURL(file),
    }));
    resetForFiles(files);
    renderUploads();
    router.goTo("upload");
    clearFileInput();
  }

  function renderUploads() {
    if (!els.uploadList) return;
    const uploading = segments.some((s) => s.status === "uploading") || isUploading;
    if (els.uploadBtn) {
      const noSelection = segments.length === 0;
      const label =
        state.uploadCombined && segments.length >= 1
          ? "Reset"
          : segments.length === 1
          ? "Upload file"
          : "Combine files";
      els.uploadBtn.textContent = label;
      els.uploadBtn.disabled = uploading || (!state.uploadCombined && noSelection);
    }
    render(
      html`
        ${segments.length === 0
          ? html`<p class="muted">No files selected yet.</p>`
          : html`
              <ol class="upload__items">
                ${segments.map(
                  (item, idx) => html`
                    <li class="upload__item">
                      <div class="upload__thumb-wrap">
                        ${item.previewUrl
                          ? html`<video
                              class="upload__thumb"
                              src=${item.previewUrl}
                              muted
                              preload="metadata"
                              playsinline
                              loop
                              data-index="${idx}"
                            ></video>`
                          : html`<div class="upload__thumb upload__thumb--empty"></div>`}
                      </div>
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
    state.uploadCombined = true;
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
    setChooserEnabled(false);
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
      if (!state.uploadCombined) {
        setChooserEnabled(true);
      }
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
    if (state.uploadCombined) {
      revokeSegmentPreviews();
      segments = [];
      resetForFiles([]);
      renderUploads();
      clearFileInput();
      return;
    }
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

  els.uploadList?.addEventListener("click", (event) => {
    const thumb = event.target.closest(".upload__thumb");
    if (!thumb) return;
    const idx = Number(thumb.getAttribute("data-index"));
    if (!Number.isInteger(idx) || idx < 0 || idx >= segments.length) return;
    const seg = segments[idx];
    if (!seg.previewUrl) return;
    showPreviewModal(seg.previewUrl, seg.name);
  });

  window.addEventListener("beforeunload", () => {
    revokeSegmentPreviews();
  });

  function ensureModal() {
    if (modalRoot) return;
    modalRoot = document.createElement("div");
    modalRoot.id = "segmentModal";
    modalRoot.className = "modal hidden";
    modalRoot.innerHTML = `
      <div class="modal__backdrop"></div>
      <div class="modal__dialog" role="dialog" aria-modal="true">
        <div class="modal__header">
          <h3 class="modal__title">Segment preview</h3>
          <button type="button" class="modal__close" aria-label="Close preview">✕</button>
        </div>
        <div class="modal__body">
          <video class="modal__video" controls playsinline></video>
        </div>
      </div>
    `;
    document.body.appendChild(modalRoot);
    modalVideo = modalRoot.querySelector(".modal__video");
    const closeBtn = modalRoot.querySelector(".modal__close");
    const backdrop = modalRoot.querySelector(".modal__backdrop");
    closeBtn?.addEventListener("click", hidePreviewModal);
    backdrop?.addEventListener("click", hidePreviewModal);
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !modalRoot.classList.contains("hidden")) {
        hidePreviewModal();
      }
    });
  }

  function showPreviewModal(url, name) {
    ensureModal();
    if (!modalRoot || !modalVideo) return;
    modalVideo.src = `${url}#t=0`;
    modalVideo.currentTime = 0;
    modalVideo.play().catch(() => {
      // autoplay might be blocked; ignore
    });
    const title = modalRoot.querySelector(".modal__title");
    if (title) {
      title.textContent = name ? `Preview: ${name}` : "Segment preview";
    }
    modalRoot.classList.remove("hidden");
  }

  function hidePreviewModal() {
    if (!modalRoot || !modalVideo) return;
    modalVideo.pause();
    modalRoot.classList.add("hidden");
    modalVideo.src = "";
  }

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
