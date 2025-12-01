/**
 * @generated SignedSource<<bb86a64c4af5c8eca2f35336854c3a56>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type CreateTrackSessionInput = {
  circuitId: string;
  date: string;
  format: string;
  laps?: ReadonlyArray<LapInput> | null | undefined;
  notes?: string | null | undefined;
};
export type LapInput = {
  lapEvents?: ReadonlyArray<LapEventInput> | null | undefined;
  lapNumber: number;
  time: number;
};
export type LapEventInput = {
  event: string;
  offset: number;
  value: string;
};
export type createTrackSessionMutation$variables = {
  input: CreateTrackSessionInput;
};
export type createTrackSessionMutation$data = {
  readonly createTrackSession: {
    readonly trackSession: {
      readonly circuit: {
        readonly id: string;
        readonly name: string;
      };
      readonly date: string;
      readonly format: string;
      readonly id: string;
    };
  };
};
export type createTrackSessionMutation = {
  response: createTrackSessionMutation$data;
  variables: createTrackSessionMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "input"
  }
],
v1 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v2 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "input",
        "variableName": "input"
      }
    ],
    "concreteType": "CreateTrackSessionPayload",
    "kind": "LinkedField",
    "name": "createTrackSession",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "TrackSession",
        "kind": "LinkedField",
        "name": "trackSession",
        "plural": false,
        "selections": [
          (v1/*: any*/),
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "date",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "format",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "Circuit",
            "kind": "LinkedField",
            "name": "circuit",
            "plural": false,
            "selections": [
              (v1/*: any*/),
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "name",
                "storageKey": null
              }
            ],
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ],
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "createTrackSessionMutation",
    "selections": (v2/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "createTrackSessionMutation",
    "selections": (v2/*: any*/)
  },
  "params": {
    "cacheID": "0ce0df824cc4197cac0b418fb22aafc3",
    "id": null,
    "metadata": {},
    "name": "createTrackSessionMutation",
    "operationKind": "mutation",
    "text": "mutation createTrackSessionMutation(\n  $input: CreateTrackSessionInput!\n) {\n  createTrackSession(input: $input) {\n    trackSession {\n      id\n      date\n      format\n      circuit {\n        id\n        name\n      }\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "c0cb45042d7cd45f0a44d675ca4e7de2";

export default node;
