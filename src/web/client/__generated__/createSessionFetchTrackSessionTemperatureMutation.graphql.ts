/**
 * @generated SignedSource<<d4bc6a4b0bf4b7d56aea592edad1ae3a>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type FetchTrackSessionTemperatureInput = {
  date: string;
  trackId: string;
};
export type createSessionFetchTrackSessionTemperatureMutation$variables = {
  input: FetchTrackSessionTemperatureInput;
};
export type createSessionFetchTrackSessionTemperatureMutation$data = {
  readonly fetchTrackSessionTemperature: {
    readonly temperature: string | null | undefined;
  };
};
export type createSessionFetchTrackSessionTemperatureMutation = {
  response: createSessionFetchTrackSessionTemperatureMutation$data;
  variables: createSessionFetchTrackSessionTemperatureMutation$variables;
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
    "concreteType": "FetchTrackSessionTemperaturePayload",
    "kind": "LinkedField",
    "name": "fetchTrackSessionTemperature",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "temperature",
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
    "name": "createSessionFetchTrackSessionTemperatureMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "createSessionFetchTrackSessionTemperatureMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "9e21423ef76577ff3aa48cfdcd61e987",
    "id": null,
    "metadata": {},
    "name": "createSessionFetchTrackSessionTemperatureMutation",
    "operationKind": "mutation",
    "text": "mutation createSessionFetchTrackSessionTemperatureMutation(\n  $input: FetchTrackSessionTemperatureInput!\n) {\n  fetchTrackSessionTemperature(input: $input) {\n    temperature\n  }\n}\n"
  }
};
})();

(node as any).hash = "a900bb3ad46c8d8e52305810ec427ae3";

export default node;
