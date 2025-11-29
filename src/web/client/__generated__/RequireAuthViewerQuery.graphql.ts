/**
 * @generated SignedSource<<7c110c241e28f1c16def0e2a66ca6c5d>>
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
    readonly " $fragmentSpreads": FragmentRefs<"HomePage_viewer">;
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
          }
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "17a1d0c5620328b74c2471b6b642af90",
    "id": null,
    "metadata": {},
    "name": "RequireAuthViewerQuery",
    "operationKind": "query",
    "text": "query RequireAuthViewerQuery {\n  viewer {\n    ...HomePage_viewer\n    id\n  }\n}\n\nfragment HomePage_viewer on User {\n  id\n  username\n  ...RecentCircuitsCard_viewer\n}\n\nfragment RecentCircuitsCard_viewer on User {\n  recentCircuits {\n    id\n    name\n    heroImage\n  }\n}\n"
  }
};
})();

(node as any).hash = "071ca3a4c402a426ba4978dff130a39d";

export default node;
