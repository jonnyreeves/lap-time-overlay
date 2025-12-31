/**
 * @generated SignedSource<<fa422cd929d434a1fe19567bab9f7b54>>
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
export type ImportSessionModalFetchTrackSessionWeatherMutation$variables = {
  input: FetchTrackSessionTemperatureInput;
};
export type ImportSessionModalFetchTrackSessionWeatherMutation$data = {
  readonly fetchTrackSessionTemperature: {
    readonly conditions: string | null | undefined;
    readonly temperature: string | null | undefined;
  };
};
export type ImportSessionModalFetchTrackSessionWeatherMutation = {
  response: ImportSessionModalFetchTrackSessionWeatherMutation$data;
  variables: ImportSessionModalFetchTrackSessionWeatherMutation$variables;
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
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "conditions",
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
    "name": "ImportSessionModalFetchTrackSessionWeatherMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "ImportSessionModalFetchTrackSessionWeatherMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "0653f8616542339e06e512d9c842f879",
    "id": null,
    "metadata": {},
    "name": "ImportSessionModalFetchTrackSessionWeatherMutation",
    "operationKind": "mutation",
    "text": "mutation ImportSessionModalFetchTrackSessionWeatherMutation(\n  $input: FetchTrackSessionTemperatureInput!\n) {\n  fetchTrackSessionTemperature(input: $input) {\n    temperature\n    conditions\n  }\n}\n"
  }
};
})();

(node as any).hash = "c4d9b07003643d415f6e56af76623f2d";

export default node;
