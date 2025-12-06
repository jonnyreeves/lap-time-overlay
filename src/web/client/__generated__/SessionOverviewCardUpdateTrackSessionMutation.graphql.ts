/**
 * @generated SignedSource<<b4d6935a1c5f1c268823a29f33cc4858>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type UpdateTrackSessionInput = {
  circuitId?: string | null | undefined;
  classification?: number | null | undefined;
  conditions?: string | null | undefined;
  date?: string | null | undefined;
  format?: string | null | undefined;
  id: string;
  notes?: string | null | undefined;
};
export type SessionOverviewCardUpdateTrackSessionMutation$variables = {
  input: UpdateTrackSessionInput;
};
export type SessionOverviewCardUpdateTrackSessionMutation$data = {
  readonly updateTrackSession: {
    readonly trackSession: {
      readonly circuit: {
        readonly id: string;
        readonly name: string;
      };
      readonly classification: number;
      readonly conditions: string;
      readonly date: string;
      readonly format: string;
      readonly id: string;
      readonly notes: string | null | undefined;
      readonly updatedAt: string;
    };
  };
};
export type SessionOverviewCardUpdateTrackSessionMutation = {
  response: SessionOverviewCardUpdateTrackSessionMutation$data;
  variables: SessionOverviewCardUpdateTrackSessionMutation$variables;
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
v2 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "input",
        "variableName": "input"
      }
    ],
    "concreteType": "UpdateTrackSessionPayload",
    "kind": "LinkedField",
    "name": "updateTrackSession",
    "plural": false,
    "selections": [
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
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "classification",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "conditions",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "notes",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "Circuit",
            "kind": "LinkedField",
            "name": "circuit",
            "plural": false,
            "selections": [
              (v1/*: any*/),
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "name",
                "storageKey": null
              }
            ],
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
    "name": "SessionOverviewCardUpdateTrackSessionMutation",
    "selections": (v2/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "SessionOverviewCardUpdateTrackSessionMutation",
    "selections": (v2/*: any*/)
  },
  "params": {
    "cacheID": "6185858ddfbb8e9eff1278911433503d",
    "id": null,
    "metadata": {},
    "name": "SessionOverviewCardUpdateTrackSessionMutation",
    "operationKind": "mutation",
    "text": "mutation SessionOverviewCardUpdateTrackSessionMutation(\n  $input: UpdateTrackSessionInput!\n) {\n  updateTrackSession(input: $input) {\n    trackSession {\n      id\n      date\n      format\n      classification\n      conditions\n      notes\n      circuit {\n        id\n        name\n      }\n      updatedAt\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "3f1d808323f5e2ae35b655171b1028bd";

export default node;
