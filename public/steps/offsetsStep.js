import { html, render } from "../template.js";
import { formatDuration, formatTime } from "../formatters.js";
import { setStatus } from "../status.js";
import { createVideoControls } from "../videoControls.js";
import { extractDrivers, populateDrivers } from "../drivers.js";
import { FALLBACK_FPS } from "../constants.js";

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

function parseLapTextSafe(text, format, driverName) {
  if (!text.trim()) return { laps: [] };
  switch (format) {
    case "daytona":
      return { laps: parseDaytonaLapText(text) };
    case "teamsport":
      return { laps: parseTeamsportLapText(text, driverName) };
    default:
      return { error: "Unknown lap format" };
  }
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
          <div class="lap-setup__row">
            <label class="field">
              <span>Lap format</span>
              <select id="lapFormat">
                <option value="daytona">Daytona</option>
                <option value="teamsport">TeamSport</option>
              </select>
            </label>

            <label class="field" id="driverField">
              <span>Driver (TeamSport)</span>
              <select id="driverName">
                <option value="">Pick a driver</option>
              </select>
              <div class="field__hint">
                We auto-read the header row from the pasted lap times.
              </div>
            </label>
          </div>

          <label class="field lap-setup__lap-text">
            <span>Lap times</span>
            <textarea
              id="lapText"
              rows="10"
              placeholder="Paste your exported lap times here"
            ></textarea>
            <div class="field__hint">
              For TeamSport: include the header row so we can list drivers.
            </div>
          </label>
        </form>

        <div class="lap-setup__preview">
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
          </div>

          <div class="alignment">
            <div class="alignment__header">
              <div>
                <p class="eyebrow">Lap check</p>
                <h3>Jump to lap start</h3>
              </div>
              <span class="badge" id="alignmentStatus">
                Waiting for lap data…
              </span>
            </div>
            <div class="alignment__controls">
              <label class="field">
                <span>Lap to preview</span>
                <select id="alignmentLapSelect" disabled>
                  <option value="">Add lap data first</option>
                </select>
                <div class="field__hint">
                  Uses your start frame and lap data to jump the player.
                </div>
              </label>
              <button class="btn" type="button" id="alignmentPreviewBtn">
                Jump to lap start
              </button>
            </div>
            <p class="field__hint alignment__hint">
              Pick a lap to visually confirm the timing lines up using the player above.
            </p>
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
    `,
    section
  );
  root.appendChild(section);
}

export function initOffsetsStep(options) {
  const { els, state, router, onLapDataReady } = options;
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
      state.startFrame = frame;
      setStatus(
        els.statusBody,
        `Start frame set to ${frame} (t=${formatTime(seconds)})`
      );
      updateButtons();
    },
  });

  const setAlignmentStatus = (text) => {
    if (els.alignmentStatus) {
      els.alignmentStatus.textContent = text;
    }
  };

  const hasLapText = () => Boolean(els.lapTextArea?.value.trim());
  const hasStartFrame = () => Boolean(els.startFrameInput?.value.trim());

  const updateButtons = (pending = false) => {
    const ready = state.uploadReady && hasLapText() && hasStartFrame();
    if (els.nextToPreview) {
      els.nextToPreview.disabled = pending || !ready;
    }
    if (els.alignmentPreviewBtn) {
      els.alignmentPreviewBtn.disabled = pending || !ready;
    }
    if (!pending && ready && !state.lastPreviewUrl) {
      setAlignmentStatus("Select a lap to jump.");
    }
  };

  const updateLapOptions = (lapCount) => {
    state.lapCount = lapCount;
    const select = els.alignmentLapSelect;
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

  const parseLapInputs = () =>
    parseLapTextSafe(
      els.lapTextArea.value,
      els.lapFormatSelect.value,
      els.driverSelect.value
    );

  const refreshLapOptions = () => {
    const parsed = parseLapInputs();
    if (parsed.error) {
      state.lapCount = 0;
      updateLapOptions(0);
      return parsed;
    }
    state.lapCount = parsed.laps.length;
    updateLapOptions(state.lapCount);
    return parsed;
  };

  function setPreviewSource(url, { isObjectUrl }) {
    if (previewIsObjectUrl && state.previewUrl) {
      URL.revokeObjectURL(state.previewUrl);
    }
    state.previewUrl = url;
    previewIsObjectUrl = isObjectUrl;
    els.previewVideo.src = url;
    els.previewVideo.load();
    els.startFrameInput.value = "";
    state.startFrame = null;
    videoControls.setEnabled(false);
    setAlignmentStatus("Waiting for lap data…");
    updateButtons();
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

  function handleLapFormatChange() {
    const format = els.lapFormatSelect.value;
    els.driverField.style.display = format === "teamsport" ? "flex" : "none";
    if (format !== "teamsport") {
      els.driverSelect.value = "";
    } else {
      const drivers = extractDrivers(els.lapTextArea.value);
      populateDrivers(els.driverSelect, drivers);
    }
  }

  const syncLapInputsToState = () => {
    state.lapText = els.lapTextArea.value.trim();
    state.lapFormat = els.lapFormatSelect.value;
    state.driverName = els.driverSelect.value;
    const startFrameValue = els.startFrameInput.value.trim();
    const parsedStart = Number(startFrameValue);
    state.startFrame =
      startFrameValue && Number.isFinite(parsedStart) ? parsedStart : null;
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

    const lapText = els.lapTextArea.value.trim();
    if (!lapText) {
      setStatus(els.statusBody, "Paste your lap times first.", true);
      return false;
    }

    const lapFormat = els.lapFormatSelect.value;
    const driverName = els.driverSelect.value;
    if (lapFormat === "teamsport" && !driverName) {
      setStatus(els.statusBody, "Pick a driver for TeamSport laps.", true);
      return false;
    }

    const startFrame = els.startFrameInput.value.trim();
    if (!startFrame) {
      setStatus(
        els.statusBody,
        "Enter a start frame (0 = first frame) to align laps.",
        true
      );
      return false;
    }

    const parsedStart = Number(startFrame);
    if (!Number.isFinite(parsedStart) || parsedStart < 0) {
      setStatus(
        els.statusBody,
        "Start frame must be 0 or greater.",
        true
      );
      return false;
    }

    return true;
  };

  const jumpToLapStart = (targetLap) => {
    if (!validateLapInputs()) return;
    syncLapInputsToState();
    const parsed = refreshLapOptions();
    if (parsed?.error) {
      setStatus(els.statusBody, parsed.error, true);
      setAlignmentStatus("Fix lap data to jump.");
      return;
    }
    const laps = parsed?.laps || [];
    if (!laps.length) {
      setAlignmentStatus("No laps parsed yet.");
      return;
    }

    const fps = state.videoInfo?.fps ?? FALLBACK_FPS;
    const startFrame = Number(els.startFrameInput.value.trim() || "0");
    const startOffset = startFrame / fps;

    let lapNumber = targetLap ?? Number(els.alignmentLapSelect.value);
    if (!Number.isFinite(lapNumber) || lapNumber < 1) lapNumber = 1;
    lapNumber = Math.min(lapNumber, laps.length);
    state.previewLapNumber = lapNumber;

    const lap = laps[lapNumber - 1];
    const targetTime = startOffset + lap.startS;
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
    const clampedTime = duration
      ? Math.max(0, Math.min(targetTime, Math.max(duration - 0.05, 0)))
      : Math.max(0, targetTime);

    video.currentTime = clampedTime;
    videoControls.updateTimeReadout();
    setAlignmentStatus(
      `Jumped to lap ${lap.number} start (${formatTime(clampedTime)})`
    );
  };

  els.lapFormatSelect.addEventListener("change", () => {
    handleLapFormatChange();
    state.lastPreviewUrl = null;
    state.previewLapNumber = 1;
    refreshLapOptions();
    setAlignmentStatus("Waiting for lap data…");
  });

  els.lapTextArea.addEventListener("input", () => {
    if (els.lapFormatSelect.value === "teamsport") {
      const drivers = extractDrivers(els.lapTextArea.value);
      populateDrivers(els.driverSelect, drivers);
    }
    state.lastPreviewUrl = null;
    state.previewLapNumber = 1;
    refreshLapOptions();
    setAlignmentStatus("Waiting for lap data…");
    updateButtons();
  });

  els.driverSelect.addEventListener("change", () => {
    state.lastPreviewUrl = null;
    state.previewLapNumber = 1;
    refreshLapOptions();
    setAlignmentStatus("Waiting for lap data…");
    updateButtons();
  });

  els.startFrameInput.addEventListener("input", () => {
    const value = els.startFrameInput.value.trim();
    const parsed = Number(value);
    state.startFrame =
      value && Number.isFinite(parsed) ? parsed : null;
    state.lastPreviewUrl = null;
    updateButtons();
  });

  els.alignmentPreviewBtn.addEventListener("click", (event) => {
    event.preventDefault();
    const targetLap = Number(els.alignmentLapSelect.value);
    const lap = Number.isFinite(targetLap) && targetLap >= 1 ? targetLap : null;
    jumpToLapStart(lap);
  });

  els.alignmentLapSelect.addEventListener("change", () => {
    const value = Number(els.alignmentLapSelect.value);
    if (Number.isFinite(value) && value >= 1) {
      state.previewLapNumber = value;
      jumpToLapStart(value);
    }
  });

  els.lapSetupForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!validateLapInputs()) return;
    syncLapInputsToState();
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

  handleLapFormatChange();
  refreshLapOptions();
  updateButtons();
  if (hasLapText() && hasStartFrame()) {
    setAlignmentStatus("Select a lap to jump.");
  }

  return {
    preparePreviewFromFile,
    preparePreviewFromUpload,
    handleUploadInfo,
    videoControls,
  };
}
