import { formatLapTimeSeconds } from "../../../utils/lapTime.js";
import { type ParsedSessionEmail } from "../../../utils/sessionImportTypes.js";
import {
  getSelectedClassification,
  getSelectedDriverLaps,
  getSelectedKartNumber,
  hasDriverRows,
} from "./helpers.js";
import {
  inlineMetadataSelectStyles,
  lapListStyles,
  previewColumnStyles,
  previewColumnsStyles,
  previewStyles,
  selectStyles,
} from "./styles.js";

interface PreviewStepProps {
  parsed: ParsedSessionEmail | null;
  selectedDriver: string;
  selectedTrackId: string;
  selectedTrackLayoutId: string;
  resolvedTrackName: string;
  lockTrackSelection: boolean;
  tracks: ReadonlyArray<{
    id: string;
    name: string;
    isIndoors: boolean;
    trackLayouts: ReadonlyArray<{ id: string; name: string }>;
  }>;
  trackLayouts: ReadonlyArray<{ id: string; name: string }>;
  resolvedTrackLayoutName: string;
  showTrackLayoutSelection: boolean;
  weatherConditionsLabel: string;
  weatherTemperatureLabel: string;
  onSelectTrackId: (trackId: string) => void;
  onSelectTrackLayoutId: (trackLayoutId: string) => void;
  onSelectDriver: (driverName: string) => void;
}

export function PreviewStep({
  parsed,
  selectedDriver,
  selectedTrackId,
  selectedTrackLayoutId,
  resolvedTrackName,
  lockTrackSelection,
  tracks,
  trackLayouts,
  resolvedTrackLayoutName,
  showTrackLayoutSelection,
  weatherConditionsLabel,
  weatherTemperatureLabel,
  onSelectTrackId,
  onSelectTrackLayoutId,
  onSelectDriver,
}: PreviewStepProps) {
  if (!parsed) {
    return <div>No importable data detected yet.</div>;
  }

  const previewLaps = getSelectedDriverLaps(parsed, selectedDriver);
  const previewClassification = getSelectedClassification(parsed, selectedDriver);
  const previewFastestLap = parsed.sessionFastestLapSeconds ?? null;
  const previewKartNumber = getSelectedKartNumber(parsed, selectedDriver);

  return (
    <div css={previewStyles}>
      <div css={previewColumnsStyles}>
        <div css={previewColumnStyles}>
          {lockTrackSelection ? (
            <div>
              <strong>Track:</strong> {resolvedTrackName}
            </div>
          ) : (
            <div css={selectStyles}>
              <label htmlFor="session-import-track">Track</label>
              <select
                id="session-import-track"
                value={selectedTrackId}
                onChange={(event) => onSelectTrackId(event.target.value)}
              >
                <option value="">Select a track</option>
                {tracks.map((track) => (
                  <option key={track.id} value={track.id}>
                    {track.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {showTrackLayoutSelection ? (
            <div css={inlineMetadataSelectStyles}>
              <label htmlFor="session-import-track-layout">Track layout</label>
              <select
                id="session-import-track-layout"
                value={selectedTrackLayoutId}
                onChange={(event) => onSelectTrackLayoutId(event.target.value)}
              >
                {trackLayouts.map((layout) => (
                  <option key={layout.id} value={layout.id}>
                    {layout.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <strong>Track layout:</strong> {resolvedTrackLayoutName}
            </div>
          )}
          <div>
            <strong>Session date:</strong> {parsed.sessionDate ?? "Not found"}
          </div>
          <div>
            <strong>Session time:</strong> {parsed.sessionTime ?? "Not found"}
          </div>
          <div>
            <strong>Session format:</strong> {parsed.sessionFormat ?? "Not found"}
          </div>
          <div>
            <strong>Weather conditions:</strong> {weatherConditionsLabel}
          </div>
          <div>
            <strong>Temperature:</strong> {weatherTemperatureLabel}
          </div>
          <div>
            <strong>Classification:</strong> {previewClassification ?? "Not found"}
          </div>
          <div>
            <strong>Kart number:</strong> {previewKartNumber ? previewKartNumber : "Not found"}
          </div>
          <div>
            <strong>Session fastest lap:</strong>{" "}
            {previewFastestLap != null ? `${formatLapTimeSeconds(previewFastestLap)}s` : "Not found"}
          </div>
        </div>

        <div css={previewColumnStyles}>
          {hasDriverRows(parsed) ? (
            <div css={selectStyles}>
              <label htmlFor="session-import-driver">Choose your driver</label>
              <select
                id="session-import-driver"
                value={selectedDriver}
                onChange={(event) => onSelectDriver(event.target.value)}
              >
                {parsed.drivers.map((driver) => (
                  <option key={driver.name} value={driver.name}>
                    {driver.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <div>
            <strong>Lap timings:</strong> {previewLaps.length ? `${previewLaps.length} found` : "None found"}
            {previewLaps.length ? (
              <div css={lapListStyles}>
                {previewLaps.slice(0, 15).map((lap) => (
                  <div key={lap.lapNumber}>
                    Lap {lap.lapNumber.toString().padStart(2, "0")} - {formatLapTimeSeconds(lap.timeSeconds)}s
                  </div>
                ))}
                {previewLaps.length > 15 ? <div>...and {previewLaps.length - 15} more</div> : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
