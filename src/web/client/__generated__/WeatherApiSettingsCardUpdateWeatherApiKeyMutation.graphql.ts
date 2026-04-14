/**
 * @generated SignedSource<<10d9962c499cba56d820bfedf0ec64d1>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type UpdateWeatherApiKeyInput = {
  apiKey: string;
};
export type WeatherApiSettingsCardUpdateWeatherApiKeyMutation$variables = {
  input: UpdateWeatherApiKeyInput;
};
export type WeatherApiSettingsCardUpdateWeatherApiKeyMutation$data = {
  readonly updateWeatherApiKey: {
    readonly settings: {
      readonly configured: boolean;
      readonly updatedAt: string | null | undefined;
    };
  };
};
export type WeatherApiSettingsCardUpdateWeatherApiKeyMutation = {
  response: WeatherApiSettingsCardUpdateWeatherApiKeyMutation$data;
  variables: WeatherApiSettingsCardUpdateWeatherApiKeyMutation$variables;
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
    "concreteType": "UpdateWeatherApiKeyPayload",
    "kind": "LinkedField",
    "name": "updateWeatherApiKey",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "AdminWeatherApiSettings",
        "kind": "LinkedField",
        "name": "settings",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "configured",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "updatedAt",
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
    "name": "WeatherApiSettingsCardUpdateWeatherApiKeyMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "WeatherApiSettingsCardUpdateWeatherApiKeyMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "6dc7364942100a7ea5deea5ee6acdbb3",
    "id": null,
    "metadata": {},
    "name": "WeatherApiSettingsCardUpdateWeatherApiKeyMutation",
    "operationKind": "mutation",
    "text": "mutation WeatherApiSettingsCardUpdateWeatherApiKeyMutation(\n  $input: UpdateWeatherApiKeyInput!\n) {\n  updateWeatherApiKey(input: $input) {\n    settings {\n      configured\n      updatedAt\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "23d5232bfe703164bd12abf08d67e179";

export default node;
