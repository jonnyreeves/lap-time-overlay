/**
 * @generated SignedSource<<230484135c30d780ad1e35b410b521f8>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type loginUsersQuery$variables = Record<PropertyKey, never>;
export type loginUsersQuery$data = {
  readonly users: ReadonlyArray<{
    readonly id: string;
    readonly username: string;
  }>;
};
export type loginUsersQuery = {
  response: loginUsersQuery$data;
  variables: loginUsersQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "alias": null,
    "args": null,
    "concreteType": "User",
    "kind": "LinkedField",
    "name": "users",
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
        "name": "username",
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
    "name": "loginUsersQuery",
    "selections": (v0/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "loginUsersQuery",
    "selections": (v0/*: any*/)
  },
  "params": {
    "cacheID": "25a6086c2f86c8fad4f227c302255e6e",
    "id": null,
    "metadata": {},
    "name": "loginUsersQuery",
    "operationKind": "query",
    "text": "query loginUsersQuery {\n  users {\n    id\n    username\n  }\n}\n"
  }
};
})();

(node as any).hash = "ff047a76eeb0a7789d8c16fdba1fba4e";

export default node;
