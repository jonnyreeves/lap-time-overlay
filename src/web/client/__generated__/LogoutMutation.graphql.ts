import { type ConcreteRequest } from "relay-runtime";

export type LogoutMutation$variables = Record<string, never>;
export type LogoutMutation$data = {
  readonly logout: {
    readonly success: boolean;
  };
};
export type LogoutMutation = {
  response: LogoutMutation$data;
  variables: LogoutMutation$variables;
};

const node: ConcreteRequest = {
  fragment: {
    argumentDefinitions: [],
    kind: "Fragment",
    metadata: null,
    name: "LogoutMutation",
    selections: [
      {
        alias: null,
        args: null,
        concreteType: "LogoutResult",
        kind: "LinkedField",
        name: "logout",
        plural: false,
        selections: [
          {
            alias: null,
            args: null,
            kind: "ScalarField",
            name: "success",
            storageKey: null,
          },
        ],
        storageKey: null,
      },
    ],
    type: "Mutation",
    abstractKey: null,
  },
  kind: "Request",
  operation: {
    argumentDefinitions: [],
    kind: "Operation",
    name: "LogoutMutation",
    selections: [
      {
        alias: null,
        args: null,
        concreteType: "LogoutResult",
        kind: "LinkedField",
        name: "logout",
        plural: false,
        selections: [
          {
            alias: null,
            args: null,
            kind: "ScalarField",
            name: "success",
            storageKey: null,
          },
        ],
        storageKey: null,
      },
    ],
  },
  params: {
    cacheID: "LogoutMutation",
    id: null,
    metadata: {},
    name: "LogoutMutation",
    operationKind: "mutation",
    text: "mutation LogoutMutation {\n  logout {\n    success\n  }\n}\n",
  },
};

export default node;
