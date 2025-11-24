import { html, render } from "../template.js";
import { requestPreview, startRender } from "../api.js";
import { setStatus } from "../status.js";

export function renderPreviewStep(root) {
  const section = document.createElement("section");
  section.className = "card step";
  section.id = "stepPreview";
  render(
    html`
      <div class="card__header">
        <div class="dot"></div>
        <div>
          <p class="eyebrow">Step 4</p>
          <h2>Preview overlay</h2>
        </div>
      </div>
      <div class="preview">
        <div class="preview__header">
          <div>
            <p class="eyebrow">Single frame</p>
            <h3>Check colors after your start</h3>
          </div>
          <span class="badge" id="previewStatus">Waiting for lap data…</span>
        </div>
        <div class="preview__image">
          <img id="previewImage" alt="Overlay preview" />
          <p class="field__hint">Generated just after the start frame.</p>
        </div>
        <div class="preview__grid">
          <label class="field">
            <span>Lap for preview</span>
            <select id="previewLapSelect" disabled>
              <option value="">Waiting for laps…</option>
            </select>
            <div class="field__hint">
              We grab a frame near the start of this lap.
            </div>
          </label>
          <label class="field">
            <span>Text color</span>
            <input type="color" id="textColor" value="#ffffff" />
          </label>
          <label class="field">
            <span>Box tint</span>
            <input type="color" id="boxColor" value="#000000" />
            <div class="field__hint">Applied with 60% opacity.</div>
          </label>
          <div class="field">
            <span>Overlay content</span>
            <div class="field__choices">
              <label>
                <input type="checkbox" id="showLapCounter" checked />
                <span>Lap counter</span>
              </label>
              <label>
                <input type="checkbox" id="showPosition" checked />
                <span>Position (when available)</span>
              </label>
              <label>
                <input type="checkbox" id="showCurrentLapTime" checked />
                <span>Current lap time</span>
              </label>
            </div>
            <div class="field__hint">
              Turn everything off to omit the overlay entirely.
            </div>
          </div>
          <div class="preview__cta">
            <button class="btn" id="generatePreview">Generate preview</button>
          </div>
        </div>
        <div class="step-nav">
          <button
            type="button"
            class="btn btn--ghost"
            id="backToLapTimesPreview"
          >
            Back
          </button>
          <button class="btn btn--primary" id="renderOverlay">
            Render overlay
          </button>
        </div>
      </div>
    `,
    section
  );
  root.appendChild(section);
}

export function initPreviewStep({ els, state, router, startPolling }) {
  const clearPreviewImage = () => {
    if (els.previewImage) {
      els.previewImage.src = "";
      els.previewImage.alt = "No preview yet";
    }
    state.lastPreviewUrl = null;
  };

  const setPreviewStatus = (text) => {
    if (els.previewStatus) {
      els.previewStatus.textContent = text;
    }
  };

  const normalizeHex = (value, fallback) => {
    const match = value?.match(/^#?([0-9a-fA-F]{6})$/);
    return match ? `#${match[1]}` : fallback;
  };

  const syncColorInputs = () => {
    if (els.textColorInput) {
      els.textColorInput.value = normalizeHex(
        state.textColor,
        "#ffffff"
      );
    }
    if (els.boxColorInput) {
      els.boxColorInput.value = normalizeHex(state.boxColor, "#000000");
    }
  };

  const syncContentToggles = () => {
    if (els.showLapCounterInput) {
      els.showLapCounterInput.checked = Boolean(state.showLapCounter);
    }
    if (els.showPositionInput) {
      els.showPositionInput.checked = Boolean(state.showPosition);
    }
    if (els.showCurrentLapTimeInput) {
      els.showCurrentLapTimeInput.checked = Boolean(state.showCurrentLapTime);
    }
  };

  const hasLapData = () =>
    Boolean(
      state.uploadId &&
        state.lapText &&
        state.lapText.trim() &&
        state.startFrame !== null &&
        state.startFrame !== undefined
    );

  const ensureReady = () => {
    if (!state.uploadId) {
      setPreviewStatus("Upload a video first.");
      router.goTo("upload");
      return false;
    }
    if (!hasLapData()) {
      setPreviewStatus("Fill lap data before previewing.");
      router.goTo("lapTimes");
      return false;
    }
    return true;
  };

  const payloadFromState = () => ({
    uploadId: state.uploadId,
    lapText: state.lapText,
    lapFormat: state.lapFormat,
    driverName: state.driverName,
    startFrame:
      state.startFrame === null || state.startFrame === undefined
        ? undefined
        : Number(state.startFrame),
    overlayTextColor: state.textColor,
    overlayBoxColor: state.boxColor,
    showLapCounter: state.showLapCounter,
    showPosition: state.showPosition,
    showCurrentLapTime: state.showCurrentLapTime,
    previewLapNumber: state.previewLapNumber,
  });

  const updateButtons = (pending = false) => {
    const disabled = pending || !hasLapData();
    if (els.generatePreviewBtn) {
      els.generatePreviewBtn.disabled = disabled;
    }
    if (els.renderOverlayBtn) {
      els.renderOverlayBtn.disabled = disabled;
    }
  };

  const updateLapOptions = (lapCount) => {
    state.lapCount = lapCount;
    const select = els.previewLapSelect;
    if (!select) return;
    select.innerHTML = "";
    if (!lapCount || lapCount < 1) {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = "Waiting for laps…";
      select.appendChild(opt);
      select.disabled = true;
      return;
    }
    select.disabled = false;
    const current = Math.min(
      lapCount,
      Math.max(1, state.previewLapNumber || 1)
    );
    for (let i = 1; i <= lapCount; i++) {
      const opt = document.createElement("option");
      opt.value = String(i);
      opt.textContent = `Lap ${i}`;
      if (i === current) opt.selected = true;
      select.appendChild(opt);
    }
    state.previewLapNumber = current;
  };

  async function generatePreview() {
    if (!ensureReady()) return;
    updateButtons(true);
    setPreviewStatus("Generating preview…");
    clearPreviewImage();

    try {
      const res = await requestPreview(payloadFromState());
      if (res.selectedLap) {
        state.previewLapNumber = res.selectedLap;
      }
      if (res.lapCount != null) {
        updateLapOptions(res.lapCount);
      }
      if (res.previewUrl) {
        state.lastPreviewUrl = res.previewUrl;
        const cacheBust = `${res.previewUrl}?t=${Date.now()}`;
        els.previewImage.src = cacheBust;
        els.previewImage.alt = "Overlay preview frame";
        setPreviewStatus(
          res.selectedLap
            ? `Previewing lap ${res.selectedLap}`
            : "Preview updated"
        );
      } else {
        setPreviewStatus("Preview response missing URL");
      }
    } catch (err) {
      console.error(err);
      setPreviewStatus("Preview failed. Check inputs and try again.");
    } finally {
      updateButtons(false);
    }
  }

  async function handleGeneratePreview(event) {
    event.preventDefault();
    await generatePreview();
  }

  async function handleRenderOverlay(event) {
    event.preventDefault();
    if (!ensureReady()) return;
    updateButtons(true);
    setPreviewStatus("Queuing render…");
    setStatus(els.statusBody, "Starting render…");

    try {
      const job = await startRender(payloadFromState());
      setStatus(
        els.statusBody,
        `Render queued (#${job.jobId}). Polling for updates…`
      );
      router.goTo("transform");
      startPolling(job.jobId);
    } catch (err) {
      console.error(err);
      setPreviewStatus("Render request failed.");
      setStatus(
        els.statusBody,
        "Render request failed. Check inputs and try again.",
        true
      );
    } finally {
      updateButtons(false);
    }
  }

  const syncFromLapData = () => {
    if (state.lapText) setPreviewStatus("Ready to preview");
    else setPreviewStatus("Waiting for lap data…");
    syncColorInputs();
    syncContentToggles();
    updateButtons(false);
    updateLapOptions(state.lapCount || 0);
    if (state.lastPreviewUrl && els.previewImage) {
      els.previewImage.src = `${state.lastPreviewUrl}?t=${Date.now()}`;
      els.previewImage.alt = "Overlay preview frame";
      setPreviewStatus("Preview ready");
      return;
    }
    if (hasLapData()) {
      void generatePreview();
    } else {
      clearPreviewImage();
    }
  };

  els.textColorInput?.addEventListener("input", () => {
    state.textColor = els.textColorInput.value;
  });
  els.boxColorInput?.addEventListener("input", () => {
    state.boxColor = els.boxColorInput.value;
  });
  els.showLapCounterInput?.addEventListener("change", () => {
    state.showLapCounter = Boolean(els.showLapCounterInput.checked);
  });
  els.showPositionInput?.addEventListener("change", () => {
    state.showPosition = Boolean(els.showPositionInput.checked);
  });
  els.showCurrentLapTimeInput?.addEventListener("change", () => {
    state.showCurrentLapTime = Boolean(els.showCurrentLapTimeInput.checked);
  });
  els.previewLapSelect?.addEventListener("change", () => {
    const n = Number(els.previewLapSelect.value);
    if (Number.isFinite(n) && n >= 1) {
      state.previewLapNumber = n;
      void generatePreview();
    }
  });

  els.generatePreviewBtn?.addEventListener("click", handleGeneratePreview);
  els.renderOverlayBtn?.addEventListener("click", handleRenderOverlay);

  els.backToLapTimesPreview?.addEventListener("click", (event) => {
    event.preventDefault();
    router.goTo("lapTimes");
  });

  syncFromLapData();

  return { syncFromLapData };
}
