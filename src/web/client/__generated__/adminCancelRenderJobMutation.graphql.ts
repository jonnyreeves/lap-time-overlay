/**
 * @generated SignedSource<<04c4ea37ff565b3302223a6c6dfe8794>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type adminCancelRenderJobMutation$variables = {
  recordingId: string;
};
export type adminCancelRenderJobMutation$data = {
  readonly cancelRenderJob: {
    readonly success: boolean;
  };
};
export type adminCancelRenderJobMutation = {
  response: adminCancelRenderJobMutation$data;
  variables: adminCancelRenderJobMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "recordingId"
  }
],
v1 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "recordingId",
        "variableName": "recordingId"
      }
    ],
    "concreteType": "CancelRenderJobPayload",
    "kind": "LinkedField",
    "name": "cancelRenderJob",
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
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "adminCancelRenderJobMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "adminCancelRenderJobMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "0975897992f8e75b41c9864dd82afce8",
    "id": null,
    "metadata": {},
    "name": "adminCancelRenderJobMutation",
    "operationKind": "mutation",
    "text": "mutation adminCancelRenderJobMutation(\n  $recordingId: ID!\n) {\n  cancelRenderJob(recordingId: $recordingId) {\n    success\n  }\n}\n"
  }
};
})();

(node as any).hash = "fd1a07664307b4a7a9991c1a792612bd";

export default node;
