import { css } from "@emotion/react";
import { format } from "date-fns";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "./Card.js";
import { graphql, useFragment } from "react-relay";
import type { RecentSessionsCard_viewer$key } from "../__generated__/RecentSessionsCard_viewer.graphql.js";

const RecentSessionsCardFragment = graphql`
  fragment RecentSessionsCard_viewer on User {
    id
    recentTrackSessions(first: 5)
      @connection(key: "RecentSessionsCard_recentTrackSessions") {
      edges {
        node {
          id
          date
          format
          conditions
          notes
          circuit {
            name
            id
          }
          laps(first: 1) {
            personalBest
            id
          }
        }
      }
    }
  }
`;

type Props = {
  viewer: RecentSessionsCard_viewer$key;
};

const addSessionButtonStyles = css`
  padding: 10px 16px;
  border-radius: 10px;
  border: 1px solid #5b6fe9;
  background: linear-gradient(140deg, #5b6fe9, #7487ff);
  color: #fff;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 10px 25px rgba(83, 106, 214, 0.3);
  transition: transform 0.15s ease, box-shadow 0.2s ease, background 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 12px 28px rgba(83, 106, 214, 0.35);
  }

  &:active {
    transform: translateY(0);
  }
`;

const sessionsListStyles = css`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 14px;
`;

const sessionRowStyles = css`
  display: grid;
  grid-template-columns: minmax(170px, 1fr) 1.4fr minmax(120px, auto);
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid #e2e8f4;
  background: linear-gradient(135deg, #f9fbff, #f3f6ff);
  box-shadow: 0 8px 24px rgba(26, 32, 44, 0.06);

  @media (max-width: 780px) {
    grid-template-columns: 1fr;
    align-items: flex-start;
  }
`;

const sessionDateStyles = css`
  display: grid;
  gap: 2px;
`;

const dateLinkStyles = css`
  font-size: 1.1rem;
  font-weight: 700;
  color: #0b132b;
  text-decoration: none;
  letter-spacing: -0.01em;

  &:hover {
    color: #536ad6;
  }
`;

const sessionMetaStyles = css`
  display: grid;
  gap: 6px;
`;

const metaRowStyles = css`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;

const circuitNameStyles = css`
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: #111827;
`;

const formatPillStyles = css`
  padding: 7px 12px;
  border-radius: 999px;
  background: #e0e7ff;
  color: #3730a3;
  font-weight: 700;
  letter-spacing: -0.01em;
  border: 1px solid #c7d2fe;
`;

const notesStyles = css`
  margin: 0;
  color: #475569;
  line-height: 1.4;
`;

const pbContainerStyles = css`
  display: grid;
  justify-items: end;
  align-content: center;
  gap: 0;

  @media (max-width: 780px) {
    justify-items: start;
  }
`;

const pbValueStyles = css`
  display: grid;
  justify-items: center;
  gap: 2px;
  padding: 8px 12px;
  border-radius: 10px;
  background: linear-gradient(140deg, #5b6fe9, #88a7ff);
  color: #f7faff;
  font-weight: 700;
  letter-spacing: -0.01em;
  min-width: 82px;
  box-shadow: 0 10px 25px rgba(83, 106, 214, 0.24);
  border: 1px solid #5b6fe9;
`;

const pbLabelStyles = css`
  font-size: 0.65rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  opacity: 0.8;
  font-weight: 800;
`;

const pbMissingStyles = css`
  background: #f8fafc;
  color: #94a3b8;
  border-color: #e2e8f4;
  box-shadow: none;
`;

const emptyStateStyles = css`
  margin-top: 12px;
  padding: 14px 16px;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  background: #f8fafc;
  color: #475569;
`;

const conditionsPillStyles = css`
  padding: 7px 12px;
  border-radius: 12px;
  border: 1px solid #d7e3f4;
  background: #f1f5fb;
  color: #0f172a;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
`;

function getConditionsEmoji(conditions: string | null | undefined) {
  if (conditions === "Dry") return "☀️";
  if (conditions === "Wet") return "🌧️";
  return "⛅️";
}

export function RecentSessionsCard({ viewer }: Props) {
  const navigate = useNavigate();
  const data = useFragment(RecentSessionsCardFragment, viewer);
  const sessions = (data.recentTrackSessions?.edges ?? [])
    .map((edge) => edge?.node)
    .filter(Boolean);

  return (
    <Card
      title="Recent sessions"
      rightComponent={
        <button css={addSessionButtonStyles} onClick={() => navigate("/session/create")}>
          Add session
        </button>
      }
    >
      {sessions.length === 0 ? (
        <div css={emptyStateStyles}>
          <p>No sessions yet. Log your first one to start tracking PBs.</p>
        </div>
      ) : (
        <div css={sessionsListStyles}>
          {sessions.map((session) => {
            const personalBestSeconds = session.laps?.[0]?.personalBest;
            const personalBest =
              typeof personalBestSeconds === "number"
                ? personalBestSeconds.toFixed(3)
                : null;

            return (
              <div key={session.id} css={sessionRowStyles}>
                <div css={sessionDateStyles}>
                  <Link to={`/session/${session.id}`} css={dateLinkStyles}>
                    {format(new Date(session.date), "do MMM yyyy")}
                  </Link>
                </div>
                <div css={sessionMetaStyles}>
                  <div css={metaRowStyles}>
                    <p css={circuitNameStyles}>
                      {session.circuit?.name ?? "Unknown circuit"}
                    </p>
                    <span css={formatPillStyles}>{session.format}</span>
                    <span
                      css={conditionsPillStyles}
                      aria-label={session.conditions ?? "Unknown conditions"}
                      title={session.conditions ?? "Unknown conditions"}
                    >
                      <span aria-hidden>{getConditionsEmoji(session.conditions)}</span>
                    </span>
                  </div>
                  {session.notes ? <p css={notesStyles}>{session.notes}</p> : null}
                </div>
                <div css={pbContainerStyles}>
                  <div css={[pbValueStyles, !personalBest && pbMissingStyles]}>
                    <span css={pbLabelStyles}>Fastest lap</span>
                    <span>{personalBest ? `${personalBest}s` : "—"}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
