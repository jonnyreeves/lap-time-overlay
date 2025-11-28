import { format } from "date-fns";
import { Card } from "./Card.js";

export type Session = {
  date: number;
  circuit: string;
  format: string;
  pb: string;
};

export const sessions: Session[] = [
  {
    date: new Date("2023-11-23").getTime(),
    circuit: "Sandown Park",
    format: "Race",
    pb: "00:47.950",
  },
  {
    date: new Date("2023-11-23").getTime(),
    circuit: "Sandown Park.",
    format: "Practice",
    pb: "00:48.230",
  },
  {
    date: new Date("2023-11-22").getTime(),
    circuit: "Farnborough",
    format: "Practice",
    pb: "00:44.250",
  },
];

export function RecentSessionsCard() {
  return (
    <Card
      title="Recent sessions"
      rightComponent={<button className="button">Add Session</button>}
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
            {sessions.map((session) => (
              <tr key={`${session.circuit}-${session.format}-${session.pb}`}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {format(session.date, "do MMMM yyyy")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {session.circuit}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {session.format}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {session.pb}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
