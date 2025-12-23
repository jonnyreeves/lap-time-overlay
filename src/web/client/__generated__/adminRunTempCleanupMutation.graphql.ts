/**
 * @generated SignedSource<<c5bb5ddd7ba954e5928bc2b648ce6d89>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type adminRunTempCleanupMutation$variables = Record<PropertyKey, never>;
export type adminRunTempCleanupMutation$data = {
  readonly runTempCleanup: {
    readonly schedule: {
      readonly days: ReadonlyArray<number>;
      readonly enabled: boolean;
      readonly hour: number;
      readonly lastRunAt: string | null | undefined;
      readonly nextRunAt: string | null | undefined;
    };
    readonly started: boolean;
  };
};
export type adminRunTempCleanupMutation = {
  response: adminRunTempCleanupMutation$data;
  variables: adminRunTempCleanupMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "alias": null,
    "args": null,
    "concreteType": "RunTempCleanupPayload",
    "kind": "LinkedField",
    "name": "runTempCleanup",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "started",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "concreteType": "TempCleanupSchedule",
        "kind": "LinkedField",
        "name": "schedule",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "hour",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "days",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "enabled",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "lastRunAt",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "nextRunAt",
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
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": null,
    "name": "adminRunTempCleanupMutation",
    "selections": (v0/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "adminRunTempCleanupMutation",
    "selections": (v0/*: any*/)
  },
  "params": {
    "cacheID": "9dd209cd3400aafcddc8d533f12123f0",
    "id": null,
    "metadata": {},
    "name": "adminRunTempCleanupMutation",
    "operationKind": "mutation",
    "text": "mutation adminRunTempCleanupMutation {\n  runTempCleanup {\n    started\n    schedule {\n      hour\n      days\n      enabled\n      lastRunAt\n      nextRunAt\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "a344e4d459408ac8de5e757af84f1805";

export default node;
