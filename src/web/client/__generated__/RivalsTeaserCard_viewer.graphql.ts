/**
 * @generated SignedSource<<66b15356655431d52b719dc6d954f798>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
export type RivalTrendDirection = "CLOSING" | "FLAT" | "INSUFFICIENT" | "WIDENING" | "%future added value";
import { FragmentRefs } from "relay-runtime";
export type RivalsTeaserCard_viewer$data = {
  readonly rivals: ReadonlyArray<{
    readonly avgBest10Delta: number | null | undefined;
    readonly lastRacedAt: string | null | undefined;
    readonly name: string;
    readonly sampleCount: number;
    readonly sharedSessions: number;
    readonly trendDirection: RivalTrendDirection;
  }>;
  readonly " $fragmentType": "RivalsTeaserCard_viewer";
};
export type RivalsTeaserCard_viewer$key = {
  readonly " $data"?: RivalsTeaserCard_viewer$data;
  readonly " $fragmentSpreads": FragmentRefs<"RivalsTeaserCard_viewer">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "RivalsTeaserCard_viewer",
  "selections": [
    {
      "alias": null,
      "args": [
        {
          "kind": "Literal",
          "name": "first",
          "value": 3
        }
      ],
      "concreteType": "RivalSummary",
      "kind": "LinkedField",
      "name": "rivals",
      "plural": true,
      "selections": [
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
          "name": "sharedSessions",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "lastRacedAt",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "avgBest10Delta",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "trendDirection",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "sampleCount",
          "storageKey": null
        }
      ],
      "storageKey": "rivals(first:3)"
    }
  ],
  "type": "User",
  "abstractKey": null
};

(node as any).hash = "6f35947c1e61d01319db0120691527f2";

export default node;
