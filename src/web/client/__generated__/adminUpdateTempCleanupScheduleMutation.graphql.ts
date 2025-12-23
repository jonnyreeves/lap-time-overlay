/**
 * @generated SignedSource<<2975d64de401a4adbb06362630ef1694>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type UpdateTempCleanupScheduleInput = {
  days: ReadonlyArray<number>;
  hour: number;
};
export type adminUpdateTempCleanupScheduleMutation$variables = {
  input: UpdateTempCleanupScheduleInput;
};
export type adminUpdateTempCleanupScheduleMutation$data = {
  readonly updateTempCleanupSchedule: {
    readonly schedule: {
      readonly days: ReadonlyArray<number>;
      readonly enabled: boolean;
      readonly hour: number;
      readonly lastRunAt: string | null | undefined;
      readonly nextRunAt: string | null | undefined;
    };
  };
};
export type adminUpdateTempCleanupScheduleMutation = {
  response: adminUpdateTempCleanupScheduleMutation$data;
  variables: adminUpdateTempCleanupScheduleMutation$variables;
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
    "concreteType": "UpdateTempCleanupSchedulePayload",
    "kind": "LinkedField",
    "name": "updateTempCleanupSchedule",
    "plural": false,
    "selections": [
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
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "adminUpdateTempCleanupScheduleMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "adminUpdateTempCleanupScheduleMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "fad27ff9779d2c364d8a2ef3e7c689c5",
    "id": null,
    "metadata": {},
    "name": "adminUpdateTempCleanupScheduleMutation",
    "operationKind": "mutation",
    "text": "mutation adminUpdateTempCleanupScheduleMutation(\n  $input: UpdateTempCleanupScheduleInput!\n) {\n  updateTempCleanupSchedule(input: $input) {\n    schedule {\n      hour\n      days\n      enabled\n      lastRunAt\n      nextRunAt\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "adc134742d949b22f2435a881ded9155";

export default node;
