/**
 * @generated SignedSource<<38c151c52e7570c7bb0ee11b76de57ab>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type RecentSessionsCard_viewer$data = {
  readonly recentTrackSessions: ReadonlyArray<{
    readonly circuit: {
      readonly name: string;
    };
    readonly conditions: string;
    readonly date: string;
    readonly format: string;
    readonly id: string;
    readonly laps: ReadonlyArray<{
      readonly personalBest: number | null | undefined;
    }>;
    readonly notes: string | null | undefined;
  }>;
  readonly " $fragmentType": "RecentSessionsCard_viewer";
};
export type RecentSessionsCard_viewer$key = {
  readonly " $data"?: RecentSessionsCard_viewer$data;
  readonly " $fragmentSpreads": FragmentRefs<"RecentSessionsCard_viewer">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "RecentSessionsCard_viewer",
  "selections": [
    {
      "alias": null,
      "args": [
        {
          "kind": "Literal",
          "name": "first",
          "value": 5
        }
      ],
      "concreteType": "TrackSession",
      "kind": "LinkedField",
      "name": "recentTrackSessions",
      "plural": true,
      "selections": [
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "id",
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
          "name": "format",
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
          "name": "notes",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "concreteType": "Circuit",
          "kind": "LinkedField",
          "name": "circuit",
          "plural": false,
          "selections": [
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "name",
              "storageKey": null
            }
          ],
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "concreteType": "Lap",
          "kind": "LinkedField",
          "name": "laps",
          "plural": true,
          "selections": [
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "personalBest",
              "storageKey": null
            }
          ],
          "storageKey": null
        }
      ],
      "storageKey": "recentTrackSessions(first:5)"
    }
  ],
  "type": "User",
  "abstractKey": null
};

(node as any).hash = "cbfad4954deb9c16c6c76433b5faf479";

export default node;
