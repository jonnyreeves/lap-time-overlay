import { css } from "@emotion/react";
import { formatStopwatchTime } from "../../utils/lapTime.js";

export type TrackPersonalBestEntry = {
  readonly trackSessionId: string;
  readonly conditions: string;
  readonly lapTime: number | null | undefined;
  readonly kart: { readonly id: string; readonly name: string };
  readonly trackLayout: { readonly id: string; readonly name: string };
};

const pillContainerStyles = css`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: min(100%, 360px);
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid #e2e8f4;
  background: #f8fafc;
  color: #475569;
  text-align: center;
  align-items: center;
  margin: 0 auto;
`;

const pbLabelStyles = css`
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #94a3b8;
`;

const pbValueStyles = css`
  font-size: 1.1rem;
  font-weight: 800;
  color: #0f172a;
`;

const pbHeaderStyles = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

const metaPillsStyles = css`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
`;

const pillStyles = css`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  background: #e2e8f4;
  color: #0f172a;
  font-size: 0.8rem;
  font-weight: 700;
`;

const conditionPillStyles = css`
  ${pillStyles};
  background: #eef2ff;
  color: #4338ca;
`;

const lapListStyles = css`
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
`;

const lapButtonStyles = css`
  ${pillStyles};
  width: fit-content;
  min-width: 120px;
  justify-content: space-between;
  background: #fff;
  border: 1px solid #e2e8f4;
  text-decoration: none;
  cursor: pointer;
  transition: transform 120ms ease, box-shadow 120ms ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
  }

  &:focus-visible {
    outline: 2px solid #6366f1;
    outline-offset: 2px;
  }
`;

const lapRankStyles = css`
  ${pbLabelStyles};
  color: #0f172a;
`;

const lapTimeStyles = css`
  font-weight: 700;
  color: #0f172a;
`;

function formatPersonalBest(time: number | null | undefined): string | null {
  if (typeof time !== "number" || time <= 0 || Number.isNaN(time)) {
    return null;
  }
  const formatted = formatStopwatchTime(time);
  const [minutes, rest] = formatted.split(":");
  if (!rest) return formatted;
  return `${minutes.padStart(2, "0")}:${rest}`;
}

function getConditionMeta(condition: string) {
  if (condition === "Dry") {
    return { emoji: "☀️", label: "Dry" };
  }
  if (condition === "Wet") {
    return { emoji: "🌧️", label: "Wet" };
  }
  return { emoji: "⛅️", label: condition };
}

export function TrackPersonalBestPill({
  entry,
  topEntries,
  onClick,
}: {
  entry: TrackPersonalBestEntry;
  topEntries?: ReadonlyArray<TrackPersonalBestEntry>;
  onClick?: (entry: TrackPersonalBestEntry) => void;
}) {
  const { emoji, label } = getConditionMeta(entry.conditions);
  const lapsToDisplay = (topEntries?.length ? topEntries : [entry]).slice(0, 3);
  const formattedTime = formatPersonalBest(entry.lapTime) ?? "—";

  return (
    <div css={pillContainerStyles}>
      <div css={pbHeaderStyles}>
        <span css={pbLabelStyles}>PB</span>
        <span css={pbValueStyles}>{formattedTime}</span>
      </div>
      <div css={metaPillsStyles}>
        <span css={pillStyles}>{entry.trackLayout.name}</span>
        <span css={pillStyles}>{entry.kart.name}</span>
        <span css={conditionPillStyles}>
          <span aria-hidden>{emoji}</span>
          <span>{label}</span>
        </span>
      </div>
      <div css={lapListStyles}>
        {lapsToDisplay.map((lapEntry, index) => (
          <button
            type="button"
            css={lapButtonStyles}
            key={`${lapEntry.trackSessionId}-${index}`}
            onClick={() => onClick?.(lapEntry)}
          >
            <span css={lapRankStyles}>#{index + 1}</span>
            <span css={lapTimeStyles}>{formatPersonalBest(lapEntry.lapTime) ?? "—"}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
