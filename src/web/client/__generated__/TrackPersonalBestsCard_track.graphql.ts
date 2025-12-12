/**
 * @generated SignedSource<<31e741114a2f471a295e3524d4e2583b>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type TrackPersonalBestsCard_track$data = {
  readonly heroImage: string | null | undefined;
  readonly id: string;
  readonly name: string;
  readonly personalBestEntries: ReadonlyArray<{
    readonly conditions: string;
    readonly kart: {
      readonly id: string;
      readonly name: string;
    };
    readonly lapTime: number;
    readonly trackLayout: {
      readonly id: string;
      readonly name: string;
    };
    readonly trackSessionId: string;
  }>;
  readonly " $fragmentType": "TrackPersonalBestsCard_track";
};
export type TrackPersonalBestsCard_track$key = {
  readonly " $data"?: TrackPersonalBestsCard_track$data;
  readonly " $fragmentSpreads": FragmentRefs<"TrackPersonalBestsCard_track">;
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
},
v2 = [
  (v0/*: any*/),
  (v1/*: any*/)
];
return {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "TrackPersonalBestsCard_track",
  "selections": [
    (v0/*: any*/),
    (v1/*: any*/),
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "heroImage",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "concreteType": "TrackPersonalBest",
      "kind": "LinkedField",
      "name": "personalBestEntries",
      "plural": true,
      "selections": [
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "trackSessionId",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "conditions",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "lapTime",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "concreteType": "Kart",
          "kind": "LinkedField",
          "name": "kart",
          "plural": false,
          "selections": (v2/*: any*/),
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
  ],
  "type": "Track",
  "abstractKey": null
};
})();

(node as any).hash = "fba8f61e059dbc983336f7108eebe10d";

export default node;
