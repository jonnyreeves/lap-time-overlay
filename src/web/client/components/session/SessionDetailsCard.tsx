import { css } from "@emotion/react";
import { formatLapTimeSeconds } from "../../utils/lapTime.js";
import { Card } from "../Card.js";
import type { LapWithEvents } from "./LapsCard.js";

type SessionDetails = {
  id: string;
  date: string;
  format: string;
  classification?: number | string | null;
  conditions?: string | null;
  notes?: string | null;
  circuit: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
};

type Props = {
  session: SessionDetails;
  laps: LapWithEvents[];
};

const metaStyles = css`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 2px;
`;

const metaChipStyles = css`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  background: #f1f5f9;
  border: 1px solid #e2e8f4;
  color: #0f172a;
  font-size: 0.9rem;
  font-weight: 600;

  .label {
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-size: 0.72rem;
    color: #475569;
    font-weight: 700;
  }

  .value {
    letter-spacing: -0.01em;
  }
`;

const sessionCardLayoutStyles = css`
  display: grid;
  gap: 14px;
`;

const sessionInfoGridStyles = css`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
`;

const infoTileStyles = css`
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid #e2e8f4;
  background: #f8fafc;
  display: grid;
  gap: 6px;

  .label {
    font-size: 0.85rem;
    color: #475569;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin: 0;
  }

  .value {
    font-size: 1.05rem;
    font-weight: 700;
    color: #0f172a;
    margin: 0;
  }

  .note {
    margin: 0;
    color: #475569;
    font-size: 0.9rem;
  }
`;

const notesStyles = css`
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px dashed #d7deed;
  background: #f8fafc;
  display: grid;
  gap: 6px;

  .label {
    margin: 0;
    font-weight: 700;
    letter-spacing: 0.02em;
    color: #1f2937;
  }

  .body {
    margin: 0;
    color: #0f172a;
    white-space: pre-wrap;
  }

  .empty {
    color: #475569;
  }
`;

function splitDateTime(value: string): { date: string; time: string } {
  if (!value.includes("T")) {
    return { date: value, time: "" };
  }
  const [date, rest] = value.split("T");
  const cleaned = rest.replace(/Z$/, "");
  const [hours, minutes] = cleaned.split(":");
  if (!hours || !minutes) {
    return { date, time: "" };
  }
  return { date, time: `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}` };
}

export function SessionDetailsCard({ session, laps }: Props) {
  const { date: sessionDate, time: sessionTime } = splitDateTime(session.date);
  const conditionsLabel = session.conditions ?? "Not set";
  const classificationValue = session.classification;
  const classificationLabel =
    classificationValue != null && classificationValue !== ""
      ? `P${classificationValue}`
      : "Not classified";
  const lapsCount = laps.length;
  const fastestLap = laps.find((lap) => lap.isFastest);
  const fastestLapTime =
    fastestLap && Number.isFinite(fastestLap.time) && fastestLap.time > 0
      ? `${formatLapTimeSeconds(fastestLap.time)}s`
      : null;
  const notesText = session.notes?.trim() ?? "";
  const conditionsIcon = /wet/i.test(conditionsLabel) ? "🌧️" : "☀️";

  return (
    <Card title="Session Overview">
      <div css={sessionCardLayoutStyles}>
        <div css={sessionInfoGridStyles}>
          <div css={infoTileStyles}>
            <p className="label">Circuit</p>
            <p className="value">{session.circuit.name}</p>
          </div>
          <div css={infoTileStyles}>
            <p className="label">Format</p>
            <p className="value">{session.format || "—"}</p>
          </div>
          <div css={infoTileStyles}>
            <p className="label">Session date</p>
            <p className="value">{sessionDate || "—"}</p>
          </div>
          <div css={infoTileStyles}>
            <p className="label">Start time</p>
            <p className="value">{sessionTime || "—"}</p>
          </div>
          <div css={infoTileStyles}>
            <p className="label">Laps logged</p>
            <p className="value">{lapsCount}</p>
            {fastestLapTime ? <p className="note">Fastest lap {fastestLapTime}</p> : null}
          </div>
          <div css={infoTileStyles}>
            <p className="label">Conditions</p>
            <p className="value">
              {conditionsIcon} {conditionsLabel}
            </p>
          </div>
          <div css={infoTileStyles}>
            <p className="label">Classification</p>
            <p className="value">{classificationLabel}</p>
          </div>
        </div>

        <div css={notesStyles}>
          <p className="label">Notes</p>
          <p className={notesText ? "body" : "body empty"}>
            {notesText || "No notes recorded for this session."}
          </p>
        </div>
      </div>
    </Card>
  );
}
