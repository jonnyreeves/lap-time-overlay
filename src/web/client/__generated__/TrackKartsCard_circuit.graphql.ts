/**
 * @generated SignedSource<<4f816cecc810aba976836ef46de22cf0>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type TrackKartsCard_circuit$data = {
  readonly id: string;
  readonly karts: ReadonlyArray<{
    readonly id: string;
    readonly name: string;
  }>;
  readonly name: string;
  readonly " $fragmentType": "TrackKartsCard_circuit";
};
export type TrackKartsCard_circuit$key = {
  readonly " $data"?: TrackKartsCard_circuit$data;
  readonly " $fragmentSpreads": FragmentRefs<"TrackKartsCard_circuit">;
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
  "name": "TrackKartsCard_circuit",
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
  "type": "Circuit",
  "abstractKey": null
};
})();

(node as any).hash = "b347baf512a7c276a0be5966797cbeeb";

export default node;
