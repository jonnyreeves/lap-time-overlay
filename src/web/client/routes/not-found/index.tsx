import { Link } from "react-router-dom";
import { Card } from "../../components/Card.js";

export function NotFoundPage() {
  return (
    <Card title="Not found">
      <p className="value">The page you are looking for does not exist.</p>
      <Link to="/">Go home</Link>
    </Card>
  );
}
