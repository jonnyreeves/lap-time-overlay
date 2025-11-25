import { startRender } from "../api.js";
import { html, render } from "../template.js";
import { renderStatus, setStatus } from "../status.js";

export function renderTransformStep(root) {
  const section = document.createElement("section");
  section.className = "card status step";
  section.id = "stepTransform";
  render(
    html`
      <div class="card__header">
        <div class="dot"></div>
        <div>
          <p class="eyebrow">Step 4</p>
          <h2>Transform &amp; download</h2>
        </div>
      </div>
      <form id="transformForm" class="transform">
        <div class="transform__grid">
          <div class="field">
            <span>Export mode</span>
            <div class="field__choices">
              <label>
                <input type="radio" name="exportMode" id="exportModeSingle" value="single" checked />
                <span>Full video overlay</span>
              </label>
              <label>
                <input type="radio" name="exportMode" id="exportModeCompare" value="compare" />
                <span>Side-by-side compare</span>
              </label>
            </div>
            <div class="field__hint">
              Compare runs two laps side-by-side until the slower lap finishes.
            </div>
          </div>
          <div id="compareFields" class="transform__compare hidden">
            <div class="field">
              <span>Left lap</span>
              <select id="compareLapA"></select>
            </div>
            <div class="field">
              <span>Right lap</span>
              <select id="compareLapB"></select>
            </div>
            <div class="field">
              <span>Audio</span>
              <div class="field__choices">
                <label>
                  <input type="radio" name="compareAudio" id="compareAudioMix" value="mix" checked />
                  <span>Mix both</span>
                </label>
                <label>
                  <input type="radio" name="compareAudio" id="compareAudioLeft" value="left" />
                  <span>Left lap only</span>
                </label>
                <label>
                  <input type="radio" name="compareAudio" id="compareAudioRight" value="right" />
                  <span>Right lap only</span>
                </label>
                <label>
                  <input type="radio" name="compareAudio" id="compareAudioMute" value="mute" />
                  <span>Mute</span>
                </label>
              </div>
              <div class="field__hint">
                Mixed audio by default; mute or pick a side if needed.
              </div>
            </div>
          </div>
        </div>
      </form>
      <div id="statusBody" class="status__body">
        <p class="muted">No job running yet.</p>
      </div>
      <div class="step-nav">
        <button type="button" class="btn btn--ghost" id="backToPreview">
          Back to preview
        </button>
        <button type="button" class="btn btn--primary" id="startExport">
          Start export
        </button>
      </div>
    `,
    section
  );
  root.appendChild(section);
}

export function initTransformStep({ els, state, router }) {
  let controlsDisabled = false;

  function clearPolling() {
    if (state.pollTimer) {
      clearInterval(state.pollTimer);
      state.pollTimer = null;
    }
  }

  async function startPolling(jobId) {
    clearPolling();
    state.pollTimer = setInterval(async () => {
      try {
        const res = await fetch(`/api/jobs/${encodeURIComponent(jobId)}`);
        if (!res.ok) throw new Error("Status error");
        const data = await res.json();
        renderStatus(els.statusBody, jobId, data);
        if (data.status === "complete" || data.status === "error") {
          clearPolling();
          setControlsDisabled(false);
        }
        if (data.status === "error") {
          controlsDisabled = false;
        }
      } catch (err) {
        console.error(err);
        setStatus(
          els.statusBody,
          "Lost connection while polling job status.",
          true
        );
        clearPolling();
        setControlsDisabled(false);
      }
    }, 1500);
  }

  function setControlsDisabled(disabled) {
    controlsDisabled = disabled;
    if (els.startExportBtn) els.startExportBtn.disabled = disabled;
    if (els.exportModeSingle) els.exportModeSingle.disabled = disabled;
    if (els.exportModeCompare) els.exportModeCompare.disabled = disabled;
    if (els.compareLapASelect) els.compareLapASelect.disabled = disabled;
    if (els.compareLapBSelect) els.compareLapBSelect.disabled = disabled;
    if (els.compareFields) {
      els.compareFields.classList.toggle("transform__compare--disabled", disabled);
    }
    const audioInputs = [
      els.compareAudioMix,
      els.compareAudioLeft,
      els.compareAudioRight,
      els.compareAudioMute,
    ].filter(Boolean);
    audioInputs.forEach((input) => {
      input.disabled = disabled;
    });
  }

  function formatLapLabel(lap) {
    return `Lap ${lap.number}`;
  }

  function populateLapOptions() {
    const laps = state.laps || [];
    const hasTwoLaps = laps.length >= 2;
    if (els.exportModeCompare) {
      els.exportModeCompare.disabled = !hasTwoLaps;
      if (!hasTwoLaps && state.exportMode === "compare") {
        state.exportMode = "single";
      }
    }

    const fastest = laps.reduce((min, lap) => {
      if (!Number.isFinite(lap.durationS) || lap.durationS <= 0) return min;
      if (!min) return lap;
      return lap.durationS < min.durationS ? lap : min;
    }, null);
    const bestDuration = fastest?.durationS ?? null;

    const buildLabel = (lap) => {
      if (!bestDuration || lap.durationS == null) return formatLapLabel(lap);
      if (lap.durationS === bestDuration) {
        return `${formatLapLabel(lap)} [fastest]`;
      }
      const delta = lap.durationS - bestDuration;
      const deltaLabel = delta > 0 ? `+${delta.toFixed(3)}` : "0.000";
      return `${formatLapLabel(lap)} [${deltaLabel}]`;
    };

    const ensureSelection = (current, fallback) => {
      if (current == null) return fallback;
      const found = laps.find((lap) => lap.number === current);
      return found ? current : fallback;
    };

    const defaultA = fastest?.number ?? (laps[0]?.number ?? null);
    const defaultB =
      laps.find((lap) => lap.number !== defaultA)?.number ?? defaultA;

    state.compareLapA = ensureSelection(state.compareLapA, defaultA);
    state.compareLapB = ensureSelection(state.compareLapB, defaultB);

    const sets = [
      { select: els.compareLapASelect, value: state.compareLapA },
      { select: els.compareLapBSelect, value: state.compareLapB },
    ];

    sets.forEach(({ select, value }) => {
      if (!select) return;
      select.innerHTML = "";
      laps.forEach((lap) => {
        const opt = document.createElement("option");
        opt.value = String(lap.number);
        opt.textContent = buildLabel(lap);
        if (lap.number === value) opt.selected = true;
        select.appendChild(opt);
      });
      select.disabled = !hasTwoLaps;
    });

    updateCompareVisibility();
  }

  function updateCompareVisibility() {
    const isCompare = state.exportMode === "compare";
    if (els.compareFields) {
      els.compareFields.classList.toggle("hidden", !isCompare);
    }
  }

  function syncFromState() {
    if (els.exportModeSingle) {
      els.exportModeSingle.checked = state.exportMode !== "compare";
    }
    if (els.exportModeCompare) {
      els.exportModeCompare.checked = state.exportMode === "compare";
    }
    if (els.compareAudioMix) {
      const mode = state.compareAudio || "mix";
      els.compareAudioMix.checked = mode === "mix";
      els.compareAudioLeft.checked = mode === "left";
      els.compareAudioRight.checked = mode === "right";
      els.compareAudioMute.checked = mode === "mute";
    }
    populateLapOptions();
  }

  function getExportPayload() {
    const laps = state.laps || [];
    const basePayload = {
      uploadId: state.uploadId,
      laps,
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
      overlayBoxColor: state.boxColor,
      overlayBoxOpacity: (state.overlayOpacityPct ?? 60) / 100,
      overlayPosition: state.overlayPosition,
      overlayWidthRatio: (state.overlayWidthPct ?? 45) / 100,
      showLapCounter: state.showLapCounter,
      showPosition: state.showPosition,
      showCurrentLapTime: state.showCurrentLapTime,
    };

    if (state.exportMode === "compare") {
      return {
        ...basePayload,
        exportMode: "compare",
        compareLapA: state.compareLapA,
        compareLapB: state.compareLapB,
        compareAudio: state.compareAudio || "mix",
      };
    }

    return { ...basePayload, exportMode: "single" };
  }

  async function startRenderJob() {
    if (controlsDisabled) return;
    if (!state.uploadId) {
      setStatus(
        els.statusBody,
        "Upload and prepare lap data before exporting.",
        true
      );
      router.goTo("upload");
      return;
    }
    if (!state.laps || !state.laps.length) {
      setStatus(els.statusBody, "Add lap data first.", true);
      router.goTo("offsets");
      return;
    }
    if (state.exportMode === "compare") {
      if (
        !Number.isFinite(state.compareLapA) ||
        !Number.isFinite(state.compareLapB)
      ) {
        setStatus(els.statusBody, "Pick two laps to compare.", true);
        return;
      }
      if (state.compareLapA === state.compareLapB) {
        setStatus(els.statusBody, "Pick two different laps to compare.", true);
        return;
      }
      if ((state.laps?.length ?? 0) < 2) {
        setStatus(
          els.statusBody,
          "Need at least two laps to run a comparison.",
          true
        );
        return;
      }
    }

    setControlsDisabled(true);
    setStatus(els.statusBody, "Starting render…");
    try {
      const job = await startRender(getExportPayload());
      setStatus(
        els.statusBody,
        `Render queued (#${job.jobId}). Polling for updates…`
      );
      startPolling(job.jobId);
    } catch (err) {
      console.error(err);
      setStatus(
        els.statusBody,
        "Render request failed. Check inputs and try again.",
        true
      );
      setControlsDisabled(false);
    }
  }

  function handleLapSelectChange(event) {
    const select = event.target;
    if (!(select instanceof HTMLSelectElement)) return;
    const value = Number(select.value);
    if (!Number.isFinite(value)) return;
    if (select === els.compareLapASelect) {
      state.compareLapA = value;
    } else if (select === els.compareLapBSelect) {
      state.compareLapB = value;
    }
  }

  els.exportModeSingle?.addEventListener("change", () => {
    if (els.exportModeSingle.checked) {
      state.exportMode = "single";
      updateCompareVisibility();
    }
  });

  els.exportModeCompare?.addEventListener("change", () => {
    if (els.exportModeCompare.checked) {
      state.exportMode = "compare";
      updateCompareVisibility();
    }
  });

  els.compareLapASelect?.addEventListener("change", handleLapSelectChange);
  els.compareLapBSelect?.addEventListener("change", handleLapSelectChange);

  els.compareAudioMix?.addEventListener("change", () => {
    if (els.compareAudioMix.checked) state.compareAudio = "mix";
  });
  els.compareAudioLeft?.addEventListener("change", () => {
    if (els.compareAudioLeft.checked) state.compareAudio = "left";
  });
  els.compareAudioRight?.addEventListener("change", () => {
    if (els.compareAudioRight.checked) state.compareAudio = "right";
  });
  els.compareAudioMute?.addEventListener("change", () => {
    if (els.compareAudioMute.checked) state.compareAudio = "mute";
  });

  els.startExportBtn?.addEventListener("click", (event) => {
    event.preventDefault();
    void startRenderJob();
  });

  els.backToPreview.addEventListener("click", (event) => {
    event.preventDefault();
    router.goTo("preview");
  });

  syncFromState();

  return { startPolling, clearPolling, syncFromState };
}
