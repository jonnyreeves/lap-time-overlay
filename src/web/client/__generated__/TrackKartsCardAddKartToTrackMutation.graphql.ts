/**
 * @generated SignedSource<<5f14aeec6ea2baf363bef93af2232e42>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type TrackKartsCardAddKartToTrackMutation$variables = {
  kartId: string;
  trackId: string;
};
export type TrackKartsCardAddKartToTrackMutation$data = {
  readonly addKartToTrack: {
    readonly kart: {
      readonly id: string;
    };
    readonly track: {
      readonly id: string;
      readonly karts: ReadonlyArray<{
        readonly id: string;
        readonly name: string;
      }>;
    };
  };
};
export type TrackKartsCardAddKartToTrackMutation = {
  response: TrackKartsCardAddKartToTrackMutation$data;
  variables: TrackKartsCardAddKartToTrackMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "kartId"
},
v1 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "trackId"
},
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v3 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "kartId",
        "variableName": "kartId"
      },
      {
        "kind": "Variable",
        "name": "trackId",
        "variableName": "trackId"
      }
    ],
    "concreteType": "AddKartToTrackPayload",
    "kind": "LinkedField",
    "name": "addKartToTrack",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "Track",
        "kind": "LinkedField",
        "name": "track",
        "plural": false,
        "selections": [
          (v2/*: any*/),
          {
            "alias": null,
            "args": null,
            "concreteType": "Kart",
            "kind": "LinkedField",
            "name": "karts",
            "plural": true,
            "selections": [
              (v2/*: any*/),
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
      },
      {
        "alias": null,
        "args": null,
        "concreteType": "Kart",
        "kind": "LinkedField",
        "name": "kart",
        "plural": false,
        "selections": [
          (v2/*: any*/)
        ],
        "storageKey": null
      }
    ],
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": [
      (v0/*: any*/),
      (v1/*: any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "TrackKartsCardAddKartToTrackMutation",
    "selections": (v3/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [
      (v1/*: any*/),
      (v0/*: any*/)
    ],
    "kind": "Operation",
    "name": "TrackKartsCardAddKartToTrackMutation",
    "selections": (v3/*: any*/)
  },
  "params": {
    "cacheID": "f7f0c11795150172b8b88b9b576a237d",
    "id": null,
    "metadata": {},
    "name": "TrackKartsCardAddKartToTrackMutation",
    "operationKind": "mutation",
    "text": "mutation TrackKartsCardAddKartToTrackMutation(\n  $trackId: ID!\n  $kartId: ID!\n) {\n  addKartToTrack(trackId: $trackId, kartId: $kartId) {\n    track {\n      id\n      karts {\n        id\n        name\n      }\n    }\n    kart {\n      id\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "f1248cc60f9dcb486e5c0fd4beb6f5de";

export default node;
