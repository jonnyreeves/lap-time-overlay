/**
 * @generated SignedSource<<b61959a91b2ba6cb9a9626933ad1e72b>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type adminRebuildMediaLibraryProjectionAllMutation$variables = Record<PropertyKey, never>;
export type adminRebuildMediaLibraryProjectionAllMutation$data = {
  readonly rebuildMediaLibraryProjectionAll: {
    readonly rebuiltSessions: number;
  };
};
export type adminRebuildMediaLibraryProjectionAllMutation = {
  response: adminRebuildMediaLibraryProjectionAllMutation$data;
  variables: adminRebuildMediaLibraryProjectionAllMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "alias": null,
    "args": null,
    "concreteType": "RebuildMediaLibraryProjectionAllPayload",
    "kind": "LinkedField",
    "name": "rebuildMediaLibraryProjectionAll",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "rebuiltSessions",
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
    "name": "adminRebuildMediaLibraryProjectionAllMutation",
    "selections": (v0/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "adminRebuildMediaLibraryProjectionAllMutation",
    "selections": (v0/*: any*/)
  },
  "params": {
    "cacheID": "5512745c0a957eb2d5e27a1291b39bbd",
    "id": null,
    "metadata": {},
    "name": "adminRebuildMediaLibraryProjectionAllMutation",
    "operationKind": "mutation",
    "text": "mutation adminRebuildMediaLibraryProjectionAllMutation {\n  rebuildMediaLibraryProjectionAll {\n    rebuiltSessions\n  }\n}\n"
  }
};
})();

(node as any).hash = "b9dada85b085a2751b0c1fc4b3af70b1";

export default node;
