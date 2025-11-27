import { type ConcreteRequest } from "relay-runtime";

export type RegisterMutation$variables = {
  input: {
    password: string;
    username: string;
  };
};
export type RegisterMutation$data = {
  readonly register: {
    readonly sessionExpiresAt: string;
    readonly user: {
      readonly id: string;
      readonly username: string;
      readonly createdAt: string;
    };
  };
};
export type RegisterMutation = {
  response: RegisterMutation$data;
  variables: RegisterMutation$variables;
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
    name: "RegisterMutation",
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
        name: "register",
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
    name: "RegisterMutation",
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
        name: "register",
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
    cacheID: "RegisterMutation",
    id: null,
    metadata: {},
    name: "RegisterMutation",
    operationKind: "mutation",
    text: "mutation RegisterMutation(\n  $input: AuthInput!\n) {\n  register(input: $input) {\n    user {\n      id\n      username\n      createdAt\n    }\n    sessionExpiresAt\n  }\n}\n",
  },
};

export default node;
