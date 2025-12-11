/**
 * @generated SignedSource<<b1a202f80ae31df03ce6c612a80056d8>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type CreateCircuitInput = {
  heroImage?: string | null | undefined;
  karts: ReadonlyArray<CreateKartInput>;
  name: string;
};
export type CreateKartInput = {
  name: string;
};
export type CreateCircuitModalCreateCircuitMutation$variables = {
  input: CreateCircuitInput;
};
export type CreateCircuitModalCreateCircuitMutation$data = {
  readonly createCircuit: {
    readonly circuit: {
      readonly heroImage: string | null | undefined;
      readonly id: string;
      readonly karts: ReadonlyArray<{
        readonly id: string;
        readonly name: string;
      }>;
      readonly name: string;
    };
  };
};
export type CreateCircuitModalCreateCircuitMutation = {
  response: CreateCircuitModalCreateCircuitMutation$data;
  variables: CreateCircuitModalCreateCircuitMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "input"
  }
],
v1 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
},
v3 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "input",
        "variableName": "input"
      }
    ],
    "concreteType": "CreateCircuitPayload",
    "kind": "LinkedField",
    "name": "createCircuit",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "Circuit",
        "kind": "LinkedField",
        "name": "circuit",
        "plural": false,
        "selections": [
          (v1/*: any*/),
          (v2/*: any*/),
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "heroImage",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "Kart",
            "kind": "LinkedField",
            "name": "karts",
            "plural": true,
            "selections": [
              (v1/*: any*/),
              (v2/*: any*/)
            ],
            "storageKey": null
          }
        ],
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
    "name": "CreateCircuitModalCreateCircuitMutation",
    "selections": (v3/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "CreateCircuitModalCreateCircuitMutation",
    "selections": (v3/*: any*/)
  },
  "params": {
    "cacheID": "d182083398649ceb81b7f00b91c1296a",
    "id": null,
    "metadata": {},
    "name": "CreateCircuitModalCreateCircuitMutation",
    "operationKind": "mutation",
    "text": "mutation CreateCircuitModalCreateCircuitMutation(\n  $input: CreateCircuitInput!\n) {\n  createCircuit(input: $input) {\n    circuit {\n      id\n      name\n      heroImage\n      karts {\n        id\n        name\n      }\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "ba1082d55c7e6ff318c961459c7c1d72";

export default node;
