/**
 * @generated SignedSource<<cbf527b75eec09317ef739f1d6e6a407>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type adminRebuildJellyfinProjectionAllMutation$variables = Record<PropertyKey, never>;
export type adminRebuildJellyfinProjectionAllMutation$data = {
  readonly rebuildJellyfinProjectionAll: {
    readonly rebuiltSessions: number;
  };
};
export type adminRebuildJellyfinProjectionAllMutation = {
  response: adminRebuildJellyfinProjectionAllMutation$data;
  variables: adminRebuildJellyfinProjectionAllMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "alias": null,
    "args": null,
    "concreteType": "RebuildJellyfinProjectionAllPayload",
    "kind": "LinkedField",
    "name": "rebuildJellyfinProjectionAll",
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
    "name": "adminRebuildJellyfinProjectionAllMutation",
    "selections": (v0/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "adminRebuildJellyfinProjectionAllMutation",
    "selections": (v0/*: any*/)
  },
  "params": {
    "cacheID": "bbb76aedb02044a947457b2b14f5cfcd",
    "id": null,
    "metadata": {},
    "name": "adminRebuildJellyfinProjectionAllMutation",
    "operationKind": "mutation",
    "text": "mutation adminRebuildJellyfinProjectionAllMutation {\n  rebuildJellyfinProjectionAll {\n    rebuiltSessions\n  }\n}\n"
  }
};
})();

(node as any).hash = "2a9412d5134bd3ef62ca3908371f6f99";

export default node;
