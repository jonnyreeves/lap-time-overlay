/**
 * @generated SignedSource<<01b6cf5ee8315abcb3c00b62e9c5cfd1>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type CircuitViewPageQuery$variables = {
  circuitId: string;
};
export type CircuitViewPageQuery$data = {
  readonly circuit: {
    readonly id: string;
    readonly name: string;
  } | null | undefined;
};
export type CircuitViewPageQuery = {
  response: CircuitViewPageQuery$data;
  variables: CircuitViewPageQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "circuitId"
  }
],
v1 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "id",
        "variableName": "circuitId"
      }
    ],
    "concreteType": "Circuit",
    "kind": "LinkedField",
    "name": "circuit",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "id",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "name",
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
    "name": "CircuitViewPageQuery",
    "selections": (v1/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "CircuitViewPageQuery",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "7b513df85d0bf68f64d08a712002452a",
    "id": null,
    "metadata": {},
    "name": "CircuitViewPageQuery",
    "operationKind": "query",
    "text": "query CircuitViewPageQuery(\n  $circuitId: ID!\n) {\n  circuit(id: $circuitId) {\n    id\n    name\n  }\n}\n"
  }
};
})();

(node as any).hash = "e0696c26f36dd4cf30357444edf35a7c";

export default node;
