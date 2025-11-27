import { useLazyLoadQuery } from "react-relay";
import type { HelloQuery } from "./__generated__/HelloQuery.graphql.js";
import HelloQueryNode from "./__generated__/HelloQuery.graphql.js";

export function App() {
  const data = useLazyLoadQuery<HelloQuery>(HelloQueryNode, {});

  return (
    <main className="shell">
      <header className="hero">
        <p className="eyebrow">Lap Time Overlap</p>
        <h1 className="title">Hello, Relay + GraphQL!</h1>
        <p className="lede">Fresh React + TypeScript experience is ready.</p>
      </header>

      <section className="card">
        <p className="label">GraphQL says</p>
        <p className="value">{data.hello}</p>
      </section>
    </main>
  );
}
