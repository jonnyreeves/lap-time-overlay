/**
 * @generated SignedSource<<616d33d05c3dcc5db7ffd641776fef5f>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type TrackVisitStatsCard_track$data = {
  readonly id: string;
  readonly name: string;
  readonly sessionStats: {
    readonly byCondition: ReadonlyArray<{
      readonly conditions: string;
      readonly count: number;
    }>;
    readonly byKart: ReadonlyArray<{
      readonly count: number;
      readonly kart: {
        readonly id: string;
        readonly name: string;
      } | null | undefined;
    }>;
    readonly byTrackLayout: ReadonlyArray<{
      readonly count: number;
      readonly trackLayout: {
        readonly id: string;
        readonly name: string;
      };
    }>;
    readonly totalSessions: number;
  };
  readonly " $fragmentType": "TrackVisitStatsCard_track";
};
export type TrackVisitStatsCard_track$key = {
  readonly " $data"?: TrackVisitStatsCard_track$data;
  readonly " $fragmentSpreads": FragmentRefs<"TrackVisitStatsCard_track">;
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
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "count",
  "storageKey": null
},
v3 = [
  (v0/*: any*/),
  (v1/*: any*/)
];
return {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "TrackVisitStatsCard_track",
  "selections": [
    (v0/*: any*/),
    (v1/*: any*/),
    {
      "alias": null,
      "args": null,
      "concreteType": "TrackSessionStats",
      "kind": "LinkedField",
      "name": "sessionStats",
      "plural": false,
      "selections": [
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "totalSessions",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "concreteType": "TrackSessionKartStat",
          "kind": "LinkedField",
          "name": "byKart",
          "plural": true,
          "selections": [
            (v2/*: any*/),
            {
              "alias": null,
              "args": null,
              "concreteType": "Kart",
              "kind": "LinkedField",
              "name": "kart",
              "plural": false,
              "selections": (v3/*: any*/),
              "storageKey": null
            }
          ],
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "concreteType": "TrackSessionLayoutStat",
          "kind": "LinkedField",
          "name": "byTrackLayout",
          "plural": true,
          "selections": [
            (v2/*: any*/),
            {
              "alias": null,
              "args": null,
              "concreteType": "TrackLayout",
              "kind": "LinkedField",
              "name": "trackLayout",
              "plural": false,
              "selections": (v3/*: any*/),
              "storageKey": null
            }
          ],
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "concreteType": "TrackSessionConditionStat",
          "kind": "LinkedField",
          "name": "byCondition",
          "plural": true,
          "selections": [
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "conditions",
              "storageKey": null
            },
            (v2/*: any*/)
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

(node as any).hash = "dbbf4732ed20fc271e08c274e6e96bac";

export default node;
