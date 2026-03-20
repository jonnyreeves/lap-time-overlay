/**
 * @generated SignedSource<<77e4ad4769405296ea6b7ed4f6153731>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type profileQuery$variables = Record<PropertyKey, never>;
export type profileQuery$data = {
  readonly viewer: {
    readonly daytonaClubspeedCredentialStatus: {
      readonly configured: boolean;
      readonly lastValidatedAt: string | null | undefined;
      readonly lastValidationError: string | null | undefined;
      readonly username: string | null | undefined;
    };
    readonly id: string;
    readonly username: string;
  } | null | undefined;
};
export type profileQuery = {
  response: profileQuery$data;
  variables: profileQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "username",
  "storageKey": null
},
v1 = [
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
        "kind": "ScalarField",
        "name": "id",
        "storageKey": null
      },
      (v0/*: any*/),
      {
        "alias": null,
        "args": null,
        "concreteType": "DaytonaClubspeedCredentialStatus",
        "kind": "LinkedField",
        "name": "daytonaClubspeedCredentialStatus",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "configured",
            "storageKey": null
          },
          (v0/*: any*/),
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "lastValidatedAt",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "lastValidationError",
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ],
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": null,
    "name": "profileQuery",
    "selections": (v1/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "profileQuery",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "492d9ac72453b39b6b1c2adde59a999f",
    "id": null,
    "metadata": {},
    "name": "profileQuery",
    "operationKind": "query",
    "text": "query profileQuery {\n  viewer {\n    id\n    username\n    daytonaClubspeedCredentialStatus {\n      configured\n      username\n      lastValidatedAt\n      lastValidationError\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "f32b98efc4ab94aa7045fd663b346039";

export default node;
