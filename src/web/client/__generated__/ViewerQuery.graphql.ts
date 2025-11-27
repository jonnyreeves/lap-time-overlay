import { type ConcreteRequest } from "relay-runtime";

export type ViewerQuery$variables = Record<string, never>;
export type ViewerQuery$data = {
  readonly viewer: {
    readonly id: string;
    readonly username: string;
    readonly createdAt: string;
  } | null;
};
export type ViewerQuery = {
  response: ViewerQuery$data;
  variables: ViewerQuery$variables;
};

const node: ConcreteRequest = {
  fragment: {
    argumentDefinitions: [],
    kind: "Fragment",
    metadata: null,
    name: "ViewerQuery",
    selections: [
      {
        alias: null,
        args: null,
        concreteType: "User",
        kind: "LinkedField",
        name: "viewer",
        plural: false,
        selections: [
          {
            alias: null,
            args: null,
            kind: "ScalarField",
            name: "id",
            storageKey: null,
          },
          {
            alias: null,
            args: null,
            kind: "ScalarField",
            name: "username",
            storageKey: null,
          },
          {
            alias: null,
            args: null,
            kind: "ScalarField",
            name: "createdAt",
            storageKey: null,
          },
        ],
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
    name: "ViewerQuery",
    selections: [
      {
        alias: null,
        args: null,
        concreteType: "User",
        kind: "LinkedField",
        name: "viewer",
        plural: false,
        selections: [
          {
            alias: null,
            args: null,
            kind: "ScalarField",
            name: "id",
            storageKey: null,
          },
          {
            alias: null,
            args: null,
            kind: "ScalarField",
            name: "username",
            storageKey: null,
          },
          {
            alias: null,
            args: null,
            kind: "ScalarField",
            name: "createdAt",
            storageKey: null,
          },
        ],
        storageKey: null,
      },
    ],
  },
  params: {
    cacheID: "ViewerQuery",
    id: null,
    metadata: {},
    name: "ViewerQuery",
    operationKind: "query",
    text: "query ViewerQuery {\n  viewer {\n    id\n    username\n    createdAt\n  }\n}\n",
  },
};

export default node;
