/**
 * @generated SignedSource<<95a08dbc0d954ab19fba3d7b487d437c>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type CircuitViewPageQuery$variables = {
  circuitId: string;
};
export type CircuitViewPageQuery$data = {
  readonly track: {
    readonly id: string;
    readonly name: string;
    readonly " $fragmentSpreads": FragmentRefs<"CircuitKartsCard_circuit">;
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
    "kind": "Variable",
    "name": "id",
    "variableName": "circuitId"
  }
],
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
};
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "CircuitViewPageQuery",
    "selections": [
      {
        "alias": "track",
        "args": (v1/*: any*/),
        "concreteType": "Circuit",
        "kind": "LinkedField",
        "name": "circuit",
        "plural": false,
        "selections": [
          (v2/*: any*/),
          (v3/*: any*/),
          {
            "args": null,
            "kind": "FragmentSpread",
            "name": "CircuitKartsCard_circuit"
          }
        ],
        "storageKey": null
      }
    ],
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "CircuitViewPageQuery",
    "selections": [
      {
        "alias": "track",
        "args": (v1/*: any*/),
        "concreteType": "Circuit",
        "kind": "LinkedField",
        "name": "circuit",
        "plural": false,
        "selections": [
          (v2/*: any*/),
          (v3/*: any*/),
          {
            "alias": null,
            "args": null,
            "concreteType": "Kart",
            "kind": "LinkedField",
            "name": "karts",
            "plural": true,
            "selections": [
              (v2/*: any*/),
              (v3/*: any*/)
            ],
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "2728c921f0aa5f3efc0731c37ae51bbe",
    "id": null,
    "metadata": {},
    "name": "CircuitViewPageQuery",
    "operationKind": "query",
    "text": "query CircuitViewPageQuery(\n  $circuitId: ID!\n) {\n  track: circuit(id: $circuitId) {\n    id\n    name\n    ...CircuitKartsCard_circuit\n  }\n}\n\nfragment CircuitKartsCard_circuit on Circuit {\n  id\n  name\n  karts {\n    id\n    name\n  }\n}\n"
  }
};
})();

(node as any).hash = "86fda8aa7149ad039554233fe13bd91c";

export default node;
