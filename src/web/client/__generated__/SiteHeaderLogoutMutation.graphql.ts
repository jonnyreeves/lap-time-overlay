/**
 * @generated SignedSource<<cf0c74de121db3e9062b08b520dd0ff5>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type SiteHeaderLogoutMutation$variables = Record<PropertyKey, never>;
export type SiteHeaderLogoutMutation$data = {
  readonly logout: {
    readonly success: boolean;
  };
};
export type SiteHeaderLogoutMutation = {
  response: SiteHeaderLogoutMutation$data;
  variables: SiteHeaderLogoutMutation$variables;
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
    "name": "SiteHeaderLogoutMutation",
    "selections": (v0/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "SiteHeaderLogoutMutation",
    "selections": (v0/*: any*/)
  },
  "params": {
    "cacheID": "c51c567b7b7f031ddcb212675c5e65cc",
    "id": null,
    "metadata": {},
    "name": "SiteHeaderLogoutMutation",
    "operationKind": "mutation",
    "text": "mutation SiteHeaderLogoutMutation {\n  logout {\n    success\n  }\n}\n"
  }
};
})();

(node as any).hash = "85be10731a3dfdf4c3a63cd86d49df35";

export default node;
