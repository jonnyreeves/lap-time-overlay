import { css } from "@emotion/react";
import type { viewSessionQuery$data } from "../../__generated__/viewSessionQuery.graphql.js";

type RivalAnalysis = NonNullable<NonNullable<viewSessionQuery$data["trackSession"]>["rivalAnalysis"]>;

type Props = {
  paceInsights: RivalAnalysis["paceInsights"] | null | undefined;
};

const paceBreakdownStyles = css`
  border: 1px solid #e2e8f4;
  border-radius: 10px;
  background: #f8fafc;
  overflow: hidden;

  .header {
    margin: 0;
    padding: 8px 10px;
    border-bottom: 1px solid #e2e8f4;
    font-weight: 800;
    color: #0f172a;
    font-size: 0.82rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .row {
    display: grid;
    grid-template-columns: 150px 1fr;
    gap: 10px;
    padding: 10px;
    border-top: 1px solid #e2e8f4;
    align-items: start;
  }

  .row:first-of-type {
    border-top: 0;
  }

  .label {
    margin: 0;
    color: #334155;
    font-weight: 700;
    font-size: 0.86rem;
  }

  .value {
    margin: 0;
    display: grid;
    gap: 6px;
  }

  .metrics {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
  }

  .chip {
    display: inline-flex;
    align-items: center;
    padding: 3px 8px;
    border-radius: 999px;
    border: 1px solid #cbd5e1;
    background: #ffffff;
    color: #1e293b;
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.01em;
  }

  .verdict {
    border-color: #bfdbfe;
    background: #eff6ff;
    color: #1d4ed8;
  }

  .detail {
    margin: 0;
    color: #334155;
    font-size: 0.84rem;
    line-height: 1.4;
  }
`;

function formatLapRange(startLapNumber: number, endLapNumber: number): string {
  if (startLapNumber === endLapNumber) return `L${startLapNumber}`;
  return `L${startLapNumber}-${endLapNumber}`;
}

function formatWindow(
  window:
    | { average: number; startLapNumber: number; endLapNumber: number }
    | null
    | undefined
): string {
  if (!window) return "n/a";
  return `${window.average.toFixed(3)}s (${formatLapRange(window.startLapNumber, window.endLapNumber)})`;
}

function formatSignedDelta(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(3)}s`;
}

function formatValue(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "n/a";
  return `${value.toFixed(3)}s`;
}

function formatCount(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "n/a";
  return `${value}`;
}

function verdictLabel(
  verdict:
    | "RIVAL_ADVANTAGE"
    | "SELF_ADVANTAGE"
    | "NEUTRAL"
    | "INSUFFICIENT"
    | "SELF_MORE_ROBUST"
    | "RIVAL_MORE_ROBUST"
    | "SIMILAR"
    | "%future added value"
): string {
  if (verdict === "RIVAL_ADVANTAGE") return "Rival adv";
  if (verdict === "SELF_ADVANTAGE") return "You adv";
  if (verdict === "SELF_MORE_ROBUST") return "You robust";
  if (verdict === "RIVAL_MORE_ROBUST") return "Rival robust";
  if (verdict === "SIMILAR") return "Similar";
  if (verdict === "NEUTRAL") return "Neutral";
  return "Insufficient";
}

export function RivalPaceDecomposition({ paceInsights }: Props) {
  return (
    <div css={paceBreakdownStyles}>
      <p className="header">Pace Decomposition</p>
      <div className="row">
        <p className="label">Peak pace</p>
        <div className="value">
          <div className="metrics">
            <span className="chip">Best Δ {formatSignedDelta(paceInsights?.deltas.bestLap)}</span>
            <span className="chip">F5 Δ {formatSignedDelta(paceInsights?.deltas.fastest5Avg)}</span>
            <span className="chip">F10 Δ {formatSignedDelta(paceInsights?.deltas.fastest10Avg)}</span>
            <span className="chip verdict">
              {verdictLabel(paceInsights?.ceilingVerdict ?? "INSUFFICIENT")}
            </span>
          </div>
          <p className="detail">
            You best {formatValue(paceInsights?.self.bestLap)} vs Rival best{" "}
            {formatValue(paceInsights?.rival.bestLap)}
          </p>
        </div>
      </div>
      <div className="row">
        <p className="label">Sustained pace</p>
        <div className="value">
          <div className="metrics">
            <span className="chip">R5 Δ {formatSignedDelta(paceInsights?.deltas.bestRolling5Avg)}</span>
            <span className="chip">R10 Δ {formatSignedDelta(paceInsights?.deltas.bestRolling10Avg)}</span>
            <span className="chip verdict">
              {verdictLabel(paceInsights?.sustainedVerdict ?? "INSUFFICIENT")}
            </span>
          </div>
          <p className="detail">
            R5 windows: You {formatWindow(paceInsights?.self.bestRolling5)} vs Rival{" "}
            {formatWindow(paceInsights?.rival.bestRolling5)}
          </p>
          <p className="detail">
            R10 windows: You {formatWindow(paceInsights?.self.bestRolling10)} vs Rival{" "}
            {formatWindow(paceInsights?.rival.bestRolling10)}
          </p>
        </div>
      </div>
      <div className="row">
        <p className="label">Robustness</p>
        <div className="value">
          <div className="metrics">
            <span className="chip">Spread Δ {formatSignedDelta(paceInsights?.deltas.slowLapSpread)}</span>
            <span className="chip">
              Quick {paceInsights?.quickWindowCutoff != null ? `≤${paceInsights.quickWindowCutoff.toFixed(3)}s` : "n/a"}:
              {" "}
              {formatCount(paceInsights?.quickWindowSelfCount)} vs{" "}
              {formatCount(paceInsights?.quickWindowRivalCount)}
            </span>
            <span className="chip verdict">
              {verdictLabel(paceInsights?.robustnessVerdict ?? "INSUFFICIENT")}
            </span>
          </div>
          <p className="detail">
            Slow-lap spread: You {formatValue(paceInsights?.self.slowLapSpread)} vs Rival{" "}
            {formatValue(paceInsights?.rival.slowLapSpread)}
          </p>
        </div>
      </div>
    </div>
  );
}
