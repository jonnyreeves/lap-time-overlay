/**
 * @generated SignedSource<<5ab914e635d97937f986602768805ea0>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type TrackLayoutCard_track$data = {
  readonly id: string;
  readonly name: string;
  readonly trackLayouts: ReadonlyArray<{
    readonly id: string;
    readonly name: string;
  }>;
  readonly " $fragmentType": "TrackLayoutCard_track";
};
export type TrackLayoutCard_track$key = {
  readonly " $data"?: TrackLayoutCard_track$data;
  readonly " $fragmentSpreads": FragmentRefs<"TrackLayoutCard_track">;
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
  "name": "TrackLayoutCard_track",
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
  "type": "Track",
  "abstractKey": null
};
})();

(node as any).hash = "d03805ad41346556a7bee8f3e97d77fd";

export default node;
