/**
 * @generated SignedSource<<a7c2331cd0233146517dba5d4f16ad3b>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type create_tsxCircuitsQuery$variables = Record<PropertyKey, never>;
export type create_tsxCircuitsQuery$data = {
  readonly circuits: ReadonlyArray<{
    readonly id: string;
    readonly name: string;
  }>;
};
export type create_tsxCircuitsQuery = {
  response: create_tsxCircuitsQuery$data;
  variables: create_tsxCircuitsQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "alias": null,
    "args": null,
    "concreteType": "Circuit",
    "kind": "LinkedField",
    "name": "circuits",
    "plural": true,
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
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": null,
    "name": "create_tsxCircuitsQuery",
    "selections": (v0/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "create_tsxCircuitsQuery",
    "selections": (v0/*: any*/)
  },
  "params": {
    "cacheID": "a271b1f240aae5464a2adb3e4539d894",
    "id": null,
    "metadata": {},
    "name": "create_tsxCircuitsQuery",
    "operationKind": "query",
    "text": "query create_tsxCircuitsQuery {\n  circuits {\n    id\n    name\n  }\n}\n"
  }
};
})();

(node as any).hash = "3b816087f5f9b67c9c4d4747b53f0479";

export default node;
