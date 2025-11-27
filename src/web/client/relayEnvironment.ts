import {
  Environment,
  Network,
  RecordSource,
  Store,
  type FetchFunction,
  type GraphQLResponse,
} from "relay-runtime";

const fetchGraphQL: FetchFunction = async (params, variables) => {
  const response = await fetch("/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: params.text,
      variables,
    }),
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed with ${response.status}`);
  }

  return (await response.json()) as GraphQLResponse;
};

let cachedEnvironment: Environment | null = null;

export function createRelayEnvironment(): Environment {
  if (cachedEnvironment) return cachedEnvironment;

  cachedEnvironment = new Environment({
    network: Network.create(fetchGraphQL),
    store: new Store(new RecordSource()),
  });

  return cachedEnvironment;
}
