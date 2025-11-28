import { Card } from "../components/Card.js";
import { RecentSessionsCard } from "../components/RecentSessionsCard.js";

export function HomePage() {
  return (
    <div>
      <Card>
        <RecentSessionsCard />
      </Card>
    </div>
  );
}
