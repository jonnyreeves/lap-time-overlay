import { html, render } from "../template.js";
import { setStatus } from "../status.js";
import { extractDrivers, populateDrivers } from "../drivers.js";

export function renderLapTimesStep(root) {
  const section = document.createElement("section");
  section.className = "card step";
  section.id = "stepLapTimes";
  render(
    html`
      <div class="card__header">
        <div class="dot"></div>
        <div>
          <p class="eyebrow">Step 3</p>
          <h2>Lap data</h2>
        </div>
      </div>
      <form id="renderForm" class="form">
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

        <label class="field">
          <span>Lap times</span>
          <textarea
            id="lapText"
            rows="8"
            placeholder="Paste your exported lap times here"
          ></textarea>
          <div class="field__hint">
            For TeamSport: include the header row so we can list drivers.
          </div>
        </label>

        <div class="step-nav">
          <button type="button" class="btn btn--ghost" id="backToOffsets">
            Back
          </button>
          <button type="submit" class="btn btn--primary" id="renderBtn">
            Next: Preview
          </button>
        </div>
      </form>
    `,
    section
  );
  root.appendChild(section);
}

export function initLapTimesStep(options) {
  const { els, state, router, onLapDataReady } = options;

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

  els.lapFormatSelect.addEventListener("change", handleLapFormatChange);

  els.lapTextArea.addEventListener("input", () => {
    if (els.lapFormatSelect.value !== "teamsport") return;
    const drivers = extractDrivers(els.lapTextArea.value);
    populateDrivers(els.driverSelect, drivers);
  });

  els.backToOffsets.addEventListener("click", (event) => {
    event.preventDefault();
    router.goTo("offsets");
  });

  els.renderForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!state.uploadId) {
      setStatus(els.statusBody, "Upload a video before rendering.", true);
      return;
    }

    const lapText = els.lapTextArea.value.trim();
    if (!lapText) {
      setStatus(els.statusBody, "Paste your lap times first.", true);
      return;
    }

    const lapFormat = els.lapFormatSelect.value;
    const driverName = els.driverSelect.value;
    if (lapFormat === "teamsport" && !driverName) {
      setStatus(els.statusBody, "Pick a driver for TeamSport laps.", true);
      return;
    }

    const startFrame = els.startFrameInput.value.trim();
    if (!startFrame) {
      setStatus(els.statusBody, "Enter a start frame (0 = first frame).", true);
      return;
    }

    state.lapText = lapText;
    state.lapFormat = lapFormat;
    state.driverName = driverName;
    state.startFrame = Number(startFrame);
    state.lastPreviewUrl = null;
    state.lapCount = 0;
    state.previewLapNumber = 1;
    setStatus(
      els.statusBody,
      "Lap data saved. Tune colors in preview before rendering."
    );
    onLapDataReady?.();
    router.goTo("preview");
  });

  handleLapFormatChange();

  return { handleLapFormatChange };
}
