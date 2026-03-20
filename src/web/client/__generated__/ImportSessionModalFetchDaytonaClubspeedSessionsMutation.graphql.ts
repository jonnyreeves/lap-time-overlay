/**
 * @generated SignedSource<<a088dafb140eee63c2ecde7034ab9367>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type ImportSessionModalFetchDaytonaClubspeedSessionsMutation$variables = Record<PropertyKey, never>;
export type ImportSessionModalFetchDaytonaClubspeedSessionsMutation$data = {
  readonly fetchDaytonaClubspeedSessions: {
    readonly sessions: ReadonlyArray<{
      readonly activityType: string;
      readonly classification: number | null | undefined;
      readonly heatNo: string;
      readonly kartNumber: string | null | undefined;
      readonly sessionDate: string | null | undefined;
      readonly sessionTime: string | null | undefined;
    }>;
  };
};
export type ImportSessionModalFetchDaytonaClubspeedSessionsMutation = {
  response: ImportSessionModalFetchDaytonaClubspeedSessionsMutation$data;
  variables: ImportSessionModalFetchDaytonaClubspeedSessionsMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "alias": null,
    "args": null,
    "concreteType": "FetchDaytonaClubspeedSessionsPayload",
    "kind": "LinkedField",
    "name": "fetchDaytonaClubspeedSessions",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "DaytonaClubspeedSessionSummary",
        "kind": "LinkedField",
        "name": "sessions",
        "plural": true,
        "selections": [
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "heatNo",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "activityType",
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
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "kartNumber",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "classification",
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
    "name": "ImportSessionModalFetchDaytonaClubspeedSessionsMutation",
    "selections": (v0/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "ImportSessionModalFetchDaytonaClubspeedSessionsMutation",
    "selections": (v0/*: any*/)
  },
  "params": {
    "cacheID": "6945c102204cc8bb20dd3b35ede8aed6",
    "id": null,
    "metadata": {},
    "name": "ImportSessionModalFetchDaytonaClubspeedSessionsMutation",
    "operationKind": "mutation",
    "text": "mutation ImportSessionModalFetchDaytonaClubspeedSessionsMutation {\n  fetchDaytonaClubspeedSessions {\n    sessions {\n      heatNo\n      activityType\n      sessionDate\n      sessionTime\n      kartNumber\n      classification\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "6f03512f7d57d4a669fe913f844d2db9";

export default node;
