import { css } from "@emotion/react";
import { formatStopwatchTime } from "../../utils/lapTime.js";
import type { RecentTracksCard_viewer$data } from "../../__generated__/RecentTracksCard_viewer.graphql.js";

type PersonalBestEntry = NonNullable<
  NonNullable<
    NonNullable<RecentTracksCard_viewer$data["recentTracks"]>["edges"]
  >[number]
>["node"]["personalBestEntries"][number];

const pillContainerStyles = css`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid #e2e8f4;
  background: #f8fafc;
  color: #475569;
  text-align: center;
  align-items: center;
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

export function RecentTrackPersonalBestPill({ entry }: { entry: PersonalBestEntry }) {
  const { emoji, label } = getConditionMeta(entry.conditions);
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
    </div>
  );
}
