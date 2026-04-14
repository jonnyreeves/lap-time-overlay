/**
 * @generated SignedSource<<dc50afd20c9773bf86c0d1b4994ab2ac>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type DaytonaClubspeedBulkImportJobStatus = "COMPLETED" | "FAILED" | "QUEUED" | "RUNNING" | "%future added value";
export type DaytonaClubspeedBulkImportResultStatus = "CREATED" | "FAILED" | "SKIPPED" | "%future added value";
export type ImportSessionModalDaytonaBulkImportJobQuery$variables = {
  id: string;
};
export type ImportSessionModalDaytonaBulkImportJobQuery$data = {
  readonly daytonaClubspeedBulkImportJob: {
    readonly createdCount: number;
    readonly errorMessage: string | null | undefined;
    readonly failedCount: number;
    readonly id: string;
    readonly processedCount: number;
    readonly results: ReadonlyArray<{
      readonly errorMessage: string | null | undefined;
      readonly heatNo: string;
      readonly status: DaytonaClubspeedBulkImportResultStatus;
      readonly trackSession: {
        readonly date: string;
        readonly format: string;
        readonly id: string;
      } | null | undefined;
    }>;
    readonly skippedCount: number;
    readonly status: DaytonaClubspeedBulkImportJobStatus;
    readonly totalCount: number;
  } | null | undefined;
};
export type ImportSessionModalDaytonaBulkImportJobQuery = {
  response: ImportSessionModalDaytonaBulkImportJobQuery$data;
  variables: ImportSessionModalDaytonaBulkImportJobQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "id"
  }
],
v1 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "status",
  "storageKey": null
},
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "errorMessage",
  "storageKey": null
},
v4 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "id",
        "variableName": "id"
      }
    ],
    "concreteType": "DaytonaClubspeedBulkImportJob",
    "kind": "LinkedField",
    "name": "daytonaClubspeedBulkImportJob",
    "plural": false,
    "selections": [
      (v1/*: any*/),
      (v2/*: any*/),
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "totalCount",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "processedCount",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "createdCount",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "skippedCount",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "failedCount",
        "storageKey": null
      },
      (v3/*: any*/),
      {
        "alias": null,
        "args": null,
        "concreteType": "DaytonaClubspeedBulkImportResult",
        "kind": "LinkedField",
        "name": "results",
        "plural": true,
        "selections": [
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "heatNo",
            "storageKey": null
          },
          (v2/*: any*/),
          (v3/*: any*/),
          {
            "alias": null,
            "args": null,
            "concreteType": "TrackSession",
            "kind": "LinkedField",
            "name": "trackSession",
            "plural": false,
            "selections": [
              (v1/*: any*/),
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "date",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "format",
                "storageKey": null
              }
            ],
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
    "name": "ImportSessionModalDaytonaBulkImportJobQuery",
    "selections": (v4/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "ImportSessionModalDaytonaBulkImportJobQuery",
    "selections": (v4/*: any*/)
  },
  "params": {
    "cacheID": "1d0e696b76650a32637a29721aa38ade",
    "id": null,
    "metadata": {},
    "name": "ImportSessionModalDaytonaBulkImportJobQuery",
    "operationKind": "query",
    "text": "query ImportSessionModalDaytonaBulkImportJobQuery(\n  $id: ID!\n) {\n  daytonaClubspeedBulkImportJob(id: $id) {\n    id\n    status\n    totalCount\n    processedCount\n    createdCount\n    skippedCount\n    failedCount\n    errorMessage\n    results {\n      heatNo\n      status\n      errorMessage\n      trackSession {\n        id\n        date\n        format\n      }\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "a8462524bd32b28bc86fa3054dce9f96";

export default node;
