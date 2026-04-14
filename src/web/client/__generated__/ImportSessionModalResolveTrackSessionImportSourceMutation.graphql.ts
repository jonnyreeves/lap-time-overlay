/**
 * @generated SignedSource<<fbb779777c50482dc564d8abe7cba0ee>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type ResolveTrackSessionImportSourceInput = {
  source: string;
};
export type ImportSessionModalResolveTrackSessionImportSourceMutation$variables = {
  input: ResolveTrackSessionImportSourceInput;
};
export type ImportSessionModalResolveTrackSessionImportSourceMutation$data = {
  readonly resolveTrackSessionImportSource: {
    readonly alphaTimingSessions: ReadonlyArray<{
      readonly sessionDate: string | null | undefined;
      readonly sessionTime: string | null | undefined;
      readonly sessionUrl: string;
      readonly title: string | null | undefined;
    }>;
    readonly provider: string;
    readonly sessionUrl: string | null | undefined;
  };
};
export type ImportSessionModalResolveTrackSessionImportSourceMutation = {
  response: ImportSessionModalResolveTrackSessionImportSourceMutation$data;
  variables: ImportSessionModalResolveTrackSessionImportSourceMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "input"
  }
],
v1 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "sessionUrl",
  "storageKey": null
},
v2 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "input",
        "variableName": "input"
      }
    ],
    "concreteType": "ResolveTrackSessionImportSourcePayload",
    "kind": "LinkedField",
    "name": "resolveTrackSessionImportSource",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "provider",
        "storageKey": null
      },
      (v1/*: any*/),
      {
        "alias": null,
        "args": null,
        "concreteType": "AlphaTimingSessionOption",
        "kind": "LinkedField",
        "name": "alphaTimingSessions",
        "plural": true,
        "selections": [
          (v1/*: any*/),
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "title",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "sessionDate",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "sessionTime",
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
    "name": "ImportSessionModalResolveTrackSessionImportSourceMutation",
    "selections": (v2/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "ImportSessionModalResolveTrackSessionImportSourceMutation",
    "selections": (v2/*: any*/)
  },
  "params": {
    "cacheID": "4e40a44a5a935b7c59e5b0f85ed442bc",
    "id": null,
    "metadata": {},
    "name": "ImportSessionModalResolveTrackSessionImportSourceMutation",
    "operationKind": "mutation",
    "text": "mutation ImportSessionModalResolveTrackSessionImportSourceMutation(\n  $input: ResolveTrackSessionImportSourceInput!\n) {\n  resolveTrackSessionImportSource(input: $input) {\n    provider\n    sessionUrl\n    alphaTimingSessions {\n      sessionUrl\n      title\n      sessionDate\n      sessionTime\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "fc8254fb15b839c16c748ace8ff94efb";

export default node;
