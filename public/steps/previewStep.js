import { requestPreview, startRender } from "../api.js";
import { setStatus } from "../status.js";
import { html, render } from "../template.js";

const TEXT_SIZE_OPTIONS = [16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64];

export function renderPreviewStep(root) {
  const section = document.createElement("section");
  section.className = "card step";
  section.id = "stepPreview";
  render(
    html`
      <div class="card__header">
        <div class="dot"></div>
        <div>
          <p class="eyebrow">Step 3</p>
          <h2>Preview overlay</h2>
        </div>
      </div>
      <div class="preview">
        <div class="preview__header">
          <div>
            <p class="eyebrow">Single frame</p>
            <h3>Check colors after your start</h3>
          </div>
          <div class="preview__header-controls">
            <label class="field preview__lap-select">
              <span>Lap for preview</span>
              <select id="previewLapSelect" disabled>
                <option value="">Waiting for laps…</option>
              </select>
            </label>
            <button class="btn preview__update" id="generatePreview">
              <span class="btn__icon" aria-hidden="true">&#8635;</span>
              <span>Update preview</span>
            </button>
          </div>
        </div>
        <div class="preview__image">
          <img id="previewImage" alt="Overlay preview" />
        </div>
        <div class="preview__grid">
          <div class="preview__group">
            <p class="eyebrow">Overlay tint</p>
            <div class="preview__group-body">
              <label class="field">
                <span>Overlay tint</span>
                <input type="color" id="boxColor" value="#000000" />
                <div class="field__hint">Applied with chosen opacity.</div>
              </label>
              <label class="field">
                <span>Overlay opacity</span>
                <div class="field__range">
                  <input
                    type="range"
                    id="overlayOpacity"
                    min="0"
                    max="100"
                    value="60"
                  />
                  <span id="overlayOpacityLabel" class="field__range-value">60%</span>
                </div>
                <div class="field__hint">
                  0% removes the tint; text stays fully opaque.
                </div>
              </label>
              <label class="field">
                <span>Overlay width</span>
                <div class="field__range">
                  <input
                    type="range"
                    id="overlayWidth"
                    min="15"
                    max="80"
                    value="45"
                  />
                  <span id="overlayWidthLabel" class="field__range-value">45%</span>
                </div>
                <div class="field__hint">
                  Percentage of video width.
                </div>
              </label>
            </div>
          </div>
          <div class="preview__group">
            <p class="eyebrow">Overlay position & content</p>
            <div class="preview__group-body">
              <label class="field">
                <span>Overlay position</span>
                <select id="overlayPosition">
                  <option value="bottom-left">Bottom left</option>
                  <option value="top-left">Top left</option>
                  <option value="top-right">Top right</option>
                  <option value="bottom-right">Bottom right</option>
                </select>
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
            </div>
          </div>
          <div class="preview__group">
            <p class="eyebrow">Text color</p>
            <div class="preview__group-body">
              <label class="field">
                <span>Text color</span>
                <input type="color" id="textColor" value="#ffffff" />
              </label>
              <label class="field">
                <span>Text size</span>
                <select id="textSize">
                  <option value="16">16px</option>
                  <option value="18">18px</option>
                  <option value="20">20px</option>
                  <option value="24">24px</option>
                  <option value="28">28px</option>
                  <option value="32">32px</option>
                  <option value="36">36px</option>
                  <option value="40">40px</option>
                  <option value="48">48px</option>
                  <option value="56">56px</option>
                  <option value="64">64px</option>
                </select>
                <div class="field__hint">Applies to lap info and timer.</div>
              </label>
            </div>
          </div>
        </div>
        <div class="step-nav">
          <button type="button" class="btn btn--ghost" id="backToSetup">
            Back to setup
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

  const syncPositionInput = () => {
    if (!els.overlayPositionSelect) return;
    els.overlayPositionSelect.value = state.overlayPosition || "bottom-left";
  };

  const syncOpacityInput = () => {
    if (!els.overlayOpacityInput) return;
    const pct = Math.round(state.overlayOpacityPct ?? 60);
    els.overlayOpacityInput.value = String(pct);
    if (els.overlayOpacityLabel) {
      els.overlayOpacityLabel.textContent = `${pct}%`;
    }
  };

  const syncWidthInput = () => {
    if (!els.overlayWidthInput) return;
    const pct = Math.round(state.overlayWidthPct ?? 45);
    els.overlayWidthInput.value = String(pct);
    if (els.overlayWidthLabel) {
      els.overlayWidthLabel.textContent = `${pct}%`;
    }
  };

  const getNearestTextSize = (size) => {
    const target = Number.isFinite(size) ? Math.round(size) : 32;
    let nearest = TEXT_SIZE_OPTIONS[0];
    let smallestDiff = Math.abs(target - nearest);
    for (const option of TEXT_SIZE_OPTIONS) {
      const diff = Math.abs(option - target);
      if (diff < smallestDiff) {
        smallestDiff = diff;
        nearest = option;
      }
    }
    return nearest;
  };

  const syncTextSizeInput = () => {
    if (!els.textSizeInput) return;
    const nearest = getNearestTextSize(state.textSize ?? 32);
    els.textSizeInput.value = String(nearest);
    state.textSize = nearest;
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

  const hasSessionStart = () =>
    Number.isFinite(state.sessionStartFrame) ||
    Number.isFinite(state.sessionStartTime);
  const hasLapStart = () =>
    Number.isFinite(state.startFrame) || Number.isFinite(state.lapStartTime);
  const hasLapData = () =>
    Boolean(
      state.uploadId &&
      state.laps &&
      state.laps.length > 0 &&
      hasLapStart() &&
      hasSessionStart()
    );

  const ensureReady = () => {
    if (!state.uploadId) {
      setPreviewStatus("Upload a video first.");
      router.goTo("upload");
      return false;
    }
    if (!hasLapData()) {
      setPreviewStatus("Fill lap data plus session and lap starts before previewing.");
      router.goTo("offsets");
      return false;
    }
    return true;
  };

  const payloadFromState = () => ({
    uploadId: state.uploadId,
    laps: state.laps || [],
    startFrame:
      state.startFrame === null || state.startFrame === undefined
        ? undefined
        : Number(state.startFrame),
    sessionStartFrame:
      state.sessionStartFrame === null || state.sessionStartFrame === undefined
        ? undefined
        : Number(state.sessionStartFrame),
    sessionStartTimestamp: Number.isFinite(state.sessionStartTime)
      ? String(state.sessionStartTime)
      : undefined,
    sessionEndFrame:
      state.sessionEndFrame === null || state.sessionEndFrame === undefined
        ? undefined
        : Number(state.sessionEndFrame),
    sessionEndTimestamp: Number.isFinite(state.sessionEndTime)
      ? String(state.sessionEndTime)
      : undefined,
    overlayTextColor: state.textColor,
    overlayTextSize: Number.isFinite(state.textSize)
      ? Number(state.textSize)
      : undefined,
    overlayBoxColor: state.boxColor,
    overlayBoxOpacity: (state.overlayOpacityPct ?? 60) / 100,
    overlayPosition: state.overlayPosition,
    overlayWidthRatio: (state.overlayWidthPct ?? 45) / 100,
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
    const count = lapCount ?? state.lapCount ?? 0;
    state.lapCount = count;
    const select = els.previewLapSelect;
    if (!select) return;
    select.innerHTML = "";
    if (!count || count < 1) {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = "Waiting for laps…";
      select.appendChild(opt);
      select.disabled = true;
      return;
    }
    select.disabled = false;
    const maxSelectable = count + 1;
    const current = Math.min(
      maxSelectable,
      Math.max(1, state.previewLapNumber || 1)
    );
    for (let i = 1; i <= count; i++) {
      const opt = document.createElement("option");
      opt.value = String(i);
      opt.textContent = `Lap ${i}`;
      if (i === current) opt.selected = true;
      select.appendChild(opt);
    }
    if (count >= 1) {
      const finishOpt = document.createElement("option");
      finishOpt.value = String(count + 1);
      finishOpt.textContent = "Finish / cooldown";
      if (current === count + 1) finishOpt.selected = true;
      select.appendChild(finishOpt);
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
    if (state.laps && state.laps.length) setPreviewStatus("Ready to preview");
    else setPreviewStatus("Waiting for lap data…");
    syncColorInputs();
    syncPositionInput();
    syncOpacityInput();
    syncWidthInput();
    syncTextSizeInput();
    syncContentToggles();
    updateButtons(false);
    updateLapOptions(state.lapCount || state.laps?.length || 0);
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
  els.overlayPositionSelect?.addEventListener("change", () => {
    const value = els.overlayPositionSelect.value;
    state.overlayPosition = value || "bottom-left";
  });
  els.overlayWidthInput?.addEventListener("input", () => {
    const value = Number(els.overlayWidthInput.value);
    if (Number.isFinite(value)) {
      const clamped = Math.min(80, Math.max(15, Math.round(value)));
      state.overlayWidthPct = clamped;
      els.overlayWidthInput.value = String(clamped);
      if (els.overlayWidthLabel) {
        els.overlayWidthLabel.textContent = `${clamped}%`;
      }
    }
  });
  els.textSizeInput?.addEventListener("change", () => {
    const nearest = getNearestTextSize(Number(els.textSizeInput.value));
    state.textSize = nearest;
    els.textSizeInput.value = String(nearest);
  });
  els.overlayOpacityInput?.addEventListener("input", () => {
    const value = Number(els.overlayOpacityInput.value);
    if (Number.isFinite(value)) {
      const clamped = Math.min(100, Math.max(0, Math.round(value)));
      state.overlayOpacityPct = clamped;
      els.overlayOpacityInput.value = String(clamped);
      if (els.overlayOpacityLabel) {
        els.overlayOpacityLabel.textContent = `${clamped}%`;
      }
    }
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

  els.backToSetup?.addEventListener("click", (event) => {
    event.preventDefault();
    router.goTo("offsets");
  });

  syncFromLapData();

  return { syncFromLapData };
}
