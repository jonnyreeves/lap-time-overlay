import { css } from "@emotion/react";
import { graphql, useFragment } from "react-relay";
import { useNavigate } from "react-router-dom";
import type { TrackVisitStatsCard_track$key } from "../../__generated__/TrackVisitStatsCard_track.graphql.js";
import { getConditionsEmoji } from "../../utils/conditionsEmoji.js";
import { Card } from "../Card.js";
import type { TrackSessionFilters } from "../session/TrackSessionsTable.js";

const TrackVisitStatsFragment = graphql`
  fragment TrackVisitStatsCard_track on Track {
    id
    name
    sessionStats {
      totalSessions
      byKart {
        count
        kart {
          id
          name
        }
      }
      byTrackLayout {
        count
        trackLayout {
          id
          name
        }
      }
      byCondition {
        conditions
        count
      }
    }
  }
`;

const summaryButtonStyles = css`
  width: 100%;
  text-align: center;
  background: linear-gradient(135deg, #eef2ff, #e0f2fe);
  border: 1px solid #dbeafe;
  border-radius: 14px;
  padding: 16px 18px;
  display: grid;
  gap: 6px;
  justify-items: center;
  cursor: pointer;
  transition: transform 0.12s ease, box-shadow 0.16s ease, border-color 0.12s ease;

  &:hover:enabled {
    transform: translateY(-1px);
    box-shadow: 0 12px 26px rgba(79, 70, 229, 0.18);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }
`;

const summaryLabelStyles = css`
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #475569;
  font-weight: 800;
  margin: 0;
`;

const summaryValueStyles = css`
  font-size: 2.3rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.02em;
  margin: 0;
`;

const summaryHintStyles = css`
  color: #334155;
  font-weight: 700;
  margin: 0;
`;

const sectionStyles = css`
  display: grid;
  gap: 6px;
  margin-top: 16px;
`;

const sectionTitleStyles = css`
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #94a3b8;
  font-weight: 800;
  margin: 0;
`;

const statGridStyles = css`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 10px;
`;

const statButtonStyles = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid #e2e8f4;
  background: #f8fafc;
  color: #0f172a;
  font-weight: 700;
  letter-spacing: -0.01em;
  cursor: pointer;
  transition: transform 0.12s ease, box-shadow 0.14s ease, border-color 0.12s ease, background 0.12s ease;

  &:hover:enabled {
    transform: translateY(-1px);
    border-color: #c7d2fe;
    background: #eef2ff;
    box-shadow: 0 10px 20px rgba(79, 70, 229, 0.12);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.65;
    border-style: dashed;
  }
`;

const statLabelStyles = css`
  display: inline-flex;
  align-items: center;
  gap: 8px;
`;

const statCountStyles = css`
  min-width: 56px;
  text-align: center;
  padding: 6px 10px;
  border-radius: 12px;
  background: #e0e7ff;
  border: 1px solid #c7d2fe;
  color: #111827;
  font-weight: 800;
  letter-spacing: -0.01em;
`;

const emptyStateStyles = css`
  margin-top: 8px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px dashed #cbd5e1;
  background: #f8fafc;
  color: #64748b;
  font-weight: 700;
  text-align: center;
`;

type StatItem = {
  key: string;
  label: string;
  count: number;
  onClick?: () => void;
  prefix?: string;
  disabledReason?: string;
};

type Props = {
  track: TrackVisitStatsCard_track$key;
};

export function TrackVisitStatsCard({ track }: Props) {
  const data = useFragment(TrackVisitStatsFragment, track);
  const navigate = useNavigate();
  const stats = data.sessionStats;
  const totalSessions = stats?.totalSessions ?? 0;
  const trackName = data.name ?? "this track";
  const hasSessions = totalSessions > 0;

  const navigateWithFilters = (filters: Partial<TrackSessionFilters>) => {
    const params = new URLSearchParams();
    const mergedFilters: Partial<TrackSessionFilters> = { trackId: data.id, ...filters };
    (["trackId", "trackLayoutId", "kartId", "conditions", "format"] as const).forEach((key) => {
      const value = mergedFilters[key];
      if (value) {
        params.set(key, value);
      }
    });
    navigate({
      pathname: "/session",
      search: params.toString() ? `?${params.toString()}` : "",
    });
  };

  const kartItems: StatItem[] = (stats?.byKart ?? []).map((entry) => {
    const kartName = entry.kart?.name ?? "Kart not set";
    const kartId = entry.kart?.id;
    const onClick = kartId ? () => navigateWithFilters({ kartId }) : undefined;
    return {
      key: kartId ?? `kart-${kartName}`,
      label: kartName,
      count: entry.count,
      onClick,
      disabledReason: onClick ? undefined : "Add a kart to filter by type",
    };
  });

  const layoutItems: StatItem[] = (stats?.byTrackLayout ?? []).map((entry) => ({
    key: entry.trackLayout.id,
    label: entry.trackLayout.name,
    count: entry.count,
    onClick: () => navigateWithFilters({ trackLayoutId: entry.trackLayout.id }),
  }));

  const conditionItems: StatItem[] = (stats?.byCondition ?? []).map((entry) => ({
    key: entry.conditions,
    label: entry.conditions,
    count: entry.count,
    prefix: getConditionsEmoji(entry.conditions),
    onClick: () => navigateWithFilters({ conditions: entry.conditions }),
  }));

  return (
    <Card title="">
      <button
        type="button"
        css={summaryButtonStyles}
        onClick={() => navigateWithFilters({})}
        aria-label={`View ${totalSessions} sessions for ${trackName}`}
      >
        <span css={summaryValueStyles}>{totalSessions}</span>
        <span css={summaryLabelStyles}>Total sessions</span>
      </button>

      {hasSessions ? (
        <>
          <StatSection title="By kart type" items={kartItems} emptyLabel="No kart data yet" />
          <StatSection title="By track layout" items={layoutItems} emptyLabel="No layout data yet" />
          <StatSection title="By conditions" items={conditionItems} emptyLabel="No condition data yet" />
        </>
      ) : (
        <div css={emptyStateStyles}>No sessions logged at this track yet.</div>
      )}
    </Card>
  );
}

function StatSection({
  title,
  items,
  emptyLabel,
}: {
  title: string;
  items: StatItem[];
  emptyLabel: string;
}) {
  return (
    <div css={sectionStyles}>
      <p css={sectionTitleStyles}>{title}</p>
      {items.length ? (
        <div css={statGridStyles}>
          {items.map((item) => {
            const isDisabled = !item.onClick || item.count === 0;
            return (
              <button
                key={item.key}
                type="button"
                css={statButtonStyles}
                onClick={item.onClick}
                disabled={isDisabled}
                title={isDisabled ? item.disabledReason : undefined}
              >
                <span css={statLabelStyles}>
                  {item.prefix ? <span aria-hidden>{item.prefix}</span> : null}
                  <span>{item.label}</span>
                </span>
                <span css={statCountStyles}>{item.count}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div css={emptyStateStyles}>{emptyLabel}</div>
      )}
    </div>
  );
}
