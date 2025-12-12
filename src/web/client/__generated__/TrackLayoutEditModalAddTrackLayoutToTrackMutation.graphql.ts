/**
 * @generated SignedSource<<b0159e409e53a19c8d626dad325c68e8>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type CreateTrackLayoutInput = {
  name: string;
};
export type TrackLayoutEditModalAddTrackLayoutToTrackMutation$variables = {
  input: CreateTrackLayoutInput;
  trackId: string;
};
export type TrackLayoutEditModalAddTrackLayoutToTrackMutation$data = {
  readonly addTrackLayoutToTrack: {
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
export type TrackLayoutEditModalAddTrackLayoutToTrackMutation = {
  response: TrackLayoutEditModalAddTrackLayoutToTrackMutation$data;
  variables: TrackLayoutEditModalAddTrackLayoutToTrackMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "input"
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
  (v2/*: any*/),
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "name",
    "storageKey": null
  }
],
v4 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "input",
        "variableName": "input"
      },
      {
        "kind": "Variable",
        "name": "trackId",
        "variableName": "trackId"
      }
    ],
    "concreteType": "AddTrackLayoutToTrackPayload",
    "kind": "LinkedField",
    "name": "addTrackLayoutToTrack",
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
            "concreteType": "TrackLayout",
            "kind": "LinkedField",
            "name": "trackLayouts",
            "plural": true,
            "selections": (v3/*: any*/),
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
        "selections": (v3/*: any*/),
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
    "name": "TrackLayoutEditModalAddTrackLayoutToTrackMutation",
    "selections": (v4/*: any*/),
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
    "name": "TrackLayoutEditModalAddTrackLayoutToTrackMutation",
    "selections": (v4/*: any*/)
  },
  "params": {
    "cacheID": "c06613497fe9be141e93662bda96ab31",
    "id": null,
    "metadata": {},
    "name": "TrackLayoutEditModalAddTrackLayoutToTrackMutation",
    "operationKind": "mutation",
    "text": "mutation TrackLayoutEditModalAddTrackLayoutToTrackMutation(\n  $trackId: ID!\n  $input: CreateTrackLayoutInput!\n) {\n  addTrackLayoutToTrack(trackId: $trackId, input: $input) {\n    track {\n      id\n      trackLayouts {\n        id\n        name\n      }\n    }\n    trackLayout {\n      id\n      name\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "5a86f86a0b87266b5c726dacbedfacde";

export default node;
