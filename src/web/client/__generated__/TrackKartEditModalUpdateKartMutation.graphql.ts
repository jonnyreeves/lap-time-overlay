/**
 * @generated SignedSource<<4579ace720b049011d7176360e8fd4c2>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type UpdateKartInput = {
  id: string;
  name: string;
};
export type TrackKartEditModalUpdateKartMutation$variables = {
  input: UpdateKartInput;
};
export type TrackKartEditModalUpdateKartMutation$data = {
  readonly updateKart: {
    readonly kart: {
      readonly id: string;
      readonly name: string;
    };
  };
};
export type TrackKartEditModalUpdateKartMutation = {
  response: TrackKartEditModalUpdateKartMutation$data;
  variables: TrackKartEditModalUpdateKartMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "input"
  }
],
v1 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "input",
        "variableName": "input"
      }
    ],
    "concreteType": "UpdateKartPayload",
    "kind": "LinkedField",
    "name": "updateKart",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "Kart",
        "kind": "LinkedField",
        "name": "kart",
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
    ],
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "TrackKartEditModalUpdateKartMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "TrackKartEditModalUpdateKartMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "5486f60568b442956aa54c50ed590add",
    "id": null,
    "metadata": {},
    "name": "TrackKartEditModalUpdateKartMutation",
    "operationKind": "mutation",
    "text": "mutation TrackKartEditModalUpdateKartMutation(\n  $input: UpdateKartInput!\n) {\n  updateKart(input: $input) {\n    kart {\n      id\n      name\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "9bd8c7127fe3a285d1b07197593c1024";

export default node;
