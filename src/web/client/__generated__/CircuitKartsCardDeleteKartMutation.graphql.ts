/**
 * @generated SignedSource<<42506b6109c6b10241547766358713bb>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type CircuitKartsCardDeleteKartMutation$variables = {
  id: string;
};
export type CircuitKartsCardDeleteKartMutation$data = {
  readonly deleteKart: {
    readonly success: boolean;
  };
};
export type CircuitKartsCardDeleteKartMutation = {
  response: CircuitKartsCardDeleteKartMutation$data;
  variables: CircuitKartsCardDeleteKartMutation$variables;
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
    "name": "CircuitKartsCardDeleteKartMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "CircuitKartsCardDeleteKartMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "400f4551320449b615f3d84506b2b14b",
    "id": null,
    "metadata": {},
    "name": "CircuitKartsCardDeleteKartMutation",
    "operationKind": "mutation",
    "text": "mutation CircuitKartsCardDeleteKartMutation(\n  $id: ID!\n) {\n  deleteKart(id: $id) {\n    success\n  }\n}\n"
  }
};
})();

(node as any).hash = "220cff190f8f3eff62e90d42aca334c9";

export default node;
