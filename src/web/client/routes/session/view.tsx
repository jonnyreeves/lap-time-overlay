import { css } from "@emotion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { graphql, useLazyLoadQuery } from "react-relay";
import { Link, useParams } from "react-router-dom";
import { Card } from "../../components/Card.js";
import { RecordingsCard } from "./RecordingsCard.js";
import { type viewSessionQuery } from "../../__generated__/viewSessionQuery.graphql.js";
import { formatLapTimeSeconds } from "../../utils/lapTime.js";

const formLayoutStyles = css`
  display: grid;
  gap: 20px;
`;

const inputFieldStyles = css`
  margin-bottom: 15px;

  label {
    display: block;
    margin-bottom: 5px;
    font-weight: 500;
    color: #333;
  }

  input[type="date"],
  input[type="time"],
  input[type="text"],
  input[type="number"],
  select,
  textarea {
    width: 100%;
    padding: 10px;
    border: 1px solid #e2e8f4;
    border-radius: 8px;
    font-size: 1rem;
    color: #0b1021;
    background-color: #f7faff;
    transition: border-color 0.2s ease-in-out;

    &:focus {
      border-color: #6366f1;
      outline: none;
      box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
    }
  }
`;

const twoColumnRowStyles = css`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const metaStyles = css`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  color: #475569;
  font-size: 0.95rem;
`;

const lapsListStyles = css`
  display: grid;
  gap: 10px;
  margin-top: 12px;
`;

const lapRowStyles = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border: 1px solid #e2e8f4;
  border-radius: 10px;
  background: #f8fafc;
`;

const lapActionButtonStyles = css`
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid #d7deed;
  background: #fff;
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease;
  font-size: 0.95rem;

  &:hover {
    background: #eef2ff;
    border-color: #cbd5e1;
  }

  &:disabled {
    background: #e2e8f4;
    color: #94a3b8;
    cursor: not-allowed;
  }
`;

const SessionQuery = graphql`
  query viewSessionQuery($id: ID!) {
    trackSession(id: $id) {
      id
      date
      format
      classification
      conditions
      notes
      circuit {
        id
        name
      }
      createdAt
      updatedAt
      trackRecordings(first: 20) {
        id
        description
        status
        error
        sizeBytes
        lapOneOffset
        durationMs
        fps
        createdAt
        combineProgress
        uploadProgress {
          uploadedBytes
          totalBytes
        }
        uploadTargets(first: 50) {
          id
          fileName
          sizeBytes
          uploadedBytes
          status
          ordinal
          uploadUrl
        }
      }
      laps(first: 50) {
        id
        lapNumber
        time
        lapEvents {
          id
        }
      }
    }
    circuits {
      id
      name
    }
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

export default function ViewSessionRoute() {
  const { sessionId } = useParams();
  const [sessionFormat, setSessionFormat] = useState("Practice");
  const [conditions, setConditions] = useState("Dry");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [circuitId, setCircuitId] = useState("");
  const [classification, setClassification] = useState("");
  const [notes, setNotes] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const recordingVideoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  const data = useLazyLoadQuery<viewSessionQuery>(
    SessionQuery,
    { id: sessionId ?? "" },
    {
      fetchPolicy: "store-and-network",
      UNSTABLE_renderPolicy: "full",
      fetchKey: refreshKey,
    }
  );

  const session = data.trackSession;
  const trackRecordings = session?.trackRecordings ?? [];
  const laps = session?.laps ?? [];

  useEffect(() => {
    if (!session) return;
    const { date: parsedDate, time: parsedTime } = splitDateTime(session.date);
    setDate(parsedDate);
    setTime(parsedTime);
    setCircuitId(session.circuit.id);
    setSessionFormat(session.format);
    setConditions(session.conditions ?? "Dry");
    setClassification(session.classification?.toString() ?? "");
    setNotes(session.notes ?? "");
  }, [session]);

  useEffect(() => {
    const recordings = data.trackSession?.trackRecordings ?? [];
    const hasPending = recordings.some((rec) => rec.status !== "READY");
    if (!hasPending) return;
    const timer = window.setInterval(() => setRefreshKey((key) => key + 1), 3000);
    return () => window.clearInterval(timer);
  }, [data.trackSession?.trackRecordings, setRefreshKey]);

  const normalizedRecordings = useMemo(
    () =>
      trackRecordings.map((recording) => ({
        id: recording.id,
        description: recording.description ?? null,
        sizeBytes: recording.sizeBytes ?? null,
        lapOneOffset: recording.lapOneOffset ?? 0,
        durationMs: recording.durationMs ?? null,
        fps: recording.fps ?? null,
        createdAt: recording.createdAt,
        status: recording.status,
        error: recording.error ?? null,
        combineProgress: recording.combineProgress ?? 0,
        uploadProgress: {
          uploadedBytes: recording.uploadProgress.uploadedBytes ?? 0,
          totalBytes: recording.uploadProgress.totalBytes ?? null,
        },
        uploadTargets: recording.uploadTargets.map((target) => ({
          id: target.id,
          fileName: target.fileName,
          sizeBytes: target.sizeBytes ?? null,
          uploadedBytes: target.uploadedBytes,
          status: target.status,
          ordinal: target.ordinal,
          uploadUrl: target.uploadUrl ?? null,
        })),
      })),
    [trackRecordings]
  );

  const lapsWithStart = useMemo(() => {
    const sorted = [...laps].sort((a, b) => a.lapNumber - b.lapNumber);
    let elapsed = 0;
    return sorted.map((lap) => {
      const start = elapsed;
      const lapTime = Number.isFinite(lap.time) ? lap.time : 0;
      elapsed += lapTime;
      return { ...lap, start };
    });
  }, [laps]);

  const primaryRecordingForJump = useMemo(() => {
    return [...normalizedRecordings]
      .filter((rec) => rec.status === "READY" && rec.lapOneOffset > 0)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  }, [normalizedRecordings]);

  function jumpToLapStart(lapStart: number) {
    if (!primaryRecordingForJump) return;
    const video = recordingVideoRefs.current[primaryRecordingForJump.id];
    if (!video) return;
    const target = Math.max(0, primaryRecordingForJump.lapOneOffset + lapStart);
    const seek = () => {
      video.pause();
      video.currentTime = target;
    };
    if (video.readyState >= 1) {
      seek();
    } else {
      video.addEventListener("loadedmetadata", seek, { once: true });
    }
  }

  if (!sessionId) {
    return <p>Missing session id.</p>;
  }

  if (!session) {
    return <p>Session not found.</p>;
  }

  return (
    <div css={formLayoutStyles}>
      <Card
        title="Track Session"
        rightComponent={<Link to="/session/create">Create new session</Link>}
      >
        <div css={metaStyles}>
          <span>Created: {new Date(session.createdAt).toLocaleString()}</span>
          <span>Last updated: {new Date(session.updatedAt).toLocaleString()}</span>
        </div>
        <form>
          <div css={twoColumnRowStyles}>
            <div css={inputFieldStyles}>
              <label htmlFor="session-date">Date</label>
              <input
                type="date"
                id="session-date"
                value={date}
                readOnly
                disabled
              />
            </div>
            <div css={inputFieldStyles}>
              <label htmlFor="session-time">Time (HH:mm)</label>
              <input
                type="time"
                id="session-time"
                value={time}
                readOnly
                disabled
              />
            </div>
          </div>
          <div css={inputFieldStyles}>
            <label htmlFor="session-circuit">Circuit</label>
            <select
              id="session-circuit"
              value={circuitId}
              disabled
            >
              {data.circuits.map((circuit) => (
                <option key={circuit.id} value={circuit.id}>
                  {circuit.name}
                </option>
              ))}
            </select>
          </div>
          <div css={twoColumnRowStyles}>
            <div css={inputFieldStyles}>
              <label htmlFor="session-format">Format</label>
              <select
                id="session-format"
                value={sessionFormat}
                disabled
              >
                <option value="Practice">Practice</option>
                <option value="Qualifying">Qualifying</option>
                <option value="Race">Race</option>
              </select>
            </div>
            <div css={inputFieldStyles}>
              <label htmlFor="session-conditions">Conditions</label>
              <select
                id="session-conditions"
                value={conditions}
                disabled
              >
                <option value="Dry">Dry</option>
                <option value="Wet">Wet</option>
              </select>
            </div>
          </div>
          <div css={inputFieldStyles}>
            <label htmlFor="session-classification">Classification</label>
            <input
              type="number"
              id="session-classification"
              value={classification}
              readOnly
              disabled
            />
          </div>
          <div css={inputFieldStyles}>
            <label htmlFor="session-notes">Notes</label>
            <textarea
              id="session-notes"
              rows={3}
              value={notes}
              placeholder="Optional session notes"
              readOnly
              disabled
            />
          </div>
        </form>
      </Card>

      <RecordingsCard
        sessionId={session.id}
        recordings={normalizedRecordings}
        videoRefs={recordingVideoRefs}
        onRefresh={() => setRefreshKey((key) => key + 1)}
      />

      <Card title="Laps">
        {lapsWithStart.length === 0 ? (
          <p>No laps recorded for this session.</p>
        ) : (
          <div css={lapsListStyles}>
            {lapsWithStart.map((lap) => {
              const hasAnchor = Boolean(
                primaryRecordingForJump && recordingVideoRefs.current[primaryRecordingForJump.id]
              );
              return (
                <div key={lap.id} css={lapRowStyles}>
                  <div>
                    <span>Lap {lap.lapNumber}</span>
                    <div>{formatLapTimeSeconds(lap.time)}s</div>
                  </div>
                  <button
                    css={lapActionButtonStyles}
                    type="button"
                    disabled={!hasAnchor}
                    onClick={() => jumpToLapStart(lap.start)}
                    title={
                      hasAnchor
                        ? "Jump the video to the start of this lap"
                        : "Set Lap 1 start on the video to enable jumping"
                    }
                  >
                    Jump to start
                  </button>
                </div>
              );
            })}
            {!primaryRecordingForJump && (
              <p>
                Set the Lap 1 start time in the Video card to enable jumping to lap starts.
              </p>
            )}
            {primaryRecordingForJump &&
              !recordingVideoRefs.current[primaryRecordingForJump.id] && (
                <p>Load the video preview to enable lap jump controls.</p>
              )}
          </div>
        )}
      </Card>
    </div>
  );
}
