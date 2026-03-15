import { css } from "@emotion/react";
import { format } from "date-fns";
import { graphql, useFragment } from "react-relay";
import type { RivalsTeaserCard_viewer$key } from "../__generated__/RivalsTeaserCard_viewer.graphql.js";
import { Card } from "./Card.js";

const RivalsTeaserCardFragment = graphql`
  fragment RivalsTeaserCard_viewer on User {
    rivals(first: 3) {
      name
      sharedSessions
      lastRacedAt
      avgBest10Delta
      trendDirection
      sampleCount
    }
  }
`;

const listStyles = css`
  display: grid;
  gap: 10px;
`;

const rowStyles = css`
  border: 1px solid #e2e8f4;
  border-radius: 10px;
  background: #f8fafc;
  padding: 10px;
  display: grid;
  gap: 4px;
`;

const metaStyles = css`
  margin: 0;
  color: #475569;
  font-size: 0.88rem;
`;

const valueStyles = css`
  font-weight: 700;
  color: #0f172a;
`;

const emptyStyles = css`
  border: 1px dashed #cbd5e1;
  border-radius: 10px;
  background: #f8fafc;
  color: #64748b;
  padding: 12px;
  font-weight: 600;
`;

function formatDelta(delta: number | null | undefined): string {
  if (delta == null || Number.isNaN(delta)) return "—";
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta.toFixed(3)}s`;
}

function trendLabel(direction: string): string {
  if (direction === "CLOSING") return "Closing";
  if (direction === "WIDENING") return "Widening";
  if (direction === "FLAT") return "Flat";
  return "Insufficient";
}

export function RivalsTeaserCard({ viewer }: { viewer: RivalsTeaserCard_viewer$key }) {
  const data = useFragment(RivalsTeaserCardFragment, viewer);
  const rivals = data.rivals ?? [];

  return (
    <Card title="Rivals">
      {rivals.length ? (
        <div css={listStyles}>
          {rivals.map((rival) => (
            <div key={rival.name} css={rowStyles}>
              <div css={valueStyles}>{rival.name}</div>
              <p css={metaStyles}>
                Shared sessions: <strong>{rival.sharedSessions}</strong> · Trend:{" "}
                <strong>{trendLabel(rival.trendDirection)}</strong>
              </p>
              <p css={metaStyles}>
                Avg best-10 delta: <strong>{formatDelta(rival.avgBest10Delta)}</strong>
              </p>
              <p css={metaStyles}>
                Last raced:{" "}
                <strong>
                  {rival.lastRacedAt ? format(new Date(rival.lastRacedAt), "dd/MM/yyyy") : "—"}
                </strong>
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div css={emptyStyles}>Import sessions with multiple drivers to build rival insights.</div>
      )}
    </Card>
  );
}
