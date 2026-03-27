/**
 * @generated SignedSource<<8f144ee47ea02a9c8a9d3510d900f157>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type ImportTrackSessionFromUrlInput = {
  source: string;
};
export type ImportSessionModalImportTrackSessionFromUrlMutation$variables = {
  input: ImportTrackSessionFromUrlInput;
};
export type ImportSessionModalImportTrackSessionFromUrlMutation$data = {
  readonly importTrackSessionFromUrl: {
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
export type ImportSessionModalImportTrackSessionFromUrlMutation = {
  response: ImportSessionModalImportTrackSessionFromUrlMutation$data;
  variables: ImportSessionModalImportTrackSessionFromUrlMutation$variables;
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
    "name": "importTrackSessionFromUrl",
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
    "name": "ImportSessionModalImportTrackSessionFromUrlMutation",
    "selections": (v4/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "ImportSessionModalImportTrackSessionFromUrlMutation",
    "selections": (v4/*: any*/)
  },
  "params": {
    "cacheID": "c88cb315007aba6da27f48e966cf4b07",
    "id": null,
    "metadata": {},
    "name": "ImportSessionModalImportTrackSessionFromUrlMutation",
    "operationKind": "mutation",
    "text": "mutation ImportSessionModalImportTrackSessionFromUrlMutation(\n  $input: ImportTrackSessionFromUrlInput!\n) {\n  importTrackSessionFromUrl(input: $input) {\n    provider\n    sessionFormat\n    sessionDate\n    sessionTime\n    classification\n    sessionFastestLapSeconds\n    kartNumber\n    trackLayoutName\n    selfDriverName\n    kartTypeName\n    laps {\n      lapNumber\n      timeSeconds\n      displayTime\n      lapEvents {\n        offset\n        event\n        value\n      }\n    }\n    drivers {\n      name\n      classification\n      kartNumber\n      laps {\n        lapNumber\n        timeSeconds\n        displayTime\n        lapEvents {\n          offset\n          event\n          value\n        }\n      }\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "0dbebf32ff30cc85085bdaee7050c355";

export default node;
