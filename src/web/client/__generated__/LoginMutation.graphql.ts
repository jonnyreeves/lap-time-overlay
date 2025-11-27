import { type ConcreteRequest } from "relay-runtime";

export type LoginMutation$variables = {
  input: {
    password: string;
    username: string;
  };
};
export type LoginMutation$data = {
  readonly login: {
    readonly sessionExpiresAt: string;
    readonly user: {
      readonly id: string;
      readonly username: string;
      readonly createdAt: string;
    };
  };
};
export type LoginMutation = {
  response: LoginMutation$data;
  variables: LoginMutation$variables;
};

const node: ConcreteRequest = {
  fragment: {
    argumentDefinitions: [
      {
        defaultValue: null,
        kind: "LocalArgument",
        name: "input",
      },
    ],
    kind: "Fragment",
    metadata: null,
    name: "LoginMutation",
    selections: [
      {
        alias: null,
        args: [
          {
            kind: "Variable",
            name: "input",
            variableName: "input",
          },
        ],
        concreteType: "AuthPayload",
        kind: "LinkedField",
        name: "login",
        plural: false,
        selections: [
          {
            alias: null,
            args: null,
            concreteType: "User",
            kind: "LinkedField",
            name: "user",
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
          {
            alias: null,
            args: null,
            kind: "ScalarField",
            name: "sessionExpiresAt",
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
    argumentDefinitions: [
      {
        defaultValue: null,
        kind: "LocalArgument",
        name: "input",
      },
    ],
    kind: "Operation",
    name: "LoginMutation",
    selections: [
      {
        alias: null,
        args: [
          {
            kind: "Variable",
            name: "input",
            variableName: "input",
          },
        ],
        concreteType: "AuthPayload",
        kind: "LinkedField",
        name: "login",
        plural: false,
        selections: [
          {
            alias: null,
            args: null,
            concreteType: "User",
            kind: "LinkedField",
            name: "user",
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
          {
            alias: null,
            args: null,
            kind: "ScalarField",
            name: "sessionExpiresAt",
            storageKey: null,
          },
        ],
        storageKey: null,
      },
    ],
  },
  params: {
    cacheID: "LoginMutation",
    id: null,
    metadata: {},
    name: "LoginMutation",
    operationKind: "mutation",
    text: "mutation LoginMutation(\n  $input: AuthInput!\n) {\n  login(input: $input) {\n    user {\n      id\n      username\n      createdAt\n    }\n    sessionExpiresAt\n  }\n}\n",
  },
};

export default node;
