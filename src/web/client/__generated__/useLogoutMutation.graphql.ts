/**
 * @generated SignedSource<<286e7773973a9f3a791eca402d2e4ec9>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type useLogoutMutation$variables = Record<PropertyKey, never>;
export type useLogoutMutation$data = {
  readonly logout: {
    readonly success: boolean;
  };
};
export type useLogoutMutation = {
  response: useLogoutMutation$data;
  variables: useLogoutMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "alias": null,
    "args": null,
    "concreteType": "LogoutResult",
    "kind": "LinkedField",
    "name": "logout",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "success",
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
    "name": "useLogoutMutation",
    "selections": (v0/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "useLogoutMutation",
    "selections": (v0/*: any*/)
  },
  "params": {
    "cacheID": "6ea4044bbd6ef7a25797a057283fcffc",
    "id": null,
    "metadata": {},
    "name": "useLogoutMutation",
    "operationKind": "mutation",
    "text": "mutation useLogoutMutation {\n  logout {\n    success\n  }\n}\n"
  }
};
})();

(node as any).hash = "3c3311110765e98cd4079b3df1710a4b";

export default node;
