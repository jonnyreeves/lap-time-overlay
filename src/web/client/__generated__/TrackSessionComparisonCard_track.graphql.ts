/**
 * @generated SignedSource<<b4d659e323947baa9c81d2a526e85ae5>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type TrackSessionComparisonCard_track$data = {
  readonly comparisonScopes: ReadonlyArray<{
    readonly format: string;
    readonly kart: {
      readonly id: string;
      readonly name: string;
    };
    readonly key: string;
    readonly latestSessionDate: string | null | undefined;
    readonly sessionCount: number;
    readonly sessions: ReadonlyArray<{
      readonly classification: number;
      readonly conditions: string;
      readonly date: string;
      readonly fastestLap: number | null | undefined;
      readonly isDefaultBaseline: boolean;
      readonly isDefaultCurrent: boolean;
      readonly sessionId: string;
      readonly sessionPerformanceScore: number | null | undefined;
      readonly temperature: string | null | undefined;
    }>;
    readonly trackLayout: {
      readonly id: string;
      readonly name: string;
    };
  }>;
  readonly id: string;
  readonly name: string;
  readonly " $fragmentType": "TrackSessionComparisonCard_track";
};
export type TrackSessionComparisonCard_track$key = {
  readonly " $data"?: TrackSessionComparisonCard_track$data;
  readonly " $fragmentSpreads": FragmentRefs<"TrackSessionComparisonCard_track">;
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
  "name": "TrackSessionComparisonCard_track",
  "selections": [
    (v0/*: any*/),
    (v1/*: any*/),
    {
      "alias": null,
      "args": null,
      "concreteType": "TrackComparisonScope",
      "kind": "LinkedField",
      "name": "comparisonScopes",
      "plural": true,
      "selections": [
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "key",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "format",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "sessionCount",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "latestSessionDate",
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
          "concreteType": "TrackComparisonSession",
          "kind": "LinkedField",
          "name": "sessions",
          "plural": true,
          "selections": [
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "sessionId",
              "storageKey": null
            },
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "date",
              "storageKey": null
            },
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "classification",
              "storageKey": null
            },
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "fastestLap",
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
              "name": "temperature",
              "storageKey": null
            },
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "sessionPerformanceScore",
              "storageKey": null
            },
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "isDefaultCurrent",
              "storageKey": null
            },
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "isDefaultBaseline",
              "storageKey": null
            }
          ],
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

(node as any).hash = "95005a14f294cb9c8fccfd966212be7d";

export default node;
