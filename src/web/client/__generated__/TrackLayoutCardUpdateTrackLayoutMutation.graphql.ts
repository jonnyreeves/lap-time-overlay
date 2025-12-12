/**
 * @generated SignedSource<<37a7d76562b7f8020abeef92d4cdc8b6>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type UpdateTrackLayoutInput = {
  id: string;
  name: string;
};
export type TrackLayoutCardUpdateTrackLayoutMutation$variables = {
  input: UpdateTrackLayoutInput;
};
export type TrackLayoutCardUpdateTrackLayoutMutation$data = {
  readonly updateTrackLayout: {
    readonly trackLayout: {
      readonly id: string;
      readonly name: string;
      readonly track: {
        readonly id: string;
      };
    };
  };
};
export type TrackLayoutCardUpdateTrackLayoutMutation = {
  response: TrackLayoutCardUpdateTrackLayoutMutation$data;
  variables: TrackLayoutCardUpdateTrackLayoutMutation$variables;
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
    "concreteType": "UpdateTrackLayoutPayload",
    "kind": "LinkedField",
    "name": "updateTrackLayout",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "TrackLayout",
        "kind": "LinkedField",
        "name": "trackLayout",
        "plural": false,
        "selections": [
          (v1/*: any*/),
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
            "concreteType": "Track",
            "kind": "LinkedField",
            "name": "track",
            "plural": false,
            "selections": [
              (v1/*: any*/)
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
    "name": "TrackLayoutCardUpdateTrackLayoutMutation",
    "selections": (v2/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "TrackLayoutCardUpdateTrackLayoutMutation",
    "selections": (v2/*: any*/)
  },
  "params": {
    "cacheID": "7a2521f0a18fd87b3b5a712bf038e738",
    "id": null,
    "metadata": {},
    "name": "TrackLayoutCardUpdateTrackLayoutMutation",
    "operationKind": "mutation",
    "text": "mutation TrackLayoutCardUpdateTrackLayoutMutation(\n  $input: UpdateTrackLayoutInput!\n) {\n  updateTrackLayout(input: $input) {\n    trackLayout {\n      id\n      name\n      track {\n        id\n      }\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "74bd0dfbda489f1a5174b5794dc274b4";

export default node;
