/**
 * @generated SignedSource<<282792457a4929d4aadb31c7b472095e>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type TrackLayoutCard_circuit$data = {
  readonly id: string;
  readonly name: string;
  readonly trackLayouts: ReadonlyArray<{
    readonly id: string;
    readonly name: string;
  }>;
  readonly " $fragmentType": "TrackLayoutCard_circuit";
};
export type TrackLayoutCard_circuit$key = {
  readonly " $data"?: TrackLayoutCard_circuit$data;
  readonly " $fragmentSpreads": FragmentRefs<"TrackLayoutCard_circuit">;
};

const node: ReaderFragment = (function(){
var v0 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v1 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
};
return {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "TrackLayoutCard_circuit",
  "selections": [
    (v0/*: any*/),
    (v1/*: any*/),
    {
      "alias": null,
      "args": null,
      "concreteType": "TrackLayout",
      "kind": "LinkedField",
      "name": "trackLayouts",
      "plural": true,
      "selections": [
        (v0/*: any*/),
        (v1/*: any*/)
      ],
      "storageKey": null
    }
  ],
  "type": "Circuit",
  "abstractKey": null
};
})();

(node as any).hash = "20dbb5566e34f995770886026d4bcc64";

export default node;
