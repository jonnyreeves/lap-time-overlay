import { type ConcreteRequest } from "relay-runtime";

export type HelloQuery$variables = Record<string, never>;
export type HelloQuery$data = {
  readonly hello: string;
};
export type HelloQuery = {
  response: HelloQuery$data;
  variables: HelloQuery$variables;
};

const node: ConcreteRequest = {
  fragment: {
    argumentDefinitions: [],
    kind: "Fragment",
    metadata: null,
    name: "HelloQuery",
    selections: [
      {
        alias: null,
        args: null,
        kind: "ScalarField",
        name: "hello",
        storageKey: null,
      },
    ],
    type: "Query",
    abstractKey: null,
  },
  kind: "Request",
  operation: {
    argumentDefinitions: [],
    kind: "Operation",
    name: "HelloQuery",
    selections: [
      {
        alias: null,
        args: null,
        kind: "ScalarField",
        name: "hello",
        storageKey: null,
      },
    ],
  },
  params: {
    cacheID: "HelloQuery",
    id: null,
    metadata: {},
    name: "HelloQuery",
    operationKind: "query",
    text: "query HelloQuery {\n  hello\n}\n",
  },
};

export default node;
