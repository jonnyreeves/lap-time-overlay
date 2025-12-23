/**
 * @generated SignedSource<<b3dad0ba6b02fd2601e3201c8266e40d>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type AdminTempDirName = "PREVIEWS" | "RENDERS" | "UPLOADS" | "%future added value";
export type EmptyTempDirInput = {
  name: AdminTempDirName;
};
export type adminEmptyTempDirMutation$variables = {
  input: EmptyTempDirInput;
};
export type adminEmptyTempDirMutation$data = {
  readonly emptyTempDir: {
    readonly name: AdminTempDirName;
  };
};
export type adminEmptyTempDirMutation = {
  response: adminEmptyTempDirMutation$data;
  variables: adminEmptyTempDirMutation$variables;
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
    "concreteType": "EmptyTempDirPayload",
    "kind": "LinkedField",
    "name": "emptyTempDir",
    "plural": false,
    "selections": [
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
    "name": "adminEmptyTempDirMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "adminEmptyTempDirMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "12ad527cb90b093ca8d11c2556faef6d",
    "id": null,
    "metadata": {},
    "name": "adminEmptyTempDirMutation",
    "operationKind": "mutation",
    "text": "mutation adminEmptyTempDirMutation(\n  $input: EmptyTempDirInput!\n) {\n  emptyTempDir(input: $input) {\n    name\n  }\n}\n"
  }
};
})();

(node as any).hash = "55b1b4a72af18c2ab707c9a650394224";

export default node;
