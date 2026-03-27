/**
 * @generated SignedSource<<12512a38ab70206280b75a18d3ea3471>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type ImportDaytonaClubspeedSessionInput = {
  heatNo: string;
};
export type ImportSessionModalImportDaytonaClubspeedSessionMutation$variables = {
  input: ImportDaytonaClubspeedSessionInput;
};
export type ImportSessionModalImportDaytonaClubspeedSessionMutation$data = {
  readonly importDaytonaClubspeedSession: {
    readonly classification: number | null | undefined;
    readonly drivers: ReadonlyArray<{
      readonly classification: number | null | undefined;
      readonly kartNumber: string | null | undefined;
      readonly laps: ReadonlyArray<{
        readonly displayTime: string;
        readonly lapEvents: ReadonlyArray<{
          readonly event: string;
          readonly offset: number;
          readonly value: string;
        }>;
        readonly lapNumber: number;
        readonly timeSeconds: number;
      }>;
      readonly name: string;
    }>;
    readonly kartNumber: string | null | undefined;
    readonly kartTypeName: string | null | undefined;
    readonly laps: ReadonlyArray<{
      readonly displayTime: string;
      readonly lapEvents: ReadonlyArray<{
        readonly event: string;
        readonly offset: number;
        readonly value: string;
      }>;
      readonly lapNumber: number;
      readonly timeSeconds: number;
    }>;
    readonly provider: string;
    readonly selfDriverName: string | null | undefined;
    readonly sessionDate: string | null | undefined;
    readonly sessionFastestLapSeconds: number | null | undefined;
    readonly sessionFormat: string | null | undefined;
    readonly sessionTime: string | null | undefined;
    readonly trackLayoutName: string | null | undefined;
  };
};
export type ImportSessionModalImportDaytonaClubspeedSessionMutation = {
  response: ImportSessionModalImportDaytonaClubspeedSessionMutation$data;
  variables: ImportSessionModalImportDaytonaClubspeedSessionMutation$variables;
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
  "name": "classification",
  "storageKey": null
},
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "kartNumber",
  "storageKey": null
},
v3 = {
  "alias": null,
  "args": null,
  "concreteType": "ImportedSessionLap",
  "kind": "LinkedField",
  "name": "laps",
  "plural": true,
  "selections": [
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "lapNumber",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "timeSeconds",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "displayTime",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "concreteType": "ImportedSessionLapEvent",
      "kind": "LinkedField",
      "name": "lapEvents",
      "plural": true,
      "selections": [
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "offset",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "event",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "value",
          "storageKey": null
        }
      ],
      "storageKey": null
    }
  ],
  "storageKey": null
},
v4 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "input",
        "variableName": "input"
      }
    ],
    "concreteType": "ImportTrackSessionFromUrlPayload",
    "kind": "LinkedField",
    "name": "importDaytonaClubspeedSession",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "provider",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "sessionFormat",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "sessionDate",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "sessionTime",
        "storageKey": null
      },
      (v1/*: any*/),
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "sessionFastestLapSeconds",
        "storageKey": null
      },
      (v2/*: any*/),
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "trackLayoutName",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "selfDriverName",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "kartTypeName",
        "storageKey": null
      },
      (v3/*: any*/),
      {
        "alias": null,
        "args": null,
        "concreteType": "ImportedSessionDriver",
        "kind": "LinkedField",
        "name": "drivers",
        "plural": true,
        "selections": [
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "name",
            "storageKey": null
          },
          (v1/*: any*/),
          (v2/*: any*/),
          (v3/*: any*/)
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
    "name": "ImportSessionModalImportDaytonaClubspeedSessionMutation",
    "selections": (v4/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "ImportSessionModalImportDaytonaClubspeedSessionMutation",
    "selections": (v4/*: any*/)
  },
  "params": {
    "cacheID": "fb69589a7e8d461ca86c80d257ae5837",
    "id": null,
    "metadata": {},
    "name": "ImportSessionModalImportDaytonaClubspeedSessionMutation",
    "operationKind": "mutation",
    "text": "mutation ImportSessionModalImportDaytonaClubspeedSessionMutation(\n  $input: ImportDaytonaClubspeedSessionInput!\n) {\n  importDaytonaClubspeedSession(input: $input) {\n    provider\n    sessionFormat\n    sessionDate\n    sessionTime\n    classification\n    sessionFastestLapSeconds\n    kartNumber\n    trackLayoutName\n    selfDriverName\n    kartTypeName\n    laps {\n      lapNumber\n      timeSeconds\n      displayTime\n      lapEvents {\n        offset\n        event\n        value\n      }\n    }\n    drivers {\n      name\n      classification\n      kartNumber\n      laps {\n        lapNumber\n        timeSeconds\n        displayTime\n        lapEvents {\n          offset\n          event\n          value\n        }\n      }\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "3a2492e3a6b34b3f532c29731645e39d";

export default node;
