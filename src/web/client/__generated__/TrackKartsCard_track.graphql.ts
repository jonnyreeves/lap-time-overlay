/**
 * @generated SignedSource<<414266619c3e63767a6e2c3285579a77>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type TrackKartsCard_track$data = {
  readonly id: string;
  readonly karts: ReadonlyArray<{
    readonly id: string;
    readonly name: string;
  }>;
  readonly name: string;
  readonly " $fragmentType": "TrackKartsCard_track";
};
export type TrackKartsCard_track$key = {
  readonly " $data"?: TrackKartsCard_track$data;
  readonly " $fragmentSpreads": FragmentRefs<"TrackKartsCard_track">;
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
  "name": "TrackKartsCard_track",
  "selections": [
    (v0/*: any*/),
    (v1/*: any*/),
    {
      "alias": null,
      "args": null,
      "concreteType": "Kart",
      "kind": "LinkedField",
      "name": "karts",
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

(node as any).hash = "4c92d7f670433171922603592eacfd47";

export default node;
