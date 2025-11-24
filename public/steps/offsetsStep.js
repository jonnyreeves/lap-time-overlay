import { FALLBACK_FPS } from "../constants.js";
import { extractDrivers, populateDrivers } from "../drivers.js";
import { formatDuration, formatTime } from "../formatters.js";
import { setStatus } from "../status.js";
import { html, render } from "../template.js";
import { createVideoControls } from "../videoControls.js";

const DAYTONA_LAP_LINE_RE = /^\s*(\d+)\s+(\d+):(\d+):(\d+)\s+\[(\d+)\]\s*$/; // 01 0:57:755 [11]

function parseStartTimestamp(ts) {
  let main = ts;
  let ms = 0;

  if (ts.includes(".")) {
    const [m, msPart] = ts.split(".");
    main = m;
    ms = parseInt(msPart.padEnd(3, "0").slice(0, 3), 10);
  }

  const parts = main.split(":").map((p) => parseInt(p, 10));
  let h = 0;
  let m = 0;
  let s = 0;

  if (parts.length === 3) {
    [h, m, s] = parts;
  } else if (parts.length === 2) {
    [m, s] = parts;
  } else if (parts.length === 1) {
    s = parts[0];
  } else {
    throw new Error(`Unrecognised timestamp format: ${ts}`);
  }

  return h * 3600 + m * 60 + s + ms / 1000;
}

function addStartOffsets(laps) {
  let cumulative = 0;
  for (const lap of laps) {
    lap.startS = cumulative;
    cumulative += lap.durationS;
  }
  return laps;
}

function parseDaytonaLapText(text) {
  const lines = text.split(/\r?\n/);
  const laps = [];

  for (const lineRaw of lines) {
    const line = lineRaw.trim();
    if (!line || line.startsWith("#")) continue;

    const m = line.match(DAYTONA_LAP_LINE_RE);
    if (!m) {
      throw new Error(`Cannot parse lap line: "${line}"`);
    }

    const lapNum = parseInt(m[1], 10);
    const mm = parseInt(m[2], 10);
    const ss = parseInt(m[3], 10);
    const ms = parseInt(m[4], 10);
    const pos = parseInt(m[5], 10);

    const durationS = mm * 60 + ss + ms / 1000;
    laps.push({ number: lapNum, durationS, position: pos, startS: 0 });
  }

  return addStartOffsets(laps);
}

function splitCells(line) {
  const tabParts = line.split(/\t+/);
  if (tabParts.length > 1) return tabParts.map((p) => p.trim());
  return line.split(/ {2,}/).map((p) => p.trim());
}

function parseTeamsportLapText(text, driverName) {
  if (!driverName) {
    throw new Error("driverName is required for teamsport format");
  }

  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (!lines.length) {
    throw new Error("No lines found in lap file");
  }

  const headerCells = splitCells(lines[0]);
  if (headerCells.length < 2) {
    throw new Error("Header row not found or invalid for teamsport format");
  }

  const driverCells = headerCells.slice(1);
  const driverIndex = driverCells.findIndex(
    (name) => name.toLowerCase() === driverName.toLowerCase()
  );
  if (driverIndex === -1) {
    throw new Error(`Driver "${driverName}" not found in header`);
  }

  const laps = [];
  for (let i = 1; i < lines.length; i++) {
    const rowCells = splitCells(lines[i]);
    if (rowCells.length <= driverIndex + 1) continue;
    const lapNum = parseInt(rowCells[0], 10);
    const timeStr = rowCells[driverIndex + 1];
    if (!timeStr) continue;
    const durationS = parseStartTimestamp(timeStr);
    laps.push({ number: lapNum, durationS, position: 0, startS: 0 });
  }

  return addStartOffsets(laps);
}

function parseImportText(text, format, driverName) {
  const trimmed = text.trim();
  if (!trimmed) return { error: "Paste lap times to import." };
  try {
    switch (format) {
      case "daytona":
        return { laps: parseDaytonaLapText(trimmed) };
      case "teamsport":
        return { laps: parseTeamsportLapText(trimmed, driverName) };
      default:
        return { error: "Unknown lap format" };
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Import failed" };
  }
}

function formatLapDurationInput(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "";
  const totalMs = Math.round(seconds * 1000);
  const wholeSeconds = Math.floor(totalMs / 1000);
  const ms = totalMs % 1000;
  const s = wholeSeconds % 60;
  const m = Math.floor(wholeSeconds / 60);
  return `${m.toString().padStart(2, "0")}:${s
    .toString()
    .padStart(2, "0")}:${ms.toString().padStart(3, "0")}`;
}

function parseLapDurationInput(value) {
  const raw = value?.trim();
  if (!raw) return null;
  const cleaned = raw.replace(/\s+/g, "");
  const colonParts = cleaned.split(":");

  const parseMs = (str = "") => {
    if (str === "") return 0;
    const asNum = Number(str);
    if (!Number.isFinite(asNum) || asNum < 0) return null;
    return asNum / 1000;
  };

  if (colonParts.length === 3) {
    const [mStr, sStr, msStr] = colonParts;
    const m = Number(mStr);
    const s = Number(sStr);
    const ms = parseMs(msStr);
    if ([m, s, ms].every((n) => Number.isFinite(n)) && ms !== null) {
      return m * 60 + s + ms;
    }
  }

  if (colonParts.length === 2) {
    const [mStr, secMs] = colonParts;
    const [sStr, msStr = ""] = secMs.split(/[.:]/);
    const m = Number(mStr);
    const s = Number(sStr);
    const ms = parseMs(msStr);
    if ([m, s, ms].every((n) => Number.isFinite(n)) && ms !== null) {
      return m * 60 + s + ms;
    }
  }

  if (colonParts.length === 1 && cleaned.includes(".")) {
    const [sStr, msStr = ""] = cleaned.split(".");
    const s = Number(sStr);
    const ms = parseMs(msStr);
    if ([s, ms].every((n) => Number.isFinite(n)) && ms !== null) {
      return s + ms;
    }
  }

  return null;
}

function normalizeLapList(laps) {
  const withIndex = (laps || []).map((lap, idx) => ({ lap, idx }));
  const sorted = withIndex
    .filter(
      ({ lap }) => Number.isFinite(lap?.number) && Number(lap.number) >= 1
    )
    .map(({ lap, idx }) => ({
      number: Math.round(Number(lap.number)),
      durationS: Number(lap.durationS),
      position: Math.max(0, Math.round(Number(lap.position || 0))),
      startS: 0,
      idx,
    }))
    .filter((lap) => Number.isFinite(lap.durationS) && lap.durationS > 0)
    .sort((a, b) => {
      if (a.number === b.number) return a.idx - b.idx;
      return a.number - b.number;
    })
    .map(({ idx, ...lap }) => lap);

  return addStartOffsets(sorted);
}

function nextLapNumber(laps = []) {
  if (!laps.length) return 1;
  const max = Math.max(...laps.map((lap) => lap.number || 0));
  return Math.max(1, max + 1);
}

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
          <h2>Lap data & start offset</h2>
        </div>
      </div>

      <div class="lap-setup">
        <form id="lapSetupForm" class="form lap-setup__form">
          <div class="lap-builder">
            <div class="lap-builder__header">
              <div>
                <p class="eyebrow">Lap data</p>
                <h3>Build lap times</h3>
              </div>
              <div class="lap-builder__actions">
                <button class="btn btn--ghost" type="button" id="importLapBtn">
                  Import
                </button>
                <button class="btn" type="button" id="addLapBtn">Add lap</button>
              </div>
            </div>
            <p class="field__hint">
              Add lap number + time (MM:SS:mmm). We auto-calc lap starts for preview.
            </p>
            <div class="lap-list" id="lapList">
            </div>
          </div>
        </form>

        <div class="lap-setup__preview">
          <div class="preview">
            <div class="preview__header">
              <div>
                <p class="eyebrow">Mark lap 1</p>
                <h3>Scrub & set start</h3>
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
                  type="button"
                  id="stepBackBtn"
                  title="Shortcut: Left arrow or J"
                >
                  −1 frame
                </button>
                <button
                  class="btn btn--ghost"
                  type="button"
                  id="stepForwardBtn"
                  title="Shortcut: Right arrow or K"
                >
                  +1 frame
                </button>
              </div>
              <button class="btn" type="button" id="markStartBtn">
                Mark start here
              </button>
            </div>
          </div>

          <div class="step-nav lap-setup__nav">
            <button type="button" class="btn btn--ghost" id="backToUpload">
              Back
            </button>
            <button
              type="submit"
              form="lapSetupForm"
              class="btn btn--primary"
              id="nextToPreview"
            >
              Next: Preview overlay
            </button>
          </div>
        </div>
      </div>

      <div class="modal hidden" id="lapImportModal">
        <div class="modal__backdrop"></div>
        <div class="modal__dialog" role="dialog" aria-modal="true">
          <div class="modal__header">
            <h3 class="modal__title">Import lap times</h3>
            <button
              type="button"
              class="modal__close"
              id="closeLapImport"
              aria-label="Close import"
            >
              ✕
            </button>
          </div>
          <div class="modal__body modal__body--padded">
            <div class="lap-import">
              <div class="lap-import__row">
                <label class="field">
                  <span>Format</span>
                  <select id="lapImportFormat">
                    <option value="daytona">Daytona</option>
                    <option value="teamsport">TeamSport</option>
                  </select>
                </label>
                <label class="field" id="lapImportDriverField">
                  <span>Driver (TeamSport)</span>
                  <select id="lapImportDriver">
                    <option value="">Pick a driver</option>
                  </select>
                  <div class="field__hint">
                    We scan the pasted header row to list drivers.
                  </div>
                </label>
              </div>

              <label class="field lap-setup__lap-text">
                <span>Pasted lap times</span>
                <textarea
                  id="lapImportText"
                  rows="10"
                  placeholder="Paste Daytona or TeamSport export"
                ></textarea>
              </label>

              <div class="lap-import__actions">
                <button class="btn btn--ghost" type="button" id="cancelLapImport">
                  Cancel
                </button>
                <button class="btn btn--primary" type="button" id="applyLapImport">
                  Use laps
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
    section
  );
  root.appendChild(section);
}

export function initOffsetsStep(options) {
  const { els, state, router, onLapDataReady } = options;
  let previewIsObjectUrl = false;
  let activeSelection = { type: "session-start", index: -1 };
  const getFps = () => state.videoInfo?.fps ?? FALLBACK_FPS;
  const frameToSeconds = (frame) =>
    Number.isFinite(frame) ? frame / getFps() : null;
  const getVideoDuration = () => {
    const videoDur =
      Number.isFinite(els.previewVideo?.duration) && els.previewVideo.duration > 0
        ? els.previewVideo.duration
        : null;
    if (videoDur != null) return videoDur;
    if (Number.isFinite(state.videoInfo?.duration)) {
      return state.videoInfo.duration;
    }
    return null;
  };
  const hasSessionStart = () =>
    Number.isFinite(state.sessionStartTime) ||
    Number.isFinite(state.sessionStartFrame);
  const hasLapStart = () =>
    Number.isFinite(state.lapStartTime) || Number.isFinite(state.startFrame);

  const videoControls = createVideoControls({
    video: els.previewVideo,
    timeReadout: els.timeReadout,
    startFrameInput: null,
    markButton: els.markStartBtn,
    stepBackButton: els.stepBackBtn,
    stepForwardButton: els.stepForwardBtn,
    getFps: () => state.videoInfo?.fps ?? FALLBACK_FPS,
    getDuration: () =>
      Number.isFinite(els.previewVideo.duration) &&
        els.previewVideo.duration > 0
        ? els.previewVideo.duration
        : state.videoInfo?.duration,
    onMark: (frame, seconds) => handleMarkAt(frame, seconds),
  });

  const setAlignmentStatus = () => {};

  const updateMarkButtonLabel = () => {
    if (!els.markStartBtn) return;
    if (activeSelection.type === "session-start") {
      els.markStartBtn.textContent = "Mark session start";
    } else if (activeSelection.type === "session-end") {
      els.markStartBtn.textContent = "Mark session end";
    } else {
      const lapNumber =
        state.laps && state.laps[activeSelection.index]
          ? state.laps[activeSelection.index].number
          : activeSelection.index + 1;
      els.markStartBtn.textContent = `Mark Lap ${lapNumber} start`;
    }
  };

  const hasLapData = () => (state.laps?.length ?? 0) > 0;
  const getSessionStartTime = () => {
    if (Number.isFinite(state.sessionStartTime)) return state.sessionStartTime;
    if (
      state.sessionStartFrame != null &&
      Number.isFinite(state.sessionStartFrame)
    ) {
      return frameToSeconds(state.sessionStartFrame);
    }
    return null;
  };
  const getSessionEndTime = () => {
    if (Number.isFinite(state.sessionEndTime)) return state.sessionEndTime;
    if (state.sessionEndFrame != null && Number.isFinite(state.sessionEndFrame)) {
      return frameToSeconds(state.sessionEndFrame);
    }
    return null;
  };
  const getLapStartTime = () => {
    if (Number.isFinite(state.lapStartTime)) return state.lapStartTime;
    if (state.startFrame != null && Number.isFinite(state.startFrame)) {
      return frameToSeconds(state.startFrame);
    }
    return null;
  };

  const setActiveSelection = (type, index = -1) => {
    if (type === "session-start") {
      activeSelection = { type: "session-start", index: -1 };
    } else if (type === "session-end") {
      activeSelection = { type: "session-end", index: -1 };
    } else {
      activeSelection = { type: "lap", index };
    }
    updateMarkButtonLabel();
    renderLapList();
  };

  const updateLapActionState = () => {
    const enabled = hasSessionStart();
    if (els.addLapBtn) els.addLapBtn.disabled = !enabled;
    if (els.importLapBtn) els.importLapBtn.disabled = !enabled;
  };

  const updateButtons = (pending = false) => {
    const ready =
      state.uploadReady &&
      hasLapData() &&
      hasLapStart() &&
      hasSessionStart();
    if (els.nextToPreview) {
      els.nextToPreview.disabled = pending || !ready;
    }
    if (els.alignmentPreviewBtn) {
      els.alignmentPreviewBtn.disabled = true;
    }
  };

  const updateLapOptions = (lapCount) => {
    const count = lapCount ?? state.lapCount ?? 0;
    state.lapCount = count;
    state.previewLapNumber = Math.min(
      Math.max(1, state.previewLapNumber || 1),
      count + (count > 0 ? 1 : 0)
    );
  };

  const renderLapList = () => {
    if (!els.lapList) return;
    const laps = state.laps || [];
    const sessionTime = getSessionStartTime();
    const sessionEndTime = getSessionEndTime();
    const lapAnchor = getLapStartTime();
    const sessionStartActive = activeSelection.type === "session-start";
    const sessionEndActive = activeSelection.type === "session-end";
    const sessionLabelTime = sessionTime ?? 0;
    const sessionEndLabelTime =
      sessionEndTime != null ? sessionEndTime : getVideoDuration();
    render(
      html`
        <div
          class="lap-row lap-row--session ${sessionStartActive
          ? "lap-row--active"
          : ""}"
          data-select="session-start"
        >
          <div class="lap-row__fields">
            <div class="field">
              <span>Session start</span>
              <div class="badge badge--ghost">
                ${sessionTime != null
          ? `${formatTime(sessionTime)} (frame ${state.sessionStartFrame ?? "--"})`
          : "Not set"}
              </div>
            </div>
          </div>
          <div class="lap-row__meta">
            <button
              class="badge badge--ghost lap-row__jump"
              type="button"
              data-action="jump-session-start"
            >
              Start at ${formatTime(sessionLabelTime)}
            </button>
          </div>
        </div>
        ${laps.length === 0
          ? html`<p class="muted lap-list__empty">
              ${hasSessionStart()
                ? "No laps yet. Add manually or import."
                : "No laps yet. Set the session start time before adding lap times."}
            </p>`
          : html`<div class="lap-rows">
              ${laps.map(
            (lap, idx) => {
              const isActive =
                activeSelection.type === "lap" && activeSelection.index === idx;
              return html`
                    <div
                      class="lap-row ${isActive ? "lap-row--active" : ""}"
                      data-select="lap"
                      data-index=${idx}
                    >
                      <div class="lap-row__fields">
                        <label class="field">
                          <span>Lap</span>
                          <input
                            type="number"
                            min="1"
                            readonly
                            data-index=${idx}
                            data-field="number"
                            value=${lap.number}
                          />
                        </label>
                        <label class="field">
                          <span>Lap time</span>
                          <input
                            type="text"
                            data-index=${idx}
                            data-field="time"
                            value=${formatLapDurationInput(lap.durationS)}
                            placeholder="01:02:345"
                          />
                        </label>
                      </div>
                      <div class="lap-row__meta">
                        <button
                          class="badge badge--ghost lap-row__jump"
                          type="button"
                          data-action="jump-lap"
                          data-index=${idx}
                          aria-label="Jump to lap ${lap.number}"
                        >
                          Starts at ${lapAnchor != null
          ? formatTime((lap.startS ?? 0) + lapAnchor)
          : "Lap 1 start not set"}
                        </button>
                        <button
                          class="upload__control upload__control--danger"
                          type="button"
                          data-action="remove-lap"
                          data-index=${idx}
                          aria-label="Remove lap ${lap.number}"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  `;
            }
          )}
            </div>`}
        <div
          class="lap-row lap-row--session ${sessionEndActive
          ? "lap-row--active"
          : ""}"
          data-select="session-end"
        >
          <div class="lap-row__fields">
            <div class="field">
              <span>Session end</span>
              <div class="badge badge--ghost">
                ${sessionEndTime != null
          ? `${formatTime(sessionEndTime)} (frame ${state.sessionEndFrame ?? "--"})`
          : "Not set (uses video end)"}
              </div>
            </div>
          </div>
          <div class="lap-row__meta">
            <button
              class="badge badge--ghost lap-row__jump"
              type="button"
              data-action="jump-session-end"
            >
              ${sessionEndLabelTime != null
          ? `Start at ${formatTime(sessionEndLabelTime)}`
          : "Start at end"}
            </button>
          </div>
        </div>
      `,
      els.lapList
    );
  };

  const applyLapState = (laps) => {
    const offset = Number(state.lapStartOffsetS) || 0;
    const normalized = normalizeLapList(laps || []).map((lap) => ({
      ...lap,
      startS: lap.startS + offset,
    }));
    state.laps = normalized;
    state.lapCount = normalized.length;
    const maxSelectable = state.lapCount + (state.lapCount > 0 ? 1 : 0);
    state.previewLapNumber = Math.min(
      Math.max(1, state.previewLapNumber || 1),
      Math.max(1, maxSelectable || 1)
    );
    updateLapOptions();
    state.lastPreviewUrl = null;
    if (
      activeSelection.type === "lap" &&
      (activeSelection.index < 0 || activeSelection.index >= state.lapCount)
    ) {
      activeSelection = { type: "session-start", index: -1 };
    }
    updateButtons();
    updateMarkButtonLabel();
    renderLapList();
  };

  const addLap = () => {
    if (!hasSessionStart()) {
      setStatus(
        els.statusBody,
        "Mark the session start before adding laps.",
        true
      );
      return;
    }
    const laps = state.laps ? [...state.laps] : [];
    const lapNumber = nextLapNumber(laps);
    laps.push({ number: lapNumber, durationS: 60, position: 0, startS: 0 });
    applyLapState(laps);
    setStatus(els.statusBody, `Added lap ${lapNumber}. Fill in the time.`);
    setActiveSelection("lap", laps.length - 1);
  };

  const handleLapListChange = (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    const idx = Number(target.dataset.index);
    const field = target.dataset.field;
    if (!Number.isInteger(idx) || idx < 0) return;
    const laps = state.laps ? [...state.laps] : [];
    const lap = laps[idx];
    if (!lap) return;

    if (field === "time") {
      const parsed = parseLapDurationInput(target.value);
      if (!parsed || parsed <= 0) {
        setStatus(
          els.statusBody,
          "Use MM:SS:mmm (e.g. 01:02:345) for lap times.",
          true
        );
        target.value = formatLapDurationInput(lap.durationS);
        return;
      }
      lap.durationS = parsed;
    } else {
      return;
    }
    applyLapState(laps);
  };

  const handleLapListClick = (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const action = target.closest("[data-action]");
    if (action) {
      const idx = Number(action.getAttribute("data-index"));
      if (!Number.isInteger(idx) || idx < 0) return;
      if (action.getAttribute("data-action") === "remove-lap") {
        const laps = state.laps ? [...state.laps] : [];
        laps.splice(idx, 1);
        applyLapState(laps);
        setStatus(els.statusBody, "Removed lap entry.");
        return;
      }
      if (action.getAttribute("data-action") === "jump-lap") {
        const targetLap = idx + 1;
        jumpToLapStart(targetLap);
        return;
      }
      if (action.getAttribute("data-action") === "jump-session-start") {
        jumpToTime(getSessionStartTime(), 0);
        return;
      }
      if (action.getAttribute("data-action") === "jump-session-end") {
        jumpToTime(getSessionEndTime(), getVideoDuration());
        return;
      }
    }
    const row = target.closest("[data-select]");
    if (!row) return;
    const type = row.getAttribute("data-select");
    if (type === "session-start") {
      setActiveSelection("session-start");
    } else if (type === "session-end") {
      setActiveSelection("session-end");
    } else if (type === "lap") {
      const idx = Number(row.getAttribute("data-index"));
      if (Number.isInteger(idx) && idx >= 0) {
        setActiveSelection("lap", idx);
      }
    }
  };

  function setPreviewSource(url, { isObjectUrl }) {
    if (previewIsObjectUrl && state.previewUrl) {
      URL.revokeObjectURL(state.previewUrl);
    }
    state.previewUrl = url;
    previewIsObjectUrl = isObjectUrl;
    els.previewVideo.src = url;
    els.previewVideo.load();
    state.startFrame = null;
    state.lapStartTime = null;
    state.sessionStartFrame = 0;
    state.sessionStartTime = 0;
    state.sessionEndFrame = null;
    state.sessionEndTime = null;
    state.lapStartOffsetS = 0;
    videoControls.setEnabled(false);
    setAlignmentStatus("Waiting for lap data…");
    updateButtons();
    updateLapActionState();
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
    if (els.videoMeta) {
      els.videoMeta.textContent = `${info.fps.toFixed(2)} fps • ${formatDuration(
        info.duration
      )}`;
    }
    state.videoInfo = info;
    videoControls.setEnabled(true);
    videoControls.updateTimeReadout();
    updateButtons();
  }

  const handleMarkAt = (frame, seconds) => {
    if (activeSelection.type === "session-start") {
      state.sessionStartFrame = frame;
      state.sessionStartTime = seconds;
      if (
        Number.isFinite(state.sessionEndTime) &&
        state.sessionEndTime <= seconds
      ) {
        state.sessionEndTime = null;
        state.sessionEndFrame = null;
      }
      setStatus(
        els.statusBody,
        `Session start set to frame ${frame} (t=${formatTime(seconds)})`
      );
      updateButtons();
      updateLapActionState();
      if (state.startFrame == null) {
        state.startFrame = frame;
        state.lapStartTime = seconds;
      }
      const hasLaps = Array.isArray(state.laps) && state.laps.length > 0;
      if (!hasLaps) {
        applyLapState([{ number: 1, durationS: 60, position: 0, startS: 0 }]);
        setActiveSelection("lap", 0);
      } else {
        applyLapState(state.laps || []);
      }
      return;
    }

    if (activeSelection.type === "session-end") {
      const startTime = getSessionStartTime();
      if (!Number.isFinite(startTime)) {
        setStatus(
          els.statusBody,
          "Mark the session start before setting the session end.",
          true
        );
        return;
      }
      if (!Number.isFinite(seconds) || seconds <= startTime) {
        setStatus(
          els.statusBody,
          "Session end must be later than the session start.",
          true
        );
        return;
      }
      state.sessionEndFrame = frame;
      state.sessionEndTime = seconds;
      setStatus(
        els.statusBody,
        `Session end set to frame ${frame} (t=${formatTime(seconds)})`
      );
      updateButtons();
      renderLapList();
      return;
    }

    const idx = activeSelection.index;
    const laps = state.laps ? [...state.laps] : [];
    if (!laps[idx]) {
      setStatus(
        els.statusBody,
        "Select a valid lap before marking its length.",
        true
      );
      return;
    }

    if (idx === 0) {
      state.startFrame = frame;
      state.lapStartTime = seconds;
      setStatus(
        els.statusBody,
        `Lap 1 start set to frame ${frame} (t=${formatTime(seconds)})`
      );
      updateButtons();
      updateLapActionState();
      applyLapState(state.laps || []);
      return;
    }

    const lapAnchor = getLapStartTime();
    if (!Number.isFinite(lapAnchor)) {
      setStatus(
        els.statusBody,
        "Set the Lap 1 start before marking lap lengths.",
        true
      );
      return;
    }

    const elapsed = seconds - lapAnchor;
    const targetIdx = Math.max(0, idx - 1);
    const prevTotal = laps
      .slice(0, targetIdx)
      .reduce((sum, lap) => sum + (lap.durationS || 0), 0);
    const newDuration = elapsed - prevTotal;
    if (!Number.isFinite(newDuration) || newDuration <= 0) {
      setStatus(
        els.statusBody,
        "Mark later than the previous lap to set a positive duration.",
        true
      );
      return;
    }

    laps[targetIdx] = { ...laps[targetIdx], durationS: newDuration };
    applyLapState(laps);
    setStatus(
      els.statusBody,
      `Lap ${laps[targetIdx].number} set to ${formatTime(newDuration)}.`
    );
  };

  const validateLapInputs = () => {
    if (!state.uploadId) {
      setStatus(
        els.statusBody,
        "Upload and combine your video before setting lap data.",
        true
      );
      return false;
    }

    if (!hasLapData()) {
      setStatus(els.statusBody, "Add at least one lap first.", true);
      return false;
    }

    if (!hasSessionStart()) {
      setStatus(
        els.statusBody,
        "Mark the session start (frame 0 = first frame) to set where the clip begins.",
        true
      );
      return false;
    }

    if (!hasLapStart()) {
      setStatus(
        els.statusBody,
        "Mark the Lap 1 start (frame 0 = first frame) to align laps.",
        true
      );
      return false;
    }

    const fps = getFps();
    if (Number.isFinite(state.sessionStartFrame)) {
      const frame = Math.max(0, Math.round(Number(state.sessionStartFrame)));
      state.sessionStartFrame = frame;
      state.sessionStartTime = frameToSeconds(frame);
    } else if (Number.isFinite(state.sessionStartTime)) {
      if (state.sessionStartTime < 0) {
        setStatus(els.statusBody, "Session start must be 0 or greater.", true);
        return false;
      }
    }

    if (Number.isFinite(state.startFrame)) {
      const parsedStart = Math.max(0, Math.round(Number(state.startFrame)));
      state.startFrame = parsedStart;
      state.lapStartTime = frameToSeconds(parsedStart);
    } else if (Number.isFinite(state.lapStartTime) && state.lapStartTime < 0) {
      setStatus(els.statusBody, "Lap 1 start must be 0 or greater.", true);
      return false;
    }

    const sessionStartTime = getSessionStartTime();
    const lapStartTime = getLapStartTime();
    if (!Number.isFinite(lapStartTime)) {
      setStatus(
        els.statusBody,
        "Lap 1 start must be set to a valid timestamp.",
        true
      );
      return false;
    }
    if (
      Number.isFinite(sessionStartTime) &&
      lapStartTime < (sessionStartTime ?? 0)
    ) {
      setStatus(
        els.statusBody,
        "Lap 1 start cannot be earlier than the session start.",
        true
      );
      return false;
    }

    if (Number.isFinite(state.sessionEndFrame)) {
      const frame = Math.max(0, Math.round(Number(state.sessionEndFrame)));
      state.sessionEndFrame = frame;
      state.sessionEndTime = frameToSeconds(frame);
    }
    const sessionEnd = getSessionEndTime();
    if (
      Number.isFinite(sessionEnd) &&
      Number.isFinite(sessionStartTime) &&
      sessionEnd <= (sessionStartTime ?? 0)
    ) {
      setStatus(
        els.statusBody,
        "Session end must be later than the session start.",
        true
      );
      return false;
    }

    return true;
  };

  const jumpToLapStart = (targetLap) => {
    if (!validateLapInputs()) return;
    const laps = state.laps || [];
    if (!laps.length) {
      return;
    }

    const fps = getFps();
    const startFrame = Number.isFinite(state.startFrame)
      ? Number(state.startFrame)
      : 0;
    const startOffset = startFrame / fps;
    const sessionStartTime = getSessionStartTime();
    const sessionEndTime = getSessionEndTime();

    const rawValue = targetLap ?? Number(els.alignmentLapSelect.value);
    const maxSelectable = laps.length + 1;
    let lapNumber = Number.isFinite(rawValue) ? Number(rawValue) : 1;
    if (lapNumber < 1) lapNumber = 1;
    lapNumber = Math.min(lapNumber, maxSelectable);
    state.previewLapNumber = lapNumber;

    const isFinish = lapNumber === maxSelectable && laps.length >= 1;
    const lapIndex = Math.min(lapNumber, laps.length) - 1;
    const lap = laps[Math.max(0, lapIndex)];
    const sessionEnd = lap.startS + lap.durationS;
    const targetTime = isFinish
      ? startOffset + sessionEnd
      : startOffset + lap.startS;
    const video = els.previewVideo;
    if (!video || !video.src) {
      setStatus(
        els.statusBody,
        "Load the video before jumping to a lap.",
        true
      );
      return;
    }
    const duration = Number.isFinite(video.duration) ? video.duration : null;
    const maxByDuration =
      duration != null ? Math.max(duration - 0.05, 0) : null;
    let upperLimit = sessionEndTime != null ? sessionEndTime : null;
    if (upperLimit == null) {
      upperLimit = maxByDuration;
    } else if (maxByDuration != null) {
      upperLimit = Math.min(upperLimit, maxByDuration);
    }
    let clampedTime =
      upperLimit != null
        ? Math.max(0, Math.min(targetTime, upperLimit))
        : Math.max(0, targetTime);
    if (sessionStartTime != null) {
      clampedTime = Math.max(sessionStartTime, clampedTime);
    }

    video.currentTime = clampedTime;
    videoControls.updateTimeReadout();
  };

  const jumpToTime = (timeSeconds, fallback) => {
    const target = Number.isFinite(timeSeconds) ? timeSeconds : fallback;
    if (!Number.isFinite(target)) {
      setStatus(els.statusBody, "Time not set yet.", true);
      return;
    }
    const video = els.previewVideo;
    if (!video || !video.src) {
      setStatus(
        els.statusBody,
        "Load the video before jumping to a time.",
        true
      );
      return;
    }
    const duration = Number.isFinite(video.duration) ? video.duration : null;
    const clamped = duration
      ? Math.max(0, Math.min(target, Math.max(duration - 0.05, 0)))
      : Math.max(0, target);
    video.currentTime = clamped;
    videoControls.updateTimeReadout();
    setAlignmentStatus(`Jumped to ${formatTime(clamped)}`);
  };

  const syncImportDrivers = () => {
    if (els.lapImportFormat?.value !== "teamsport") return;
    const drivers = extractDrivers(els.lapImportText?.value || "");
    populateDrivers(els.lapImportDriverSelect, drivers);
  };

  const handleImportFormatChange = () => {
    const format = els.lapImportFormat?.value || "daytona";
    if (els.lapImportDriverField) {
      els.lapImportDriverField.style.display =
        format === "teamsport" ? "flex" : "none";
    }
    if (format !== "teamsport" && els.lapImportDriverSelect) {
      els.lapImportDriverSelect.value = "";
    } else if (format === "teamsport") {
      syncImportDrivers();
    }
  };

  const openImportModal = () => {
    if (!els.lapImportModal) return;
    els.lapImportModal.classList.remove("hidden");
    handleImportFormatChange();
    syncImportDrivers();
  };

  const closeImportModal = () => {
    if (!els.lapImportModal) return;
    els.lapImportModal.classList.add("hidden");
  };

  const applyImport = () => {
    if (!hasSessionStart()) {
      setStatus(
        els.statusBody,
        "Mark the session start before importing lap times.",
        true
      );
      return;
    }
    const format = els.lapImportFormat?.value || "daytona";
    const driver = els.lapImportDriverSelect?.value || "";
    const parsed = parseImportText(
      els.lapImportText?.value || "",
      format,
      driver
    );
    if (parsed.error) {
      setStatus(els.statusBody, parsed.error, true);
      return;
    }
    applyLapState(parsed.laps);
    state.previewLapNumber = 1;
    setActiveSelection("session-start");
    closeImportModal();
    setStatus(
      els.statusBody,
      `Imported ${parsed.laps.length} lap${parsed.laps.length === 1 ? "" : "s"} from ${format === "teamsport" ? "TeamSport" : "Daytona"}.`
    );
  };

  els.addLapBtn?.addEventListener("click", (event) => {
    event.preventDefault();
    addLap();
  });

  els.importLapBtn?.addEventListener("click", (event) => {
    event.preventDefault();
    if (!hasSessionStart()) {
      setStatus(
        els.statusBody,
        "Mark the session start before importing lap times.",
        true
      );
      return;
    }
    openImportModal();
  });

  els.lapList?.addEventListener("change", handleLapListChange);
  els.lapList?.addEventListener("blur", handleLapListChange, true);
  els.lapList?.addEventListener("click", handleLapListClick);

  els.lapImportFormat?.addEventListener("change", handleImportFormatChange);
  els.lapImportText?.addEventListener("input", () => {
    if (els.lapImportFormat?.value === "teamsport") {
      syncImportDrivers();
    }
  });
  els.applyLapImport?.addEventListener("click", (event) => {
    event.preventDefault();
    applyImport();
  });
  els.cancelLapImport?.addEventListener("click", (event) => {
    event.preventDefault();
    closeImportModal();
  });
  els.closeLapImport?.addEventListener("click", (event) => {
    event.preventDefault();
    closeImportModal();
  });
  els.lapImportModal
    ?.querySelector(".modal__backdrop")
    ?.addEventListener("click", closeImportModal);

  window.addEventListener("laps:reset", () => {
    setActiveSelection("session-start");
    applyLapState([]);
    updateLapActionState();
  });

  els.lapSetupForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!validateLapInputs()) return;
    state.lastPreviewUrl = null;
    if (!state.previewLapNumber || state.previewLapNumber < 1) {
      state.previewLapNumber = 1;
    }
    setStatus(
      els.statusBody,
      "Lap data saved. Tune colors in preview before rendering."
    );
    onLapDataReady?.();
    router.goTo("preview");
  });

  els.backToUpload.addEventListener("click", (event) => {
    event.preventDefault();
    router.goTo("upload");
  });

  window.addEventListener("keydown", (event) => {
    if (
      els.lapImportModal &&
      !els.lapImportModal.classList.contains("hidden") &&
      event.key === "Escape"
    ) {
      closeImportModal();
      return;
    }
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

  handleImportFormatChange();
  applyLapState(state.laps || []);
  updateButtons();
  updateLapActionState();
  updateMarkButtonLabel();
  if (hasLapData() && hasLapStart() && hasSessionStart()) {
    setAlignmentStatus("Select a lap to jump.");
  }

  return {
    preparePreviewFromFile,
    preparePreviewFromUpload,
    handleUploadInfo,
    videoControls,
  };
}
