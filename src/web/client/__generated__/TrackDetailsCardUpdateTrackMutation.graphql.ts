/**
 * @generated SignedSource<<4406523b01386be71ba936c85355db0b>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type UpdateTrackInput = {
  heroImage?: string | null | undefined;
  id: string;
  isIndoors?: boolean | null | undefined;
  name?: string | null | undefined;
  postcode?: string | null | undefined;
};
export type TrackDetailsCardUpdateTrackMutation$variables = {
  input: UpdateTrackInput;
};
export type TrackDetailsCardUpdateTrackMutation$data = {
  readonly updateTrack: {
    readonly track: {
      readonly id: string;
      readonly isIndoors: boolean;
      readonly name: string;
      readonly postcode: string | null | undefined;
    };
  };
};
export type TrackDetailsCardUpdateTrackMutation = {
  response: TrackDetailsCardUpdateTrackMutation$data;
  variables: TrackDetailsCardUpdateTrackMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "input"
  }
],
v1 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "input",
        "variableName": "input"
      }
    ],
    "concreteType": "UpdateTrackPayload",
    "kind": "LinkedField",
    "name": "updateTrack",
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
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "id",
            "storageKey": null
          },
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
            "name": "postcode",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "isIndoors",
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
    "name": "TrackDetailsCardUpdateTrackMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "TrackDetailsCardUpdateTrackMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "ca082b90de10347ae6a553a4dac4da99",
    "id": null,
    "metadata": {},
    "name": "TrackDetailsCardUpdateTrackMutation",
    "operationKind": "mutation",
    "text": "mutation TrackDetailsCardUpdateTrackMutation(\n  $input: UpdateTrackInput!\n) {\n  updateTrack(input: $input) {\n    track {\n      id\n      name\n      postcode\n      isIndoors\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "2a34982226534ac272eb9f2ef13a0d4a";

export default node;
