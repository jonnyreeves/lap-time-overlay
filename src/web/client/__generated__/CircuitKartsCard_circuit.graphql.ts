/**
 * @generated SignedSource<<5d65065e7c7b5e3e6f9584586ab7cbe3>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type CircuitKartsCard_circuit$data = {
  readonly id: string;
  readonly karts: ReadonlyArray<{
    readonly id: string;
    readonly name: string;
  }>;
  readonly name: string;
  readonly " $fragmentType": "CircuitKartsCard_circuit";
};
export type CircuitKartsCard_circuit$key = {
  readonly " $data"?: CircuitKartsCard_circuit$data;
  readonly " $fragmentSpreads": FragmentRefs<"CircuitKartsCard_circuit">;
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
  "name": "CircuitKartsCard_circuit",
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

(node as any).hash = "d82270a8d6474bdec7e8dc1783fdf3c5";

export default node;
