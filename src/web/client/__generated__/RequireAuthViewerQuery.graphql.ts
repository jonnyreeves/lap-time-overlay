/**
 * @generated SignedSource<<01e31f5e1aef16c351ff1b1b8ed24551>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type RequireAuthViewerQuery$variables = Record<PropertyKey, never>;
export type RequireAuthViewerQuery$data = {
  readonly viewer: {
    readonly " $fragmentSpreads": FragmentRefs<"HomePage_viewer" | "SiteHeader_viewer">;
  } | null | undefined;
};
export type RequireAuthViewerQuery = {
  response: RequireAuthViewerQuery$data;
  variables: RequireAuthViewerQuery$variables;
};

const node: ConcreteRequest = (function(){
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
  "name": "personalBest",
  "storageKey": null
};
return {
  "fragment": {
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": null,
    "name": "RequireAuthViewerQuery",
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "User",
        "kind": "LinkedField",
        "name": "viewer",
        "plural": false,
        "selections": [
          {
            "args": null,
            "kind": "FragmentSpread",
            "name": "HomePage_viewer"
          },
          {
            "args": null,
            "kind": "FragmentSpread",
            "name": "SiteHeader_viewer"
          }
        ],
        "storageKey": null
      }
    ],
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "RequireAuthViewerQuery",
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "User",
        "kind": "LinkedField",
        "name": "viewer",
        "plural": false,
        "selections": [
          (v0/*: any*/),
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "username",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "Circuit",
            "kind": "LinkedField",
            "name": "recentCircuits",
            "plural": true,
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
              (v2/*: any*/)
            ],
            "storageKey": null
          },
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
              (v0/*: any*/),
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
                  (v1/*: any*/),
                  (v0/*: any*/)
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
                  (v2/*: any*/),
                  (v0/*: any*/)
                ],
                "storageKey": null
              }
            ],
            "storageKey": "recentTrackSessions(first:5)"
          }
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "0332540956e5e61409d8da1c988c8bc5",
    "id": null,
    "metadata": {},
    "name": "RequireAuthViewerQuery",
    "operationKind": "query",
    "text": "query RequireAuthViewerQuery {\n  viewer {\n    ...HomePage_viewer\n    ...SiteHeader_viewer\n    id\n  }\n}\n\nfragment HomePage_viewer on User {\n  id\n  username\n  ...RecentCircuitsCard_viewer\n  ...RecentSessionsCard_viewer\n}\n\nfragment RecentCircuitsCard_viewer on User {\n  recentCircuits {\n    id\n    name\n    heroImage\n    personalBest\n  }\n}\n\nfragment RecentSessionsCard_viewer on User {\n  recentTrackSessions(first: 5) {\n    id\n    date\n    format\n    conditions\n    notes\n    circuit {\n      name\n      id\n    }\n    laps {\n      personalBest\n      id\n    }\n  }\n}\n\nfragment SiteHeader_viewer on User {\n  id\n  username\n}\n"
  }
};
})();

(node as any).hash = "26381b15cc55842b9b8b203dcf6b33ba";

export default node;
