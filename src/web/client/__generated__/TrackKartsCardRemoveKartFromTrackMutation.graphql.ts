/**
 * @generated SignedSource<<c32b5f53880cf4c260f7fec8688013e8>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type TrackKartsCardRemoveKartFromTrackMutation$variables = {
  kartId: string;
  trackId: string;
};
export type TrackKartsCardRemoveKartFromTrackMutation$data = {
  readonly removeKartFromTrack: {
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
export type TrackKartsCardRemoveKartFromTrackMutation = {
  response: TrackKartsCardRemoveKartFromTrackMutation$data;
  variables: TrackKartsCardRemoveKartFromTrackMutation$variables;
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
    "concreteType": "RemoveKartFromTrackPayload",
    "kind": "LinkedField",
    "name": "removeKartFromTrack",
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
    "name": "TrackKartsCardRemoveKartFromTrackMutation",
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
    "name": "TrackKartsCardRemoveKartFromTrackMutation",
    "selections": (v3/*: any*/)
  },
  "params": {
    "cacheID": "bd3825ba70e95aa8428c03951646060b",
    "id": null,
    "metadata": {},
    "name": "TrackKartsCardRemoveKartFromTrackMutation",
    "operationKind": "mutation",
    "text": "mutation TrackKartsCardRemoveKartFromTrackMutation(\n  $trackId: ID!\n  $kartId: ID!\n) {\n  removeKartFromTrack(trackId: $trackId, kartId: $kartId) {\n    track {\n      id\n      karts {\n        id\n        name\n      }\n    }\n    kart {\n      id\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "19b8edbb79a5989e8bcdd329ac9a560d";

export default node;
