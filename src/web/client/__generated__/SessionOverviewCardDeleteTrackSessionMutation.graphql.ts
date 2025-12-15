/**
 * @generated SignedSource<<67c7cabec2c2c045df10327272fdff63>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type SessionOverviewCardDeleteTrackSessionMutation$variables = {
  id: string;
};
export type SessionOverviewCardDeleteTrackSessionMutation$data = {
  readonly deleteTrackSession: {
    readonly success: boolean;
  };
};
export type SessionOverviewCardDeleteTrackSessionMutation = {
  response: SessionOverviewCardDeleteTrackSessionMutation$data;
  variables: SessionOverviewCardDeleteTrackSessionMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "id"
  }
],
v1 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "id",
        "variableName": "id"
      }
    ],
    "concreteType": "DeleteTrackSessionPayload",
    "kind": "LinkedField",
    "name": "deleteTrackSession",
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
    "name": "SessionOverviewCardDeleteTrackSessionMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "SessionOverviewCardDeleteTrackSessionMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "0c8df48768d69eec8f640af6062c0cb9",
    "id": null,
    "metadata": {},
    "name": "SessionOverviewCardDeleteTrackSessionMutation",
    "operationKind": "mutation",
    "text": "mutation SessionOverviewCardDeleteTrackSessionMutation(\n  $id: ID!\n) {\n  deleteTrackSession(id: $id) {\n    success\n  }\n}\n"
  }
};
})();

(node as any).hash = "8d551fc06b98273d6cc0d303c10fb185";

export default node;
