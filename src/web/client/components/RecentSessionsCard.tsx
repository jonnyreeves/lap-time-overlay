import { css } from "@emotion/react";
import { format } from "date-fns";
import { graphql, useFragment } from "react-relay";
import { Link, useNavigate } from "react-router-dom";
import type {
  RecentSessionsCard_viewer$data,
  RecentSessionsCard_viewer$key,
} from "../__generated__/RecentSessionsCard_viewer.graphql.js";
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
          isPersonalBest
          conditions
          temperature
          notes
          track {
            name
            id
            isIndoors
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

const headerActionsStyles = css`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;

const viewAllButtonStyles = css`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid #d7e3f4;
  background: #f8fafc;
  color: #536ad6;
  font-weight: 700;
  text-decoration: none;
  letter-spacing: -0.01em;

  &:hover {
    color: #334ac0;
    border-color: #c7d2fe;
    background: #eef2ff;
  }
`;

const sessionsListStyles = css`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 12px;
`;

const groupCardStyles = css`
  border: 1px solid #e2e8f4;
  border-radius: 12px;
  padding: 10px 12px;
  background: linear-gradient(180deg, #f3f6ff 0%, #f8fafc 100%);
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const groupHeaderStyles = css`
  font-size: 1.02rem;
  font-weight: 700;
  color: #0b132b;
  letter-spacing: -0.01em;
`;

const sessionRowStyles = css`
  display: grid;
  grid-template-columns: minmax(72px, auto) minmax(0, 1fr) minmax(90px, auto);
  gap: 8px 12px;
  align-items: center;
  padding: 6px 8px;
  border-radius: 10px;
  text-decoration: none;
  color: inherit;

  & + & {
    border-top: 1px solid #e2e8f4;
  }

  &:hover {
    background: #eef2ff;
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 6px;
  }
`;

const sessionTimeStyles = css`
  font-weight: 600;
  color: #475569;
  font-size: 0.85rem;
`;

const sessionPillsStyles = css`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
`;

const sessionPillStyles = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 6px 10px;
  border-radius: 999px;
  background: #f1f5fb;
  border: 1px solid #d7e3f4;
  color: #0f172a;
  font-weight: 700;
  font-size: 0.78rem;
  letter-spacing: -0.01em;
`;

const sessionPillMutedStyles = css`
  background: #f8fafc;
  border-color: #e2e8f4;
  color: #94a3b8;
`;

const conditionsPillStyles = css`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  background: #f1f5fb;
  border: 1px solid #d7e3f4;
  color: #0f172a;
  font-weight: 700;
  font-size: 0.78rem;
  letter-spacing: -0.01em;
  white-space: nowrap;
`;

const conditionsPillMutedStyles = css`
  background: #f8fafc;
  border-color: #e2e8f4;
  color: #94a3b8;
`;

const positionPillStyles = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  background: #fff7ed;
  color: #9a3412;
  border: 1px solid #fed7aa;
  font-weight: 800;
  font-size: 0.78rem;
  letter-spacing: -0.01em;
`;

const bestLapStyles = css`
  justify-self: end;
  text-align: right;
  padding: 6px 10px;
  border-radius: 10px;
  background: #e0e7ff;
  border: 1px solid #c7d2fe;
  color: #1f2a44;
  font-weight: 800;
  min-width: 90px;
  display: grid;
  gap: 2px;

  @media (max-width: 640px) {
    justify-self: start;
    text-align: left;
  }
`;

const bestLapMissingStyles = css`
  background: #f1f5f9;
  color: #94a3b8;
  border-color: #e2e8f4;
  font-weight: 700;
`;

const bestLapValueStyles = css`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  justify-content: flex-end;

  @media (max-width: 640px) {
    justify-content: flex-start;
  }
`;

const emptyStateStyles = css`
  margin-top: 12px;
  padding: 14px 16px;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  background: #f8fafc;
  color: #475569;
`;

function getClassificationMedal(position: number | null) {
  if (position === 1) return "🥇";
  if (position === 2) return "🥈";
  if (position === 3) return "🥉";
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

type SessionNode = RecentSessionsCard_viewer$data["recentTrackSessions"]["edges"][number]["node"];

type SessionEntry = {
  session: SessionNode;
  dateKey: string;
  dateLabel: string;
  timeLabel: string;
  timestamp: number;
};

type TrackGroup = {
  key: string;
  headerLabel: string;
  sessions: SessionEntry[];
  latestTimestamp: number;
};

function getSessionDateMetadata(dateValue: string) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return {
      dateKey: "unknown",
      dateLabel: "Unknown date",
      timeLabel: "—",
      timestamp: 0,
    };
  }

  const dateKey = format(date, "yyyy-MM-dd");

  return {
    dateKey,
    dateLabel: dateKey,
    timeLabel: format(date, "p"),
    timestamp: date.getTime(),
  };
}

function getConditionsLabel(session: SessionNode) {
  const isTrackIndoors = session.track?.isIndoors ?? false;
  return isTrackIndoors ? "Dry" : session.conditions ?? "Unknown conditions";
}

function groupSessions(sessions: SessionNode[]): TrackGroup[] {
  const trackGroups = new Map<
    string,
    {
      key: string;
      headerLabel: string;
      sessions: SessionEntry[];
      latestTimestamp: number;
    }
  >();

  const sessionsWithMeta: SessionEntry[] = sessions.map((session) => ({
    session,
    ...getSessionDateMetadata(session.date),
  }));

  sessionsWithMeta.forEach((entry) => {
    const trackName = entry.session.track?.name ?? "Unknown track";
    const trackLayoutName = entry.session.trackLayout?.name?.trim();
    const trackLabel = trackLayoutName ? `${trackName} • ${trackLayoutName}` : trackName;
    const kartLabel = entry.session.kart?.name?.trim() ?? "Unknown kart";
    const headerLabel = [entry.dateLabel, trackLabel, kartLabel].filter(Boolean).join(" • ");
    const trackKey = `${entry.dateKey}::${entry.session.track?.id ?? trackName}::${
      entry.session.trackLayout?.id ?? trackLayoutName ?? "none"
    }::${entry.session.kart?.id ?? kartLabel}`;

    const existingGroup = trackGroups.get(trackKey);
    const group =
      existingGroup ??
      {
        key: trackKey,
        headerLabel,
        sessions: [],
        latestTimestamp: entry.timestamp,
      };

    if (!existingGroup) {
      trackGroups.set(trackKey, group);
    }

    group.sessions.push(entry);
    group.latestTimestamp = Math.max(group.latestTimestamp, entry.timestamp);
  });

  return [...trackGroups.values()]
    .sort((a, b) => b.latestTimestamp - a.latestTimestamp)
    .map((group) => ({
      key: group.key,
      headerLabel: group.headerLabel,
      sessions: [...group.sessions].sort((a, b) => b.timestamp - a.timestamp),
      latestTimestamp: group.latestTimestamp,
    }));
}

export function RecentSessionsCard({ viewer }: Props) {
  const navigate = useNavigate();
  const data = useFragment(RecentSessionsCardFragment, viewer);
  const sessions = (data.recentTrackSessions?.edges ?? [])
    .map((edge) => edge?.node)
    .filter((session): session is SessionNode => Boolean(session));
  const groupedSessions = groupSessions(sessions);

  return (
    <Card
      title="Recent sessions"
      rightHeaderContent={
        <div css={headerActionsStyles}>
          <Link to="/session" css={viewAllButtonStyles}>
            View all sessions →
          </Link>
          <IconButton
            type="button"
            icon="+"
            css={addSessionButtonStyles}
            onClick={() => navigate("/session/create")}
          >
            Add session
          </IconButton>
        </div>
      }
    >
      {sessions.length === 0 ? (
        <div css={emptyStateStyles}>
          <p>No sessions yet. Log your first one to start tracking PBs.</p>
        </div>
      ) : (
        <div css={sessionsListStyles}>
          {groupedSessions.map((group) => (
            <div key={group.key} css={groupCardStyles}>
              <div css={groupHeaderStyles}>{group.headerLabel}</div>
              <div>
                {group.sessions.map((entry, index) => {
                  const { session, timeLabel } = entry;
                  const personalBestSeconds = session.laps?.[0]?.personalBest;
                  const personalBest = formatPersonalBest(personalBestSeconds);
                  const finishingPosition =
                    session.classification > 0 ? session.classification : null;
                  const sessionType = session.format?.trim() ?? "";
                  const hasSessionType = Boolean(sessionType);
                  const isRaceSession = sessionType.toLowerCase() === "race";
                  const classificationMedal = isRaceSession
                    ? getClassificationMedal(finishingPosition)
                    : null;
                  const temperatureLabel = session.temperature?.trim();
                  const conditionsLabel = getConditionsLabel(session);
                  const conditionsEmoji = getConditionsEmoji(conditionsLabel);
                  const conditionsDisplay = temperatureLabel
                    ? `${conditionsEmoji} ${temperatureLabel}°C`
                    : conditionsEmoji;
                  const conditionsAriaLabel = temperatureLabel
                    ? `${conditionsLabel} ${temperatureLabel} C`
                    : conditionsLabel;
                  const hasConditions = Boolean(conditionsEmoji);
                  const isNewPersonalBest = session.isPersonalBest;

                  return (
                    <Link key={session.id} to={`/session/${session.id}`} css={sessionRowStyles}>
                      <span css={sessionTimeStyles}>{timeLabel}</span>
                      <span css={sessionPillsStyles}>
                        <span
                          css={[sessionPillStyles, !hasSessionType && sessionPillMutedStyles]}
                        >
                          {sessionType || "—"}
                        </span>
                        <span
                          css={[
                            conditionsPillStyles,
                            !hasConditions && conditionsPillMutedStyles,
                          ]}
                          aria-label={conditionsAriaLabel}
                          title={conditionsAriaLabel}
                        >
                          <span aria-hidden>{conditionsDisplay || "—"}</span>
                        </span>
                        {finishingPosition ? (
                          <span
                            css={positionPillStyles}
                            aria-label={`Finished P${finishingPosition}`}
                            title={`Finished P${finishingPosition}`}
                          >
                            {classificationMedal ? (
                              <span aria-hidden>{classificationMedal}</span>
                            ) : null}
                            <span>P{finishingPosition}</span>
                          </span>
                        ) : null}
                      </span>
                      <span
                        css={[bestLapStyles, !personalBest && bestLapMissingStyles]}
                        aria-label={
                          personalBest ? `Fastest lap ${personalBest}` : "No laps recorded"
                        }
                      >
                        {personalBest ? (
                          <>
                            <span css={bestLapValueStyles}>
                              {isNewPersonalBest ? <span aria-hidden>🏆</span> : null}
                              <span>{personalBest}</span>
                            </span>
                          </>
                        ) : (
                          "—"
                        )}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
