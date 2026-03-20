/**
 * @generated SignedSource<<8f31634d66eb8f90a83192a615848304>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type profileDeleteViewerDaytonaClubspeedCredentialsMutation$variables = Record<PropertyKey, never>;
export type profileDeleteViewerDaytonaClubspeedCredentialsMutation$data = {
  readonly deleteViewerDaytonaClubspeedCredentials: {
    readonly status: {
      readonly configured: boolean;
      readonly lastValidatedAt: string | null | undefined;
      readonly lastValidationError: string | null | undefined;
      readonly username: string | null | undefined;
    };
    readonly success: boolean;
  };
};
export type profileDeleteViewerDaytonaClubspeedCredentialsMutation = {
  response: profileDeleteViewerDaytonaClubspeedCredentialsMutation$data;
  variables: profileDeleteViewerDaytonaClubspeedCredentialsMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "alias": null,
    "args": null,
    "concreteType": "DeleteViewerDaytonaClubspeedCredentialsPayload",
    "kind": "LinkedField",
    "name": "deleteViewerDaytonaClubspeedCredentials",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "success",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "concreteType": "DaytonaClubspeedCredentialStatus",
        "kind": "LinkedField",
        "name": "status",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "configured",
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
    "name": "profileDeleteViewerDaytonaClubspeedCredentialsMutation",
    "selections": (v0/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "profileDeleteViewerDaytonaClubspeedCredentialsMutation",
    "selections": (v0/*: any*/)
  },
  "params": {
    "cacheID": "05ba0943e2273e58bc57c943da655064",
    "id": null,
    "metadata": {},
    "name": "profileDeleteViewerDaytonaClubspeedCredentialsMutation",
    "operationKind": "mutation",
    "text": "mutation profileDeleteViewerDaytonaClubspeedCredentialsMutation {\n  deleteViewerDaytonaClubspeedCredentials {\n    success\n    status {\n      configured\n      username\n      lastValidatedAt\n      lastValidationError\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "49abc7069171bd35478486ae88f71be2";

export default node;
