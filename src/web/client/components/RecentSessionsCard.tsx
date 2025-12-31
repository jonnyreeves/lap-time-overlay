import { css } from "@emotion/react";
import { format } from "date-fns";
import { graphql, useFragment } from "react-relay";
import { Link, useNavigate } from "react-router-dom";
import type { RecentSessionsCard_viewer$key } from "../__generated__/RecentSessionsCard_viewer.graphql.js";
import { getConditionsEmoji } from "../utils/conditionsEmoji.js";
import { formatStopwatchTime } from "../utils/lapTime.js";
import { Card } from "./Card.js";
import { IconButton } from "./IconButton.js";

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
          classification
          conditions
          temperature
          notes
          track {
            name
            id
          }
          trackLayout {
            id
            name
          }
          kart {
            id
            name
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
  transition: transform 0.15s ease, box-shadow 0.2s ease, background 0.2s ease;

  &:hover {
    transform: translateY(-1px);
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
  gap: 12px;
  padding: 16px 18px;
  border-radius: 14px;
  border: 1px solid #e2e8f4;
  background: linear-gradient(135deg, #f9fbff, #f3f6ff);
  box-shadow: 0 8px 24px rgba(26, 32, 44, 0.06);
  cursor: pointer;
`;

const sessionGridStyles = css`
  display: grid;
  grid-template-columns: 1.6fr 1.1fr 1.15fr 0.85fr 0.8fr 1.05fr;
  align-items: center;
  gap: 10px 14px;

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: flex-start;
  }

  @media (max-width: 540px) {
    grid-template-columns: 1fr;
  }
`;

const fieldStackStyles = css`
  display: grid;
  gap: 6px;
`;

const fieldLabelStyles = css`
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #94a3b8;
  font-weight: 800;

  @media (min-width: 901px) {
    display: none;
  }
`;

const trackLinkStyles = css`
  font-size: 1.05rem;
  font-weight: 700;
  color: #0b132b;
  text-decoration: none;
  letter-spacing: -0.01em;

  &:hover {
    color: #536ad6;
  }
`;

const kartPillStyles = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 8px 12px;
  border-radius: 10px;
  background: #f1f5fb;
  border: 1px solid #d7e3f4;
  color: #0f172a;
  font-weight: 700;
  letter-spacing: -0.01em;
`;

const kartPillMutedStyles = css`
  background: #f8fafc;
  border-color: #e2e8f4;
  color: #94a3b8;
`;

const conditionsEmojiStyles = css`
  font-size: 1.05rem;
  background: #f1f5fb;
  border: 1px solid #d7e3f4;
  min-width: 44px;
  min-height: 44px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 10px;
  font-weight: 700;
  color: #0f172a;
  white-space: nowrap;
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.06);
`;

const classificationStyles = css`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 12px;
  background: #fff7ed;
  color: #9a3412;
  font-weight: 800;
  border: 1px solid #fed7aa;
  min-width: 72px;
  justify-content: center;
`;

const classificationMutedStyles = css`
  background: #f8fafc;
  color: #94a3b8;
  border-color: #e2e8f4;
`;

const dateTimeLinkStyles = css`
  display: grid;
  gap: 4px;
  font-weight: 700;
  color: #111827;
  text-decoration: none;
  letter-spacing: -0.01em;

  &:hover {
    color: #536ad6;
  }
`;

const timeValueStyles = css`
  font-weight: 600;
  color: #475569;
`;

const pbWrapperStyles = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 12px;
  border-radius: 10px;
  background: #e0e7ff;
  border: 1px solid #c7d2fe;
  color: #1f2a44;
  font-weight: 800;
  min-width: 92px;
  text-align: center;
  letter-spacing: -0.01em;
  box-shadow: 0 8px 18px rgba(55, 48, 163, 0.08);
`;

const pbContentStyles = css`
  display: grid;
  gap: 4px;
  justify-items: center;
`;

const pbCaptionStyles = css`
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.75;
  font-weight: 800;
`;

const pbMissingStyles = css`
  background: #f8fafc;
  color: #94a3b8;
  border-color: #e2e8f4;
  box-shadow: none;
`;

const notesStyles = css`
  margin: 0;
  color: #475569;
  line-height: 1.45;
`;

const emptyStateStyles = css`
  margin-top: 12px;
  padding: 14px 16px;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  background: #f8fafc;
  color: #475569;
`;

const footerLinkRowStyles = css`
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
`;

const footerLinkStyles = css`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #536ad6;
  margin-top: 8px;
  font-weight: 700;
  text-decoration: none;
  letter-spacing: -0.01em;

  &:hover {
    color: #334ac0;
  }
`;

function getClassificationEmoji(classification: number | null) {
  if (classification === 1) return "🥇";
  if (classification === 2) return "🥈";
  if (classification === 3) return "🥉";
  return null;
}

function formatPersonalBest(time: number | null | undefined): string | null {
  if (typeof time !== "number" || time <= 0 || Number.isNaN(time)) {
    return null;
  }
  const formatted = formatStopwatchTime(time);
  const [minutes, rest] = formatted.split(":");
  if (!rest) return formatted;
  return `${minutes.padStart(2, "0")}:${rest}`;
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
      rightHeaderContent={
        <IconButton
          type="button"
          icon="+"
          css={addSessionButtonStyles}
          onClick={() => navigate("/session/create")}
        >
          Add session
        </IconButton>
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
            const personalBest = formatPersonalBest(personalBestSeconds);
            const finishingPosition =
              typeof session.classification === "number" ? session.classification : null;
            const classificationEmoji = finishingPosition
              ? getClassificationEmoji(finishingPosition)
              : null;
            const classificationLabel = finishingPosition ? `P${finishingPosition}` : "—";
            const formattedDate = format(new Date(session.date), "do MMM yyyy");
            const formattedTime = format(new Date(session.date), "p");
            const trackName = session.track?.name ?? "Unknown track";
            const sessionType = session.format?.trim() ?? "";
            const kartName = session.kart?.name?.trim() ?? "";
            const combinedKartSession = [kartName, sessionType].filter(Boolean).join(" ");
            const combinedKartSessionLabel = combinedKartSession || "—";
            const hasCombinedKartSession = Boolean(combinedKartSession);
            const trackLayoutName = session.trackLayout?.name;
            const trackLabel = trackLayoutName ? `${trackName} • ${trackLayoutName}` : trackName;
            const temperatureLabel = session.temperature?.trim();
            const conditionsEmoji = getConditionsEmoji(session.conditions);
            const conditionsDisplay = temperatureLabel
              ? `${conditionsEmoji} ${temperatureLabel}°C`
              : conditionsEmoji;
            const conditionsAriaLabel = temperatureLabel
              ? `${session.conditions ?? "Unknown conditions"} ${temperatureLabel} C`
              : session.conditions ?? "Unknown conditions";
            const sessionPath = `/session/${session.id}`;

            return (
              <div
                key={session.id}
                css={sessionRowStyles}
                role="button"
                tabIndex={0}
                onClick={() => navigate(sessionPath)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    navigate(sessionPath);
                  }
                }}
              >
                <div css={sessionGridStyles}>
                  <div css={fieldStackStyles}>
                    <span css={fieldLabelStyles}>Track Name</span>
                    <Link to={`/session/${session.id}`} css={trackLinkStyles}>
                      {trackLabel}
                    </Link>
                  </div>
                  <div css={fieldStackStyles}>
                    <span css={fieldLabelStyles}>Date - Time</span>
                    <Link to={`/session/${session.id}`} css={dateTimeLinkStyles}>
                      <span>{formattedDate}</span>
                      <span css={timeValueStyles}>{formattedTime}</span>
                    </Link>
                  </div>
                  <div css={fieldStackStyles}>
                    <span css={fieldLabelStyles}>Kart / Session</span>
                    <span css={[kartPillStyles, !hasCombinedKartSession && kartPillMutedStyles]}>
                      {combinedKartSessionLabel}
                    </span>
                  </div>
                  <div css={fieldStackStyles}>
                    <span css={fieldLabelStyles}>Conditions</span>
                    <span
                      css={conditionsEmojiStyles}
                      aria-label={conditionsAriaLabel}
                      title={conditionsAriaLabel}
                    >
                      <span aria-hidden>{conditionsDisplay}</span>
                    </span>
                  </div>
                  <div css={fieldStackStyles}>
                    <span css={fieldLabelStyles}>Classification</span>
                    <span
                      css={[classificationStyles, !finishingPosition && classificationMutedStyles]}
                      aria-label={
                        finishingPosition
                          ? `Finished P${finishingPosition}`
                          : "Classification unknown"
                      }
                      title={
                        finishingPosition
                          ? `Finished P${finishingPosition}`
                          : "Classification unknown"
                      }
                    >
                      {classificationEmoji ? <span aria-hidden>{classificationEmoji}</span> : null}
                      <span>{classificationLabel}</span>
                    </span>
                  </div>
                  <div css={fieldStackStyles}>
                    <span css={fieldLabelStyles}>Fastest Lap</span>
                    <div
                      css={[pbWrapperStyles, !personalBest && pbMissingStyles]}
                      aria-label={
                        personalBest
                          ? `Fastest lap ${personalBest}`
                          : "No laps recorded"
                      }
                    >
                      {personalBest ? (
                        <div css={pbContentStyles}>
                          <span>{personalBest}</span>
                        </div>
                      ) : (
                        <span>—</span>
                      )}
                    </div>
                  </div>
                </div>
                {session.notes ? <p css={notesStyles}>{session.notes}</p> : null}
              </div>
            );
          })}
        </div>
      )}
      <div css={footerLinkRowStyles}>
        <Link to="/session" css={footerLinkStyles}>
          View all sessions →
        </Link>
      </div>
    </Card>
  );
}
