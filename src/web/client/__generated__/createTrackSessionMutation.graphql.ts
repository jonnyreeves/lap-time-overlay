/**
 * @generated SignedSource<<8e83ec60ddb5289c5785d84e28b2ac55>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type CreateTrackSessionInput = {
  classification: number;
  conditions?: string | null | undefined;
  date: string;
  fastestLap?: number | null | undefined;
  format: string;
  kartId: string;
  kartNumber?: string | null | undefined;
  laps?: ReadonlyArray<LapInput> | null | undefined;
  notes?: string | null | undefined;
  temperature?: string | null | undefined;
  trackId?: string | null | undefined;
  trackLayoutId: string;
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
  connections: ReadonlyArray<string>;
  input: CreateTrackSessionInput;
  trackConnections: ReadonlyArray<string>;
};
export type createTrackSessionMutation$data = {
  readonly createTrackSession: {
    readonly trackSession: {
      readonly classification: number;
      readonly conditions: string;
      readonly date: string;
      readonly fastestLap: number | null | undefined;
      readonly format: string;
      readonly id: string;
      readonly kart: {
        readonly id: string;
        readonly name: string;
      } | null | undefined;
      readonly laps: ReadonlyArray<{
        readonly id: string;
        readonly personalBest: number | null | undefined;
      }>;
      readonly notes: string | null | undefined;
      readonly temperature: string | null | undefined;
      readonly track: {
        readonly heroImage: string | null | undefined;
        readonly id: string;
        readonly isIndoors: boolean;
        readonly name: string;
        readonly personalBestEntries: ReadonlyArray<{
          readonly conditions: string;
          readonly kart: {
            readonly id: string;
            readonly name: string;
          };
          readonly lapTime: number;
          readonly trackLayout: {
            readonly id: string;
            readonly name: string;
          };
          readonly trackSessionId: string;
        }>;
      };
      readonly trackLayout: {
        readonly id: string;
        readonly name: string;
      };
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
  "name": "connections"
},
v1 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "input"
},
v2 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "trackConnections"
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
  "name": "fastestLap",
  "storageKey": null
},
v9 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "conditions",
  "storageKey": null
},
v10 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "temperature",
  "storageKey": null
},
v11 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
},
v12 = [
  (v4/*: any*/),
  (v11/*: any*/)
],
v13 = {
  "alias": null,
  "args": null,
  "concreteType": "TrackLayout",
  "kind": "LinkedField",
  "name": "trackLayout",
  "plural": false,
  "selections": (v12/*: any*/),
  "storageKey": null
},
v14 = {
  "alias": null,
  "args": null,
  "concreteType": "Kart",
  "kind": "LinkedField",
  "name": "kart",
  "plural": false,
  "selections": (v12/*: any*/),
  "storageKey": null
},
v15 = {
  "alias": null,
  "args": null,
  "concreteType": "Track",
  "kind": "LinkedField",
  "name": "track",
  "plural": false,
  "selections": [
    (v4/*: any*/),
    (v11/*: any*/),
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "heroImage",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "isIndoors",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "concreteType": "TrackPersonalBest",
      "kind": "LinkedField",
      "name": "personalBestEntries",
      "plural": true,
      "selections": [
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "trackSessionId",
          "storageKey": null
        },
        (v9/*: any*/),
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "lapTime",
          "storageKey": null
        },
        (v14/*: any*/),
        (v13/*: any*/)
      ],
      "storageKey": null
    }
  ],
  "storageKey": null
},
v16 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "notes",
  "storageKey": null
},
v17 = {
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
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "personalBest",
      "storageKey": null
    },
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
              (v9/*: any*/),
              (v10/*: any*/),
              (v13/*: any*/),
              (v14/*: any*/),
              (v15/*: any*/),
              (v16/*: any*/),
              (v17/*: any*/)
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
      (v1/*: any*/),
      (v0/*: any*/),
      (v2/*: any*/)
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
              (v9/*: any*/),
              (v10/*: any*/),
              (v13/*: any*/),
              (v14/*: any*/),
              (v15/*: any*/),
              {
                "alias": null,
                "args": null,
                "filters": null,
                "handle": "prependNode",
                "key": "",
                "kind": "LinkedHandle",
                "name": "track",
                "handleArgs": [
                  {
                    "kind": "Variable",
                    "name": "connections",
                    "variableName": "trackConnections"
                  },
                  {
                    "kind": "Literal",
                    "name": "edgeTypeName",
                    "value": "TrackEdge"
                  }
                ]
              },
              (v16/*: any*/),
              (v17/*: any*/)
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
    "cacheID": "ae9bc1c1bfce8ba6df8b5d5a80fab924",
    "id": null,
    "metadata": {},
    "name": "createTrackSessionMutation",
    "operationKind": "mutation",
    "text": "mutation createTrackSessionMutation(\n  $input: CreateTrackSessionInput!\n) {\n  createTrackSession(input: $input) {\n    trackSession {\n      id\n      date\n      format\n      classification\n      fastestLap\n      conditions\n      temperature\n      trackLayout {\n        id\n        name\n      }\n      kart {\n        id\n        name\n      }\n      track {\n        id\n        name\n        heroImage\n        isIndoors\n        personalBestEntries {\n          trackSessionId\n          conditions\n          lapTime\n          kart {\n            id\n            name\n          }\n          trackLayout {\n            id\n            name\n          }\n        }\n      }\n      notes\n      laps(first: 1) {\n        personalBest\n        id\n      }\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "00071ea0701cfcf8d1edad17d2dd30bb";

export default node;
