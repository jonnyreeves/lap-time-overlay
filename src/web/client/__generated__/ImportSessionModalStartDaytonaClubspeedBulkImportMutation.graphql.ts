/**
 * @generated SignedSource<<133fc2c186a78870c943a9eb65d556cc>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type DaytonaClubspeedBulkImportJobStatus = "COMPLETED" | "FAILED" | "QUEUED" | "RUNNING" | "%future added value";
export type DaytonaClubspeedBulkImportResultStatus = "CREATED" | "FAILED" | "SKIPPED" | "%future added value";
export type StartDaytonaClubspeedBulkImportInput = {
  sessions: ReadonlyArray<DaytonaClubspeedBulkImportSessionInput>;
};
export type DaytonaClubspeedBulkImportSessionInput = {
  heatNo: string;
  kartId: string;
  trackId: string;
  trackLayoutId: string;
};
export type ImportSessionModalStartDaytonaClubspeedBulkImportMutation$variables = {
  input: StartDaytonaClubspeedBulkImportInput;
};
export type ImportSessionModalStartDaytonaClubspeedBulkImportMutation$data = {
  readonly startDaytonaClubspeedBulkImport: {
    readonly job: {
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
    };
  };
};
export type ImportSessionModalStartDaytonaClubspeedBulkImportMutation = {
  response: ImportSessionModalStartDaytonaClubspeedBulkImportMutation$data;
  variables: ImportSessionModalStartDaytonaClubspeedBulkImportMutation$variables;
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
        "name": "input",
        "variableName": "input"
      }
    ],
    "concreteType": "StartDaytonaClubspeedBulkImportPayload",
    "kind": "LinkedField",
    "name": "startDaytonaClubspeedBulkImport",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "DaytonaClubspeedBulkImportJob",
        "kind": "LinkedField",
        "name": "job",
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
    ],
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "ImportSessionModalStartDaytonaClubspeedBulkImportMutation",
    "selections": (v4/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "ImportSessionModalStartDaytonaClubspeedBulkImportMutation",
    "selections": (v4/*: any*/)
  },
  "params": {
    "cacheID": "09b3ff63505dd2b6b934886b8cf867f5",
    "id": null,
    "metadata": {},
    "name": "ImportSessionModalStartDaytonaClubspeedBulkImportMutation",
    "operationKind": "mutation",
    "text": "mutation ImportSessionModalStartDaytonaClubspeedBulkImportMutation(\n  $input: StartDaytonaClubspeedBulkImportInput!\n) {\n  startDaytonaClubspeedBulkImport(input: $input) {\n    job {\n      id\n      status\n      totalCount\n      processedCount\n      createdCount\n      skippedCount\n      failedCount\n      errorMessage\n      results {\n        heatNo\n        status\n        errorMessage\n        trackSession {\n          id\n          date\n          format\n        }\n      }\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "02358bab69c16f01ef3f62c07b268333";

export default node;
