import { html, render } from "../template.js";
import { FALLBACK_FPS } from "../constants.js";
import { formatDuration, formatTime } from "../formatters.js";
import { setStatus } from "../status.js";
import { createVideoControls } from "../videoControls.js";

export function renderOffsetsStep(root) {
  const section = document.createElement("section");
  section.className = "card step";
  section.id = "stepOffsets";
  render(
    html`
      <div class="card__header">
        <div class="dot"></div>
        <div>
          <p class="eyebrow">Step 2</p>
          <h2>Set offsets</h2>
        </div>
      </div>

      <div class="preview">
        <div class="preview__header">
          <div>
            <p class="eyebrow">Mark lap 1</p>
            <h3>Scrub & set start frame</h3>
          </div>
          <span class="badge" id="videoMeta">Waiting for upload…</span>
        </div>
        <div class="preview__player">
          <video id="previewVideo" controls playsinline></video>
        </div>
        <div class="preview__actions">
          <div>
            <div class="muted" id="timeReadout">
              00:00.000 • frame --
            </div>
            <div class="field__hint">
              We use probed FPS after upload to map time → frame.
            </div>
          </div>
          <div class="stepper">
            <button
              class="btn btn--ghost"
              id="stepBackBtn"
              title="Shortcut: Left arrow or J"
            >
              −1 frame
            </button>
            <button
              class="btn btn--ghost"
              id="stepForwardBtn"
              title="Shortcut: Right arrow or K"
            >
              +1 frame
            </button>
          </div>
          <button class="btn" id="markStartBtn">Mark start here</button>
        </div>
        <label class="field">
          <span>Start frame</span>
          <input
            type="number"
            id="startFrame"
            placeholder="e.g. 1530"
            min="0"
          />
          <div class="field__hint">
            First frame where lap 1 starts. Auto-filled from preview mark.
          </div>
        </label>
        <div class="step-nav">
          <button type="button" class="btn btn--ghost" id="backToUpload">
            Back
          </button>
          <button class="btn btn--primary" id="nextToLapTimes" disabled>
            Next: Lap data
          </button>
        </div>
      </div>
    `,
    section
  );
  root.appendChild(section);
}

export function initOffsetsStep(options) {
  const { els, state, router } = options;
  let previewIsObjectUrl = false;

  const videoControls = createVideoControls({
    video: els.previewVideo,
    timeReadout: els.timeReadout,
    startFrameInput: els.startFrameInput,
    markButton: els.markStartBtn,
    stepBackButton: els.stepBackBtn,
    stepForwardButton: els.stepForwardBtn,
    getFps: () => state.videoInfo?.fps ?? FALLBACK_FPS,
    getDuration: () =>
      Number.isFinite(els.previewVideo.duration) &&
      els.previewVideo.duration > 0
        ? els.previewVideo.duration
        : state.videoInfo?.duration,
    onMark: (frame, seconds) => {
      setStatus(
        els.statusBody,
        `Start frame set to ${frame} (t=${formatTime(seconds)})`
      );
      updateNextButton();
    },
  });

  function updateNextButton() {
    els.nextToLapTimes.disabled = !els.startFrameInput.value.trim();
  }

  function setPreviewSource(url, { isObjectUrl }) {
    if (previewIsObjectUrl && state.previewUrl) {
      URL.revokeObjectURL(state.previewUrl);
    }
    state.previewUrl = url;
    previewIsObjectUrl = isObjectUrl;
    els.previewVideo.src = url;
    els.previewVideo.load();
    els.startFrameInput.value = "";
    videoControls.setEnabled(false);
    updateNextButton();
  }

  function preparePreviewFromFile(file) {
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setPreviewSource(objectUrl, { isObjectUrl: true });
  }

  function preparePreviewFromUpload(uploadId) {
    if (!uploadId) return;
    const url = `/api/upload/${encodeURIComponent(uploadId)}/file`;
    setPreviewSource(url, { isObjectUrl: false });
  }

  function handleUploadInfo(info) {
    els.videoMeta.textContent = `${info.fps.toFixed(2)} fps • ${formatDuration(
      info.duration
    )}`;
    videoControls.setEnabled(true);
    videoControls.updateTimeReadout();
  }

  els.startFrameInput.addEventListener("input", updateNextButton);

  els.backToUpload.addEventListener("click", (event) => {
    event.preventDefault();
    router.goTo("upload");
  });

  els.nextToLapTimes.addEventListener("click", (event) => {
    event.preventDefault();
    if (!els.startFrameInput.value.trim()) {
      setStatus(
        els.statusBody,
        "Set a start frame before moving to lap data.",
        true
      );
      return;
    }
    router.goTo("lapTimes");
  });

  window.addEventListener("keydown", (event) => {
    if (router.currentStep() !== "offsets") return;
    const target = event.target;
    const path = event.composedPath();
    const isVideoContext = path.some((node) => node instanceof HTMLVideoElement);
    if (
      !isVideoContext &&
      target instanceof HTMLElement &&
      (target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable)
    ) {
      return;
    }
    const key = event.key;
    const keyLower = key.toLowerCase();
    if (key === "ArrowLeft" || keyLower === "j") {
      if (!els.stepBackBtn.disabled) {
        event.preventDefault();
        videoControls.stepFrames(-1);
      }
    } else if (key === "ArrowRight" || keyLower === "k") {
      if (!els.stepForwardBtn.disabled) {
        event.preventDefault();
        videoControls.stepFrames(1);
      }
    }
  });

  window.addEventListener("beforeunload", () => {
    if (previewIsObjectUrl && state.previewUrl) {
      URL.revokeObjectURL(state.previewUrl);
    }
  });

  return {
    preparePreviewFromFile,
    preparePreviewFromUpload,
    handleUploadInfo,
    videoControls,
  };
}
