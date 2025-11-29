import { format } from "date-fns";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "./Card.js";
import { graphql, useFragment } from "react-relay";
import type { RecentSessionsCard_viewer$key } from "../__generated__/RecentSessionsCard_viewer.graphql.js";

const RecentSessionsCardFragment = graphql`
  fragment RecentSessionsCard_viewer on User {
    recentTrackSessions(first: 5) {
      id
      date
      format
      notes
      circuit {
        name
      }
      laps {
        personalBest
      }
    }
  }
`;

type Props = {
  viewer: RecentSessionsCard_viewer$key;
};

export function RecentSessionsCard({ viewer }: Props) {
  const navigate = useNavigate();
  const data = useFragment(RecentSessionsCardFragment, viewer);

  return (
    <Card
      title="Recent sessions"
      rightComponent={
        <button className="button" onClick={() => navigate("/session/create")}>
          Add Session
        </button>
      }
    >
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300"
              >
                Date
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300"
              >
                Circuit
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300"
              >
                Format
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300"
              >
                PB
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
            {data.recentTrackSessions.map((session) => (
              <tr key={session.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {format(new Date(session.date), "do MMMM yyyy")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {session.circuit?.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {session.format}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {session.laps && session.laps.length > 0
                    ? session.laps[0]?.personalBest?.toFixed(3)
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}