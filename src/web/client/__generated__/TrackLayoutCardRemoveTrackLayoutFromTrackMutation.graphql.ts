/**
 * @generated SignedSource<<b5a22f29560ccb758de4eb6b07b87d33>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type TrackLayoutCardRemoveTrackLayoutFromTrackMutation$variables = {
  trackId: string;
  trackLayoutId: string;
};
export type TrackLayoutCardRemoveTrackLayoutFromTrackMutation$data = {
  readonly removeTrackLayoutFromTrack: {
    readonly track: {
      readonly id: string;
      readonly trackLayouts: ReadonlyArray<{
        readonly id: string;
        readonly name: string;
      }>;
    };
    readonly trackLayout: {
      readonly id: string;
      readonly name: string;
    };
  };
};
export type TrackLayoutCardRemoveTrackLayoutFromTrackMutation = {
  response: TrackLayoutCardRemoveTrackLayoutFromTrackMutation$data;
  variables: TrackLayoutCardRemoveTrackLayoutFromTrackMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "trackId"
  },
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "trackLayoutId"
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
  (v1/*: any*/),
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "name",
    "storageKey": null
  }
],
v3 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "trackId",
        "variableName": "trackId"
      },
      {
        "kind": "Variable",
        "name": "trackLayoutId",
        "variableName": "trackLayoutId"
      }
    ],
    "concreteType": "RemoveTrackLayoutFromTrackPayload",
    "kind": "LinkedField",
    "name": "removeTrackLayoutFromTrack",
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
          (v1/*: any*/),
          {
            "alias": null,
            "args": null,
            "concreteType": "TrackLayout",
            "kind": "LinkedField",
            "name": "trackLayouts",
            "plural": true,
            "selections": (v2/*: any*/),
            "storageKey": null
          }
        ],
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "concreteType": "TrackLayout",
        "kind": "LinkedField",
        "name": "trackLayout",
        "plural": false,
        "selections": (v2/*: any*/),
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
    "name": "TrackLayoutCardRemoveTrackLayoutFromTrackMutation",
    "selections": (v3/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "TrackLayoutCardRemoveTrackLayoutFromTrackMutation",
    "selections": (v3/*: any*/)
  },
  "params": {
    "cacheID": "0a5f32d18914aba7f7bd2bd13e75f0e1",
    "id": null,
    "metadata": {},
    "name": "TrackLayoutCardRemoveTrackLayoutFromTrackMutation",
    "operationKind": "mutation",
    "text": "mutation TrackLayoutCardRemoveTrackLayoutFromTrackMutation(\n  $trackId: ID!\n  $trackLayoutId: ID!\n) {\n  removeTrackLayoutFromTrack(trackId: $trackId, trackLayoutId: $trackLayoutId) {\n    track {\n      id\n      trackLayouts {\n        id\n        name\n      }\n    }\n    trackLayout {\n      id\n      name\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "dbf14f2178460f4d9cedb7c8f8a0d9a3";

export default node;
