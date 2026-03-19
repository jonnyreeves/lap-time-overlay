import { css } from "@emotion/react";
import { useMemo, useRef, useState, type MouseEvent } from "react";
import { formatLapTimeSeconds } from "../../utils/lapTime.js";
import {
  computeConsistencyStats,
  type ConsistencyLap,
  type ConsistencyStats,
  type ExcludedReason,
} from "../../../shared/consistency.js";
import { Card } from "../Card.js";
import type { LapWithEvents } from "./LapsCard.js";

type ServerExclusionReason = "INVALID" | "OUT_LAP" | "OUTLIER" | "%future added value";

type ServerConsistency = {
  score: number | null | undefined;
  label: string;
  mean: number | null | undefined;
  stdDev: number | null | undefined;
  cvPct: number | null | undefined;
  median: number | null | undefined;
  windowPct: number | null | undefined;
  cleanLapCount?: number | null;
  excludedLapCount?: number | null;
  totalValidLapCount: number | null | undefined;
  usableLapNumbers?: ReadonlyArray<number> | null;
  excludedLaps?: ReadonlyArray<{ lapNumber: number; reason: ServerExclusionReason }> | null;
};

type RollingWindow = {
  average: number;
  startLap: number;
  endLap: number;
};

const cardGridStyles = css`
  display: grid;
  gap: 14px;
`;

const summaryStyles = css`
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
`;

const scoreBlockStyles = css`
  display: grid;
  gap: 4px;
  min-width: 0;
  justify-items: start;
  padding: 8px 10px;
  border-radius: 12px;
  border: 1px solid #e2e8f4;
  background: #f8fafc;

  .label {
    font-size: 0.78rem;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin: 0;
  }

  .score {
    font-size: clamp(1.9rem, 3vw, 2.4rem);
    font-weight: 800;
    letter-spacing: -0.03em;
    color: #0f172a;
    margin: 0;
    line-height: 1;
  }

  .scoreRow {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    flex-wrap: wrap;
  }

  .pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 9px;
    border-radius: 999px;
    font-weight: 700;
    font-size: 0.8rem;
    line-height: 1.1;
    background: #ecfeff;
    color: #0f172a;
    border: 1px solid #bae6fd;
    justify-self: start;
  }

  .rollingCallouts {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .callout {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: 999px;
    border: 1px solid #cbd5e1;
    background: #ffffff;
    color: #334155;
    font-size: 0.72rem;
    font-weight: 700;
    line-height: 1.2;
  }
`;

const metaGridStyles = css`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const metaTileStyles = css`
  padding: 8px 10px;
  border-radius: 12px;
  border: 1px solid #e2e8f4;
  background: #f8fafc;
  min-height: 82px;

  .label {
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.09em;
    color: #94a3b8;
    margin: 0 0 4px;
    font-weight: 800;
  }

  .value {
    font-weight: 800;
    color: #0f172a;
    font-size: clamp(1.45rem, 2.2vw, 2rem);
    line-height: 1.05;
    margin: 0;
  }

  .hint {
    margin: 4px 0 0;
    color: #475569;
    font-size: 0.74rem;
    font-weight: 700;
    line-height: 1.25;
  }
`;

const sparklineCardStyles = css`
  padding: 12px;
  border-radius: 12px;
  border: 1px solid #e2e8f4;
  background: linear-gradient(145deg, #0f172a, #0b1021);
  color: #e2e8f0;
  position: relative;
`;

const sparklineHeaderStyles = css`
  display: grid;
  gap: 8px;
  margin-bottom: 10px;

  .title {
    font-weight: 700;
    letter-spacing: -0.01em;
    margin: 0;
    font-size: 0.95rem;
    line-height: 1.2;
  }

  .legend {
    display: inline-flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    font-size: 0.85rem;

    span {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .dot {
      width: 10px;
      height: 10px;
      border-radius: 999px;
      background: #38bdf8;
    }

    .hollow {
      width: 10px;
      height: 10px;
      border-radius: 999px;
      border: 2px solid #e2e8f0;
    }
  }
`;

const tooltipStyles = css`
  position: absolute;
  pointer-events: none;
  background: #0b1120;
  color: #e2e8f0;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 0.88rem;
  font-weight: 700;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.35);
  transform: translate(-50%, calc(-100% - 10px));
  white-space: nowrap;
  z-index: 2;
  border: 1px solid #334155;
`;

const emptyStateStyles = css`
  padding: 14px;
  border-radius: 12px;
  border: 1px dashed #cbd5e1;
  background: #f8fafc;
  color: #475569;
  font-weight: 700;
  text-align: center;
`;

function mapExclusionReason(reason: ServerExclusionReason): ExcludedReason {
  if (reason === "OUT_LAP") return "out-lap";
  if (reason === "OUTLIER") return "outlier";
  return "invalid";
}

function hydrateConsistency(
  consistency: ServerConsistency | null | undefined,
  laps: LapWithEvents[]
): ConsistencyStats | null {
  if (!consistency) return null;
  const lapByNumber = new Map<number, LapWithEvents>();
  laps.forEach((lap) => {
    lapByNumber.set(lap.lapNumber, lap);
  });

  const usableLaps: ConsistencyLap[] = [];
  const usableLapNumbers = consistency.usableLapNumbers ?? [];
  usableLapNumbers.forEach((lapNumber) => {
    const lap = lapByNumber.get(lapNumber);
    if (!lap) return;
    usableLaps.push({
      id: lap.id,
      lapNumber: lap.lapNumber,
      time: Number.isFinite(lap.time) ? lap.time : 0,
    });
  });

  const excluded: (ConsistencyLap & { reason: ExcludedReason })[] = [];
  (consistency.excludedLaps ?? []).forEach((excludedLap) => {
    const lap = lapByNumber.get(excludedLap.lapNumber);
    if (!lap) return;
    excluded.push({
      id: lap.id,
      lapNumber: lap.lapNumber,
      time: Number.isFinite(lap.time) ? lap.time : 0,
      reason: mapExclusionReason(excludedLap.reason),
    });
  });

  return {
    score: consistency.score ?? null,
    label: consistency.label,
    mean: consistency.mean ?? null,
    stdDev: consistency.stdDev ?? null,
    cvPct: consistency.cvPct ?? null,
    median: consistency.median ?? null,
    windowPct: consistency.windowPct ?? null,
    usableLaps,
    excluded,
    totalValid: consistency.totalValidLapCount ?? 0,
  };
}
function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

function formatPercent(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${value.toFixed(1)}%`;
}

function formatSeconds(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${value.toFixed(3)}s`;
}

function computeBestRollingWindow(laps: ConsistencyLap[], size: number): RollingWindow | null {
  if (laps.length < size) return null;
  const ordered = [...laps].sort((a, b) => a.lapNumber - b.lapNumber);
  let best: RollingWindow | null = null;

  for (let index = 0; index <= ordered.length - size; index += 1) {
    const window = ordered.slice(index, index + size);
    const total = window.reduce((sum, lap) => sum + lap.time, 0);
    const average = total / size;
    const candidate: RollingWindow = {
      average,
      startLap: window[0]?.lapNumber ?? 0,
      endLap: window[window.length - 1]?.lapNumber ?? 0,
    };
    if (!best || candidate.average < best.average) {
      best = candidate;
    }
  }

  return best;
}

function formatRollingCallout(window: RollingWindow | null, size: number): string {
  if (!window) return `R${size}: n/a`;
  const range = window.startLap === window.endLap ? `L${window.startLap}` : `L${window.startLap}-${window.endLap}`;
  return `R${size}: ${window.average.toFixed(3)}s (${range})`;
}

function Sparkline({
  usable,
  excluded,
  medianTime,
  meanTime,
  stdDevTime,
  sessionFastestLap,
}: {
  usable: ConsistencyLap[];
  excluded: (ConsistencyLap & { reason: ExcludedReason })[];
  medianTime: number | null;
  meanTime: number | null;
  stdDevTime: number | null;
  sessionFastestLap?: number | null;
}) {
  const width = 340;
  const height = 160;
  const padLeft = 48;
  const padRight = 12;
  const padTop = 12;
  const padBottom = 28;
  const excludedRenderable = excluded.filter(
    (lap) => Number.isFinite(lap.time) && lap.time > 0
  );
  const baselineTimes = usable
    .map((lap) => lap.time)
    .filter((time) => Number.isFinite(time));
  const baselineMedian = medianTime ?? median(baselineTimes);
  const maxPlotDeviation = 0.2; // 20% from median
  const excludedPlotted =
    baselineMedian != null
      ? excludedRenderable.filter(
          (lap) =>
            lap.time >= baselineMedian * (1 - maxPlotDeviation) &&
            lap.time <= baselineMedian * (1 + maxPlotDeviation)
        )
      : excludedRenderable;
  const combinedOrder = [...usable, ...excludedPlotted].sort(
    (a, b) => a.lapNumber - b.lapNumber
  );

  const domainTimesSource = combinedOrder.length > 0 ? combinedOrder : excludedRenderable;
  const indexById = new Map<string, number>();
  domainTimesSource.forEach((lap, idx) => {
    indexById.set(lap.id, idx);
  });

  const domainTimes = domainTimesSource
    .map((lap) => lap.time)
    .filter((time) => Number.isFinite(time));
  if (sessionFastestLap && Number.isFinite(sessionFastestLap)) {
    domainTimes.push(sessionFastestLap);
  }
  if (domainTimes.length === 0) return null;
  const minTime = Math.min(...domainTimes);
  const maxTime = Math.max(...domainTimes);
  const baseSpan = Math.max(maxTime - minTime, 0);
  const yPaddingFactor = 0.1;
  const yPaddingMin = 0.2;
  const visualMin = Math.max(
    0,
    minTime - Math.max(baseSpan * yPaddingFactor, yPaddingMin)
  );
  const visualMax = maxTime;
  const span = Math.max(visualMax - visualMin, 0.001);
  const scaleX = (idx: number) => {
    if (domainTimesSource.length <= 1) return padLeft;
    const step = (width - padLeft - padRight) / (domainTimesSource.length - 1);
    return padLeft + idx * step;
  };
  const scaleY = (time: number) =>
    height - padBottom - ((time - visualMin) / span) * (height - padTop - padBottom);

  const usablePoints = usable
    .filter((lap) => indexById.has(lap.id))
    .map((lap, idx) => ({
      lap,
      x: scaleX(indexById.get(lap.id) ?? idx),
      y: scaleY(lap.time),
    }));
  const fastest = usablePoints.reduce<(typeof usablePoints)[number] | null>(
    (best, point) => {
      if (!best) return point;
      return point.lap.time < best.lap.time ? point : best;
    },
    null
  );
  const pathD =
    usablePoints.length === 0
      ? ""
      : usablePoints
          .map((point, idx) => `${idx === 0 ? "M" : "L"}${point.x},${point.y}`)
          .join(" ");

  const band = (() => {
    if (meanTime == null || stdDevTime == null) return null;
    const top = scaleY(Math.max(visualMin, meanTime - stdDevTime));
    const bottom = scaleY(Math.min(visualMax, meanTime + stdDevTime));
    return {
      top: Math.min(top, bottom),
      height: Math.abs(bottom - top),
    };
  })();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(
    null
  );

  const showTooltip = (event: MouseEvent<SVGCircleElement>, text: string) => {
    const bounds = containerRef.current?.getBoundingClientRect();
    if (!bounds) return;
    setTooltip({
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
      text,
    });
  };

  const hideTooltip = () => setTooltip(null);

  return (
    <div css={sparklineCardStyles} ref={containerRef} onMouseLeave={hideTooltip}>
      <div css={sparklineHeaderStyles}>
        <p className="title">Lap time spread</p>
        <div className="legend" aria-hidden>
          <span>
            <span className="dot" />
            Clean
          </span>
          <span>
            <span className="hollow" />
            Excluded
          </span>
          {sessionFastestLap ? (
            <span>
              <svg height="10" width="10" viewBox="0 0 10 10">
                <line
                  x1="0"
                  y1="5"
                  x2="10"
                  y2="5"
                  stroke="#a78bfa"
                  strokeWidth="2"
                  strokeDasharray="2 2"
                />
              </svg>
              Session Best
            </span>
          ) : null}
        </div>
      </div>
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        onMouseLeave={hideTooltip}
      >
        <line
          x1={padLeft}
          y1={padTop}
          x2={padLeft}
          y2={height - padBottom}
          stroke="rgba(226, 232, 240, 0.5)"
          strokeWidth={1}
        />
        <line
          x1={padLeft}
          y1={height - padBottom}
          x2={width - padRight}
          y2={height - padBottom}
          stroke="rgba(226, 232, 240, 0.5)"
          strokeWidth={1}
        />
        {band ? (
          <rect
            x={padLeft}
            width={width - padLeft - padRight}
            y={band.top}
            height={band.height}
            fill="rgba(96, 165, 250, 0.2)"
          />
        ) : null}
        {sessionFastestLap ? (
          <line
            x1={padLeft}
            y1={scaleY(sessionFastestLap)}
            x2={width - padRight}
            y2={scaleY(sessionFastestLap)}
            stroke="#a78bfa"
            strokeWidth={1.5}
            strokeDasharray="4 3"
          />
        ) : null}
        {pathD ? (
          <path
            d={pathD}
            fill="none"
            stroke="#38bdf8"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ) : null}
        {usablePoints.map((point) => (
          <circle
            key={`${point.lap.id}-${point.x}-${point.y}`}
            cx={point.x}
            cy={point.y}
            r={fastest && fastest.lap.id === point.lap.id ? 5 : 4}
            fill={fastest && fastest.lap.id === point.lap.id ? "#22c55e" : "#38bdf8"}
            stroke={fastest && fastest.lap.id === point.lap.id ? "#16a34a" : "#0ea5e9"}
            strokeWidth={fastest && fastest.lap.id === point.lap.id ? 2 : 1.5}
            onMouseEnter={(event) =>
              showTooltip(
                event,
                `Lap ${point.lap.lapNumber}: ${formatLapTimeSeconds(point.lap.time)}s (used)`
              )
            }
            onMouseLeave={hideTooltip}
          ></circle>
        ))}
        {excludedRenderable.map((lap, idx) => (
          <circle
            key={`${lap.id}-${idx}`}
            cx={scaleX(indexById.get(lap.id) ?? usable.length + idx)}
            cy={scaleY(lap.time)}
            r={4}
            fill="transparent"
            stroke="#e2e8f0"
            strokeWidth={2}
            opacity={0.8}
            onMouseEnter={(event) =>
              showTooltip(
                event,
                `Lap ${lap.lapNumber}: ${formatLapTimeSeconds(lap.time)}s (excluded: ${
                  lap.reason === "out-lap" ? "out lap" : lap.reason
                })`
              )
            }
            onMouseLeave={hideTooltip}
          >
            <title>
              {`Lap ${
                lap.lapNumber
              } excluded (${lap.reason === "out-lap" ? "out lap" : lap.reason})`}
            </title>
          </circle>
        ))}
        <text
          x={width / 2}
          y={height - 6}
          textAnchor="middle"
          fill="#cbd5e1"
          fontSize="12"
        >
          Lap order
        </text>
        <text
          x={14}
          y={height / 2}
          textAnchor="middle"
          fill="#cbd5e1"
          fontSize="12"
          transform={`rotate(-90 14 ${height / 2})`}
        >
          Lap time (s)
        </text>
        <text
          x={padLeft - 8}
          y={scaleY(maxTime) + 4}
          textAnchor="end"
          fill="#cbd5e1"
          fontSize="11"
        >
          {formatLapTimeSeconds(maxTime)}s
        </text>
        <text
          x={padLeft - 8}
          y={scaleY(minTime) + 4}
          textAnchor="end"
          fill="#cbd5e1"
          fontSize="11"
        >
          {formatLapTimeSeconds(minTime)}s
        </text>
      </svg>
      {tooltip ? (
        <div css={tooltipStyles} style={{ left: tooltip.x, top: tooltip.y }}>
          {tooltip.text}
        </div>
      ) : null}
    </div>
  );
}

type Props = {
  laps: LapWithEvents[];
};

type ConsistencyCardProps = Props & {
  consistency?: ServerConsistency | null;
  sessionFastestLap?: number | null;
  sessionFormat?: string | null;
};

export function ConsistencyCard({
  laps,
  consistency,
  sessionFastestLap,
  sessionFormat,
}: ConsistencyCardProps) {
  const stats = useMemo(() => {
    const fromServer = hydrateConsistency(consistency, laps);
    if (fromServer) return fromServer;
    return computeConsistencyStats(laps);
  }, [consistency, laps]);
  const cleanCount = stats.usableLaps.length;
  const excludedCount = stats.excluded.length;
  const outlapCount = stats.excluded.filter((lap) => lap.reason === "out-lap").length;
  const outlierCount = stats.excluded.filter((lap) => lap.reason === "outlier").length;
  const invalidCount = stats.excluded.filter((lap) => lap.reason === "invalid").length;
  const totalCount = cleanCount + excludedCount;

  if (laps.length === 0) {
    return (
      <Card title="Consistency">
        <div css={emptyStateStyles}>Add lap times to see consistency.</div>
      </Card>
    );
  }

  const cleanRatePct = totalCount > 0 ? (cleanCount / totalCount) * 100 : null;
  const meanMedianGap =
    stats.mean != null && stats.median != null ? stats.mean - stats.median : null;
  const rolling5 = computeBestRollingWindow(stats.usableLaps, 5);
  const rolling10 = computeBestRollingWindow(stats.usableLaps, 10);
  const isQualifyingSession = (sessionFormat ?? "").trim().toLowerCase() === "qualifying";
  const sigmaTargetHit = stats.stdDev != null && stats.stdDev <= 0.2;
  const cvTargetHit = stats.cvPct != null && stats.cvPct <= 3;
  const cleanLabel =
    cleanCount > 0
      ? `${cleanCount} clean`
      : "No clean laps yet";
  const exclusionParts = [
    outlapCount ? `${outlapCount} out lap` : null,
    outlierCount ? `${outlierCount} outlier${outlierCount === 1 ? "" : "s"}` : null,
    invalidCount ? `${invalidCount} invalid` : null,
  ].filter(Boolean);
  const excludedLabel = exclusionParts.length ? `${excludedCount} excl (${exclusionParts.join(", ")})` : "0 excl";

  return (
    <Card title="Consistency">
      <div css={cardGridStyles}>
        <div css={summaryStyles}>
          <div css={scoreBlockStyles}>
            <p className="label">Consistency Score</p>
            <div className="scoreRow">
              <p className="score">{stats.score != null ? stats.score : "—"}</p>
              <span className="pill">{stats.label}</span>
            </div>
            {!isQualifyingSession ? (
              <div className="rollingCallouts">
                <span className="callout">{formatRollingCallout(rolling5, 5)}</span>
                <span className="callout">{formatRollingCallout(rolling10, 10)}</span>
              </div>
            ) : null}
          </div>
          <div css={metaGridStyles}>
            <div css={metaTileStyles}>
              <p className="label">Clean Rate</p>
              <p className="value">{formatPercent(cleanRatePct)}</p>
              <p className="hint">
                {cleanLabel} • {excludedLabel}
              </p>
            </div>
            <div css={metaTileStyles}>
              <p className="label">Sigma (Spread)</p>
              <p className="value">{formatSeconds(stats.stdDev)}</p>
              <p className="hint">Target ≤0.200s • {sigmaTargetHit ? "On target" : "Needs work"}</p>
            </div>
            <div css={metaTileStyles}>
              <p
                className="label"
                title="Coefficient of Variation: standard deviation divided by mean lap time. Lower CV means more lap-to-lap consistency."
              >
                CV
              </p>
              <p className="value">{formatPercent(stats.cvPct)}</p>
              <p className="hint">Target ≤3.0% • {cvTargetHit ? "On target" : "Needs work"}</p>
            </div>
            <div css={metaTileStyles}>
              <p className="label">Drift (Mean-Median)</p>
              <p className="value">{formatSeconds(meanMedianGap)}</p>
              <p className="hint">
                {stats.windowPct && stats.median
                  ? `Window ±${(stats.windowPct * 100).toFixed(1)}% of ${formatLapTimeSeconds(
                      stats.median
                    )}s`
                  : "Awaiting more laps"}
              </p>
            </div>
          </div>
        </div>

        <Sparkline
          usable={stats.usableLaps}
          excluded={stats.excluded}
          medianTime={stats.median}
          meanTime={stats.mean}
          stdDevTime={stats.stdDev}
          sessionFastestLap={sessionFastestLap}
        />
      </div>
    </Card>
  );
}
