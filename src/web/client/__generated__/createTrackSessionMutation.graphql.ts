/**
 * @generated SignedSource<<eec493541a6a6e4088cb7407433fdaa3>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type CreateTrackSessionInput = {
  circuitId: string;
  classification: number;
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
  circuitConnections: ReadonlyArray<string>;
  connections: ReadonlyArray<string>;
  input: CreateTrackSessionInput;
};
export type createTrackSessionMutation$data = {
  readonly createTrackSession: {
    readonly trackSession: {
      readonly circuit: {
        readonly heroImage: string | null | undefined;
        readonly id: string;
        readonly name: string;
        readonly personalBest: number | null | undefined;
        readonly personalBestDry: number | null | undefined;
        readonly personalBestWet: number | null | undefined;
      };
      readonly classification: number;
      readonly conditions: string;
      readonly date: string;
      readonly format: string;
      readonly id: string;
      readonly laps: ReadonlyArray<{
        readonly id: string;
        readonly personalBest: number | null | undefined;
      }>;
      readonly notes: string | null | undefined;
    };
  };
};
export type createTrackSessionMutation = {
  response: createTrackSessionMutation$data;
  variables: createTrackSessionMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "circuitConnections"
},
v1 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "connections"
},
v2 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "input"
},
v3 = [
  {
    "kind": "Variable",
    "name": "input",
    "variableName": "input"
  }
],
v4 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "date",
  "storageKey": null
},
v6 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "format",
  "storageKey": null
},
v7 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "classification",
  "storageKey": null
},
v8 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "conditions",
  "storageKey": null
},
v9 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "personalBest",
  "storageKey": null
},
v10 = {
  "alias": null,
  "args": null,
  "concreteType": "Circuit",
  "kind": "LinkedField",
  "name": "circuit",
  "plural": false,
  "selections": [
    (v4/*: any*/),
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "name",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "heroImage",
      "storageKey": null
    },
    (v9/*: any*/),
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "personalBestDry",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "personalBestWet",
      "storageKey": null
    }
  ],
  "storageKey": null
},
v11 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "notes",
  "storageKey": null
},
v12 = {
  "alias": null,
  "args": [
    {
      "kind": "Literal",
      "name": "first",
      "value": 1
    }
  ],
  "concreteType": "Lap",
  "kind": "LinkedField",
  "name": "laps",
  "plural": true,
  "selections": [
    (v9/*: any*/),
    (v4/*: any*/)
  ],
  "storageKey": "laps(first:1)"
};
return {
  "fragment": {
    "argumentDefinitions": [
      (v0/*: any*/),
      (v1/*: any*/),
      (v2/*: any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "createTrackSessionMutation",
    "selections": [
      {
        "alias": null,
        "args": (v3/*: any*/),
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
              (v4/*: any*/),
              (v5/*: any*/),
              (v6/*: any*/),
              (v7/*: any*/),
              (v8/*: any*/),
              (v10/*: any*/),
              (v11/*: any*/),
              (v12/*: any*/)
            ],
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ],
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [
      (v2/*: any*/),
      (v1/*: any*/),
      (v0/*: any*/)
    ],
    "kind": "Operation",
    "name": "createTrackSessionMutation",
    "selections": [
      {
        "alias": null,
        "args": (v3/*: any*/),
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
              (v4/*: any*/),
              (v5/*: any*/),
              (v6/*: any*/),
              (v7/*: any*/),
              (v8/*: any*/),
              (v10/*: any*/),
              {
                "alias": null,
                "args": null,
                "filters": null,
                "handle": "prependNode",
                "key": "",
                "kind": "LinkedHandle",
                "name": "circuit",
                "handleArgs": [
                  {
                    "kind": "Variable",
                    "name": "connections",
                    "variableName": "circuitConnections"
                  },
                  {
                    "kind": "Literal",
                    "name": "edgeTypeName",
                    "value": "CircuitEdge"
                  }
                ]
              },
              (v11/*: any*/),
              (v12/*: any*/)
            ],
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "filters": null,
            "handle": "prependNode",
            "key": "",
            "kind": "LinkedHandle",
            "name": "trackSession",
            "handleArgs": [
              {
                "kind": "Variable",
                "name": "connections",
                "variableName": "connections"
              },
              {
                "kind": "Literal",
                "name": "edgeTypeName",
                "value": "TrackSessionEdge"
              }
            ]
          }
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "dc8d126b1b4389c12d0a48e0ff01fbf2",
    "id": null,
    "metadata": {},
    "name": "createTrackSessionMutation",
    "operationKind": "mutation",
    "text": "mutation createTrackSessionMutation(\n  $input: CreateTrackSessionInput!\n) {\n  createTrackSession(input: $input) {\n    trackSession {\n      id\n      date\n      format\n      classification\n      conditions\n      circuit {\n        id\n        name\n        heroImage\n        personalBest\n        personalBestDry\n        personalBestWet\n      }\n      notes\n      laps(first: 1) {\n        personalBest\n        id\n      }\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "4b510edfbb29f86aee2f1ffac85bf816";

export default node;
