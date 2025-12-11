/**
 * @generated SignedSource<<ba94db716bbb8e00c8c2cf17931ad168>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type CircuitTrackLayoutsCard_circuit$data = {
  readonly id: string;
  readonly name: string;
  readonly trackLayouts: ReadonlyArray<{
    readonly id: string;
    readonly name: string;
  }>;
  readonly " $fragmentType": "CircuitTrackLayoutsCard_circuit";
};
export type CircuitTrackLayoutsCard_circuit$key = {
  readonly " $data"?: CircuitTrackLayoutsCard_circuit$data;
  readonly " $fragmentSpreads": FragmentRefs<"CircuitTrackLayoutsCard_circuit">;
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
  "name": "CircuitTrackLayoutsCard_circuit",
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

(node as any).hash = "ee34c3f0465f0f98ed39f4396395ad4b";

export default node;
