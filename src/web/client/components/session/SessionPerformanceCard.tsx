import { css } from "@emotion/react";
import { formatStopwatchTime } from "../../utils/lapTime.js";
import { Card } from "../Card.js";
import type { LapWithEvents } from "./LapsCard.js";
import { SessionPerformanceChart } from "./SessionPerformanceChart.js";

type SessionPerformancePayload = {
  format: string;
  score: number | null | undefined;
  label: string;
  headline: string;
  cleanLapCount: number;
  excludedLapCount: number;
  cleanLapNumbers: ReadonlyArray<number>;
  excludedLaps: ReadonlyArray<{ lapNumber: number; reason: string }>;
  representativePace?: number | null;
  thresholdLapTime?: number | null;
  highlightLapNumbers: ReadonlyArray<number>;
  qualifyingKpis?: {
    bestLap?: number | null;
    rankByBestLap?: number | null;
    gapToP1?: number | null;
    gapToP3?: number | null;
    top3Average?: number | null;
    top3Spread?: number | null;
    secondLapDelta?: number | null;
    pushRatePct?: number | null;
    cleanLapRatioPct?: number | null;
  } | null;
  practiceRaceKpis?: {
    bestLap?: number | null;
    gapToP1?: number | null;
    top5Average?: number | null;
    top10Average?: number | null;
    cleanLapStdDev?: number | null;
    longestConsistentStintLaps?: number | null;
    longestConsistentStintStartLap?: number | null;
    longestConsistentStintEndLap?: number | null;
    lapsWithinThresholdPct?: number | null;
    cleanLapRatioPct?: number | null;
  } | null;
};

type Props = {
  laps: LapWithEvents[];
  performance?: SessionPerformancePayload | null;
};

type MetricTile = {
  label: string;
  value: string;
  hint?: string;
};

const containerStyles = css`
  display: grid;
  gap: 14px;
`;

const heroStyles = css`
  display: grid;
  gap: 12px;
  padding: 14px;
  border-radius: 14px;
  border: 1px solid #dbe4f0;
  background: linear-gradient(145deg, #f8fbff, #eef4ff);
`;

const heroTopStyles = css`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: start;
  flex-wrap: wrap;
`;

const scoreBlockStyles = css`
  display: grid;
  gap: 5px;

  .eyebrow {
    margin: 0;
    font-size: 0.76rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #64748b;
  }

  .scoreRow {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .score {
    margin: 0;
    font-size: clamp(2rem, 3.5vw, 2.7rem);
    line-height: 1;
    font-weight: 900;
    letter-spacing: -0.04em;
    color: #0f172a;
  }

  .label {
    display: inline-flex;
    padding: 4px 10px;
    border-radius: 999px;
    background: #e0f2fe;
    border: 1px solid #bae6fd;
    color: #0c4a6e;
    font-size: 0.8rem;
    font-weight: 800;
  }

  .headline {
    margin: 0;
    color: #334155;
    font-weight: 700;
  }

  .context {
    margin: 0;
    color: #64748b;
    font-size: 0.82rem;
    font-weight: 700;
  }
`;

const badgeStyles = css`
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 999px;
  background: #1e293b;
  color: #f8fafc;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

const metricGridStyles = css`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const metricTileStyles = css`
  padding: 11px 12px;
  border-radius: 12px;
  border: 1px solid #e2e8f4;
  background: #ffffff;

  .label {
    margin: 0 0 4px;
    font-size: 0.76rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #94a3b8;
    font-weight: 800;
  }

  .value {
    margin: 0;
    font-size: clamp(1.2rem, 2vw, 1.7rem);
    line-height: 1.05;
    font-weight: 900;
    letter-spacing: -0.03em;
    color: #0f172a;
  }

  .hint {
    margin: 5px 0 0;
    color: #475569;
    font-size: 0.8rem;
    font-weight: 700;
  }
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

function formatLap(time: number | null | undefined): string {
  if (time == null || !Number.isFinite(time) || time <= 0) return "—";
  return formatStopwatchTime(time);
}

function formatDelta(delta: number | null | undefined): string {
  if (delta == null || !Number.isFinite(delta)) return "—";
  return `${delta >= 0 ? "+" : ""}${delta.toFixed(3)}s`;
}

function formatPercent(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value.toFixed(0)}%`;
}

function formatStdDev(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value.toFixed(3)}s`;
}

function formatLaps(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value}`;
}

function buildTiles(performance: SessionPerformancePayload): { primary: MetricTile[]; secondary: MetricTile[] } {
  if (performance.format === "Qualifying") {
    const qualifying = performance.qualifyingKpis;
    return {
      primary: [
        {
          label: "Gap to P1",
          value: formatDelta(qualifying?.gapToP1),
          hint: qualifying?.rankByBestLap != null ? `Best lap rank P${qualifying.rankByBestLap}` : "Field benchmark",
        },
        {
          label: "Top 3 Avg",
          value: formatLap(qualifying?.top3Average),
          hint: `Best lap ${formatLap(qualifying?.bestLap)}`,
        },
      ],
      secondary: [
        { label: "Gap to P3", value: formatDelta(qualifying?.gapToP3) },
        { label: "Top 3 Spread", value: formatStdDev(qualifying?.top3Spread) },
        { label: "Second Lap Delta", value: formatStdDev(qualifying?.secondLapDelta) },
        { label: "Push Rate", value: formatPercent(qualifying?.pushRatePct) },
      ],
    };
  }

  const pace = performance.practiceRaceKpis;
  if (performance.format === "Race") {
    return {
      primary: [
        {
          label: pace?.top10Average != null ? "Top 10 Avg" : "Top 5 Avg",
          value: formatLap(pace?.top10Average ?? pace?.top5Average),
          hint: `Best lap ${formatLap(pace?.bestLap)}`,
        },
        {
          label: "Longest Stint",
          value: `${formatLaps(pace?.longestConsistentStintLaps)} laps`,
          hint:
            pace?.longestConsistentStintStartLap != null && pace?.longestConsistentStintEndLap != null
              ? `Laps ${pace.longestConsistentStintStartLap}-${pace.longestConsistentStintEndLap}`
              : "Best sustained run",
        },
      ],
      secondary: [
        { label: "Best Lap Gap", value: formatDelta(pace?.gapToP1) },
        { label: "On-Pace Laps", value: formatPercent(pace?.lapsWithinThresholdPct) },
        { label: "Std Dev", value: formatStdDev(pace?.cleanLapStdDev) },
        { label: "Clean Ratio", value: formatPercent(pace?.cleanLapRatioPct) },
      ],
    };
  }

  return {
    primary: [
      {
        label: "Top 5 Avg",
        value: formatLap(pace?.top5Average),
        hint: `Best lap ${formatLap(pace?.bestLap)}`,
      },
      {
        label: "Best Lap Gap",
        value: formatDelta(pace?.gapToP1),
        hint: "Versus session best",
      },
    ],
    secondary: [
      { label: "Top 10 Avg", value: formatLap(pace?.top10Average) },
      { label: "Std Dev", value: formatStdDev(pace?.cleanLapStdDev) },
      {
        label: "Longest Stint",
        value: `${formatLaps(pace?.longestConsistentStintLaps)} laps`,
        hint:
          pace?.longestConsistentStintStartLap != null && pace?.longestConsistentStintEndLap != null
            ? `Laps ${pace.longestConsistentStintStartLap}-${pace.longestConsistentStintEndLap}`
            : "Best sustained run",
      },
      { label: "Clean Ratio", value: formatPercent(pace?.cleanLapRatioPct) },
    ],
  };
}

export function SessionPerformanceCard({ laps, performance }: Props) {
  if (!laps.length) {
    return (
      <Card title="Session Performance">
        <div css={emptyStateStyles}>Add lap times to see session performance.</div>
      </Card>
    );
  }

  if (!performance) {
    return (
      <Card title="Session Performance">
        <div css={emptyStateStyles}>Session performance is not available for this session yet.</div>
      </Card>
    );
  }

  const tiles = buildTiles(performance);

  return (
    <Card title="Session Performance">
      <div css={containerStyles}>
        <div css={heroStyles}>
          <div css={heroTopStyles}>
            <div css={scoreBlockStyles}>
              <p className="eyebrow">
                {performance.format === "Qualifying" ? "Qualifying Performance Score" : "Session Performance Score"}
              </p>
              <div className="scoreRow">
                <p className="score">{performance.score ?? "—"}</p>
                <span className="label">{performance.label}</span>
              </div>
              <p className="headline">{performance.headline}</p>
              <p className="context">
                {performance.cleanLapCount} clean laps • {performance.excludedLapCount} excluded
              </p>
            </div>
            <span css={badgeStyles}>{performance.format}</span>
          </div>
          <div css={metricGridStyles}>
            {tiles.primary.map((tile) => (
              <div key={tile.label} css={metricTileStyles}>
                <p className="label">{tile.label}</p>
                <p className="value">{tile.value}</p>
                {tile.hint ? <p className="hint">{tile.hint}</p> : null}
              </div>
            ))}
          </div>
        </div>

        <div css={metricGridStyles}>
          {tiles.secondary.map((tile) => (
            <div key={tile.label} css={metricTileStyles}>
              <p className="label">{tile.label}</p>
              <p className="value">{tile.value}</p>
              {tile.hint ? <p className="hint">{tile.hint}</p> : null}
            </div>
          ))}
        </div>

        <SessionPerformanceChart
          laps={laps}
          cleanLapNumbers={performance.cleanLapNumbers}
          excludedLaps={performance.excludedLaps}
          highlightLapNumbers={performance.highlightLapNumbers}
          representativePace={performance.representativePace}
          thresholdLapTime={performance.thresholdLapTime}
          format={performance.format}
        />
      </div>
    </Card>
  );
}
