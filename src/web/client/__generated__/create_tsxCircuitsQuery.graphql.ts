/**
 * @generated SignedSource<<6247cda330ffd43bb337ba6a6f561096>>
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
    readonly karts: ReadonlyArray<{
      readonly id: string;
      readonly name: string;
    }>;
    readonly name: string;
  }>;
};
export type create_tsxCircuitsQuery = {
  response: create_tsxCircuitsQuery$data;
  variables: create_tsxCircuitsQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v1 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
},
v2 = [
  {
    "alias": null,
    "args": null,
    "concreteType": "Circuit",
    "kind": "LinkedField",
    "name": "circuits",
    "plural": true,
    "selections": [
      (v0/*: any*/),
      (v1/*: any*/),
      {
        "alias": null,
        "args": null,
        "concreteType": "Kart",
        "kind": "LinkedField",
        "name": "karts",
        "plural": true,
        "selections": [
          (v0/*: any*/),
          (v1/*: any*/)
        ],
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
    "selections": (v2/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "create_tsxCircuitsQuery",
    "selections": (v2/*: any*/)
  },
  "params": {
    "cacheID": "e493dcacb9cde4b1d01b4027c09cac4a",
    "id": null,
    "metadata": {},
    "name": "create_tsxCircuitsQuery",
    "operationKind": "query",
    "text": "query create_tsxCircuitsQuery {\n  circuits {\n    id\n    name\n    karts {\n      id\n      name\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "c9b6da573c6b940d797bfe5e8484b71c";

export default node;
