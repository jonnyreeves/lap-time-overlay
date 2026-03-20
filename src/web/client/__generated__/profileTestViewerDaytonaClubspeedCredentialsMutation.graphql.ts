/**
 * @generated SignedSource<<4aa487c1f5664de4166d1aaeff16edc5>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type profileTestViewerDaytonaClubspeedCredentialsMutation$variables = Record<PropertyKey, never>;
export type profileTestViewerDaytonaClubspeedCredentialsMutation$data = {
  readonly testViewerDaytonaClubspeedCredentials: {
    readonly status: {
      readonly configured: boolean;
      readonly lastValidatedAt: string | null | undefined;
      readonly lastValidationError: string | null | undefined;
      readonly username: string | null | undefined;
    };
  };
};
export type profileTestViewerDaytonaClubspeedCredentialsMutation = {
  response: profileTestViewerDaytonaClubspeedCredentialsMutation$data;
  variables: profileTestViewerDaytonaClubspeedCredentialsMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "alias": null,
    "args": null,
    "concreteType": "TestViewerDaytonaClubspeedCredentialsPayload",
    "kind": "LinkedField",
    "name": "testViewerDaytonaClubspeedCredentials",
    "plural": false,
    "selections": [
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
    "name": "profileTestViewerDaytonaClubspeedCredentialsMutation",
    "selections": (v0/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "profileTestViewerDaytonaClubspeedCredentialsMutation",
    "selections": (v0/*: any*/)
  },
  "params": {
    "cacheID": "8a5ede5f1c7fb1265e5ff6e574bf17a7",
    "id": null,
    "metadata": {},
    "name": "profileTestViewerDaytonaClubspeedCredentialsMutation",
    "operationKind": "mutation",
    "text": "mutation profileTestViewerDaytonaClubspeedCredentialsMutation {\n  testViewerDaytonaClubspeedCredentials {\n    status {\n      configured\n      username\n      lastValidatedAt\n      lastValidationError\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "6c6db0d85eb054428babd5e7f92ef5cb";

export default node;
