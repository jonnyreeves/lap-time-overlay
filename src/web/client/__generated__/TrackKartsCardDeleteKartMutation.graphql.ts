/**
 * @generated SignedSource<<9493ddaa769a2f439d9f5cf767a71896>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type TrackKartsCardDeleteKartMutation$variables = {
  id: string;
};
export type TrackKartsCardDeleteKartMutation$data = {
  readonly deleteKart: {
    readonly success: boolean;
  };
};
export type TrackKartsCardDeleteKartMutation = {
  response: TrackKartsCardDeleteKartMutation$data;
  variables: TrackKartsCardDeleteKartMutation$variables;
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
    "concreteType": "DeleteKartPayload",
    "kind": "LinkedField",
    "name": "deleteKart",
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
    "name": "TrackKartsCardDeleteKartMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "TrackKartsCardDeleteKartMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "0306c1bb9e854c1969ca923f01d4b816",
    "id": null,
    "metadata": {},
    "name": "TrackKartsCardDeleteKartMutation",
    "operationKind": "mutation",
    "text": "mutation TrackKartsCardDeleteKartMutation(\n  $id: ID!\n) {\n  deleteKart(id: $id) {\n    success\n  }\n}\n"
  }
};
})();

(node as any).hash = "c2e70fdbd00363771af6c73c8b649240";

export default node;
