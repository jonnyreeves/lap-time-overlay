/**
 * @generated SignedSource<<967ba1b9ec5eca7a83b134bf33ddbda1>>
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
export type SessionOverviewCardFetchTrackSessionTemperatureMutation$variables = {
  input: FetchTrackSessionTemperatureInput;
};
export type SessionOverviewCardFetchTrackSessionTemperatureMutation$data = {
  readonly fetchTrackSessionTemperature: {
    readonly temperature: string | null | undefined;
  };
};
export type SessionOverviewCardFetchTrackSessionTemperatureMutation = {
  response: SessionOverviewCardFetchTrackSessionTemperatureMutation$data;
  variables: SessionOverviewCardFetchTrackSessionTemperatureMutation$variables;
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
    "name": "SessionOverviewCardFetchTrackSessionTemperatureMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "SessionOverviewCardFetchTrackSessionTemperatureMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "d5885b0fe245ae9930c9386ea9e70cbe",
    "id": null,
    "metadata": {},
    "name": "SessionOverviewCardFetchTrackSessionTemperatureMutation",
    "operationKind": "mutation",
    "text": "mutation SessionOverviewCardFetchTrackSessionTemperatureMutation(\n  $input: FetchTrackSessionTemperatureInput!\n) {\n  fetchTrackSessionTemperature(input: $input) {\n    temperature\n  }\n}\n"
  }
};
})();

(node as any).hash = "cc73825e7c49be9ae7d4c8a6fd5afc0c";

export default node;
