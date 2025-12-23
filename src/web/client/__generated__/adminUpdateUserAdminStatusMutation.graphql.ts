/**
 * @generated SignedSource<<51810ead39960d6ad21a487be22193fd>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type UpdateUserAdminStatusInput = {
  isAdmin: boolean;
  userId: string;
};
export type adminUpdateUserAdminStatusMutation$variables = {
  input: UpdateUserAdminStatusInput;
};
export type adminUpdateUserAdminStatusMutation$data = {
  readonly updateUserAdminStatus: {
    readonly user: {
      readonly createdAt: string;
      readonly id: string;
      readonly isAdmin: boolean;
      readonly username: string;
    };
  };
};
export type adminUpdateUserAdminStatusMutation = {
  response: adminUpdateUserAdminStatusMutation$data;
  variables: adminUpdateUserAdminStatusMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "input"
  }
],
v1 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "input",
        "variableName": "input"
      }
    ],
    "concreteType": "UpdateUserAdminStatusPayload",
    "kind": "LinkedField",
    "name": "updateUserAdminStatus",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "AdminUser",
        "kind": "LinkedField",
        "name": "user",
        "plural": false,
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
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "createdAt",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "isAdmin",
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
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "adminUpdateUserAdminStatusMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "adminUpdateUserAdminStatusMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "a4b17c0410320102426d0e81bdc9f784",
    "id": null,
    "metadata": {},
    "name": "adminUpdateUserAdminStatusMutation",
    "operationKind": "mutation",
    "text": "mutation adminUpdateUserAdminStatusMutation(\n  $input: UpdateUserAdminStatusInput!\n) {\n  updateUserAdminStatus(input: $input) {\n    user {\n      id\n      username\n      createdAt\n      isAdmin\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "a0a1df6a6735f029fd9beb2962255162";

export default node;
