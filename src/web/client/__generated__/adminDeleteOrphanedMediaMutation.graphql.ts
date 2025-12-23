/**
 * @generated SignedSource<<c9ce92a0a90d7361b1d81219f2fd82fe>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type DeleteOrphanedMediaInput = {
  mediaIds: ReadonlyArray<string>;
};
export type adminDeleteOrphanedMediaMutation$variables = {
  input: DeleteOrphanedMediaInput;
};
export type adminDeleteOrphanedMediaMutation$data = {
  readonly deleteOrphanedMedia: {
    readonly deleted: ReadonlyArray<string>;
  };
};
export type adminDeleteOrphanedMediaMutation = {
  response: adminDeleteOrphanedMediaMutation$data;
  variables: adminDeleteOrphanedMediaMutation$variables;
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
    "concreteType": "DeleteOrphanedMediaPayload",
    "kind": "LinkedField",
    "name": "deleteOrphanedMedia",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "deleted",
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
    "name": "adminDeleteOrphanedMediaMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "adminDeleteOrphanedMediaMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "6dd2e8435de5f29126c5c3cb4dd00e59",
    "id": null,
    "metadata": {},
    "name": "adminDeleteOrphanedMediaMutation",
    "operationKind": "mutation",
    "text": "mutation adminDeleteOrphanedMediaMutation(\n  $input: DeleteOrphanedMediaInput!\n) {\n  deleteOrphanedMedia(input: $input) {\n    deleted\n  }\n}\n"
  }
};
})();

(node as any).hash = "cfae57ac88b0fa4e5a1e77062075cfb4";

export default node;
