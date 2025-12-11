/**
 * @generated SignedSource<<6b95b0189b246095b9b64a70216daec9>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type CreateKartInput = {
  name: string;
};
export type TrackKartEditModalCreateKartMutation$variables = {
  input: CreateKartInput;
};
export type TrackKartEditModalCreateKartMutation$data = {
  readonly createKart: {
    readonly kart: {
      readonly id: string;
      readonly name: string;
    };
  };
};
export type TrackKartEditModalCreateKartMutation = {
  response: TrackKartEditModalCreateKartMutation$data;
  variables: TrackKartEditModalCreateKartMutation$variables;
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
    "concreteType": "CreateKartPayload",
    "kind": "LinkedField",
    "name": "createKart",
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
    "name": "TrackKartEditModalCreateKartMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "TrackKartEditModalCreateKartMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "e833ea6e6018749e97ff70a422c0522c",
    "id": null,
    "metadata": {},
    "name": "TrackKartEditModalCreateKartMutation",
    "operationKind": "mutation",
    "text": "mutation TrackKartEditModalCreateKartMutation(\n  $input: CreateKartInput!\n) {\n  createKart(input: $input) {\n    kart {\n      id\n      name\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "e6339e73bf4c907771793df1f8dacd06";

export default node;
