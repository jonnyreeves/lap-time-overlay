/**
 * @generated SignedSource<<e2e28a9cfb88fa8b98d4b085ec11dd7f>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type CreateTrackSessionInput = {
  circuitId: string;
  conditions?: string | null | undefined;
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
      readonly conditions: string;
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
            "kind": "ScalarField",
            "name": "conditions",
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
    "cacheID": "1b96acb16558b85fae98b767198ed5c2",
    "id": null,
    "metadata": {},
    "name": "createTrackSessionMutation",
    "operationKind": "mutation",
    "text": "mutation createTrackSessionMutation(\n  $input: CreateTrackSessionInput!\n) {\n  createTrackSession(input: $input) {\n    trackSession {\n      id\n      date\n      format\n      conditions\n      circuit {\n        id\n        name\n      }\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "8f8808aa80d46578aeb32888d8bae14b";

export default node;
