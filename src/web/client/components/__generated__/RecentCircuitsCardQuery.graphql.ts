/**
 * @generated SignedSource<<37d9a1b04bcd164a1c483e8631fe84bf>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type RecentCircuitsCardQuery$variables = Record<PropertyKey, never>;
export type RecentCircuitsCardQuery$data = {
  readonly viewer: {
    readonly " $fragmentSpreads": FragmentRefs<"RecentCircuitsCard_viewer">;
  } | null | undefined;
};
export type RecentCircuitsCardQuery = {
  response: RecentCircuitsCardQuery$data;
  variables: RecentCircuitsCardQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
};
return {
  "fragment": {
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": null,
    "name": "RecentCircuitsCardQuery",
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
            "name": "RecentCircuitsCard_viewer"
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
    "name": "RecentCircuitsCardQuery",
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
            "alias": null,
            "args": null,
            "concreteType": "Circuit",
            "kind": "LinkedField",
            "name": "recentCircuits",
            "plural": true,
            "selections": [
              (v0/*: any*/),
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
                "name": "heroImage",
                "storageKey": null
              }
            ],
            "storageKey": null
          },
          (v0/*: any*/)
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "7ec1137f116c89053b1950e015ff2a81",
    "id": null,
    "metadata": {},
    "name": "RecentCircuitsCardQuery",
    "operationKind": "query",
    "text": "query RecentCircuitsCardQuery {\n  viewer {\n    ...RecentCircuitsCard_viewer\n    id\n  }\n}\n\nfragment RecentCircuitsCard_viewer on User {\n  recentCircuits {\n    id\n    name\n    heroImage\n  }\n}\n"
  }
};
})();

(node as any).hash = "19110c58fd7c6b03a762583590e93323";

export default node;
