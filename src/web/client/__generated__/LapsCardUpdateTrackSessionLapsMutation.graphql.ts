/**
 * @generated SignedSource<<32ad3a01079e8441fe1f48a71299cb66>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type UpdateTrackSessionLapsInput = {
  id: string;
  laps: ReadonlyArray<LapInput>;
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
export type LapsCardUpdateTrackSessionLapsMutation$variables = {
  input: UpdateTrackSessionLapsInput;
};
export type LapsCardUpdateTrackSessionLapsMutation$data = {
  readonly updateTrackSessionLaps: {
    readonly trackSession: {
      readonly id: string;
      readonly laps: ReadonlyArray<{
        readonly id: string;
        readonly lapEvents: ReadonlyArray<{
          readonly event: string;
          readonly id: string;
          readonly offset: number;
          readonly value: string;
        }>;
        readonly lapNumber: number;
        readonly time: number;
      }>;
      readonly updatedAt: string;
    };
  };
};
export type LapsCardUpdateTrackSessionLapsMutation = {
  response: LapsCardUpdateTrackSessionLapsMutation$data;
  variables: LapsCardUpdateTrackSessionLapsMutation$variables;
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
    "kind": "Literal",
    "name": "first",
    "value": 50
  }
],
v3 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "input",
        "variableName": "input"
      }
    ],
    "concreteType": "UpdateTrackSessionLapsPayload",
    "kind": "LinkedField",
    "name": "updateTrackSessionLaps",
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
            "name": "updatedAt",
            "storageKey": null
          },
          {
            "alias": null,
            "args": (v2/*: any*/),
            "concreteType": "Lap",
            "kind": "LinkedField",
            "name": "laps",
            "plural": true,
            "selections": [
              (v1/*: any*/),
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "lapNumber",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "time",
                "storageKey": null
              },
              {
                "alias": null,
                "args": (v2/*: any*/),
                "concreteType": "LapEvent",
                "kind": "LinkedField",
                "name": "lapEvents",
                "plural": true,
                "selections": [
                  (v1/*: any*/),
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "offset",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "event",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "value",
                    "storageKey": null
                  }
                ],
                "storageKey": "lapEvents(first:50)"
              }
            ],
            "storageKey": "laps(first:50)"
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
    "name": "LapsCardUpdateTrackSessionLapsMutation",
    "selections": (v3/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "LapsCardUpdateTrackSessionLapsMutation",
    "selections": (v3/*: any*/)
  },
  "params": {
    "cacheID": "927665fb20785ec00c9cca9a48a50089",
    "id": null,
    "metadata": {},
    "name": "LapsCardUpdateTrackSessionLapsMutation",
    "operationKind": "mutation",
    "text": "mutation LapsCardUpdateTrackSessionLapsMutation(\n  $input: UpdateTrackSessionLapsInput!\n) {\n  updateTrackSessionLaps(input: $input) {\n    trackSession {\n      id\n      updatedAt\n      laps(first: 50) {\n        id\n        lapNumber\n        time\n        lapEvents(first: 50) {\n          id\n          offset\n          event\n          value\n        }\n      }\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "64bb7b5457a4cb4b4b0cd027309937aa";

export default node;
