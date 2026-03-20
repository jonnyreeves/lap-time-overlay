/**
 * @generated SignedSource<<fa9e246950d939a2a41462a35d2ece41>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type SaveViewerDaytonaClubspeedCredentialsInput = {
  password: string;
  username: string;
};
export type profileSaveViewerDaytonaClubspeedCredentialsMutation$variables = {
  input: SaveViewerDaytonaClubspeedCredentialsInput;
};
export type profileSaveViewerDaytonaClubspeedCredentialsMutation$data = {
  readonly saveViewerDaytonaClubspeedCredentials: {
    readonly status: {
      readonly configured: boolean;
      readonly lastValidatedAt: string | null | undefined;
      readonly lastValidationError: string | null | undefined;
      readonly username: string | null | undefined;
    };
  };
};
export type profileSaveViewerDaytonaClubspeedCredentialsMutation = {
  response: profileSaveViewerDaytonaClubspeedCredentialsMutation$data;
  variables: profileSaveViewerDaytonaClubspeedCredentialsMutation$variables;
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
    "concreteType": "SaveViewerDaytonaClubspeedCredentialsPayload",
    "kind": "LinkedField",
    "name": "saveViewerDaytonaClubspeedCredentials",
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
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "profileSaveViewerDaytonaClubspeedCredentialsMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "profileSaveViewerDaytonaClubspeedCredentialsMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "5e979332275e2ca1b7ff9855fd6f0942",
    "id": null,
    "metadata": {},
    "name": "profileSaveViewerDaytonaClubspeedCredentialsMutation",
    "operationKind": "mutation",
    "text": "mutation profileSaveViewerDaytonaClubspeedCredentialsMutation(\n  $input: SaveViewerDaytonaClubspeedCredentialsInput!\n) {\n  saveViewerDaytonaClubspeedCredentials(input: $input) {\n    status {\n      configured\n      username\n      lastValidatedAt\n      lastValidationError\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "4daf36e2c5cda8af6fe85deb2663aaaa";

export default node;
