/**
 * @generated SignedSource<<a4c6b81bd7a4f8c03d74a453d706f94e>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type UpdateTrackSessionInput = {
  classification?: number | null | undefined;
  conditions?: string | null | undefined;
  date?: string | null | undefined;
  fastestLap?: number | null | undefined;
  format?: string | null | undefined;
  id: string;
  kartId?: string | null | undefined;
  kartNumber?: string | null | undefined;
  notes?: string | null | undefined;
  trackId?: string | null | undefined;
  trackLayoutId?: string | null | undefined;
};
export type SessionOverviewCardUpdateTrackSessionMutation$variables = {
  input: UpdateTrackSessionInput;
};
export type SessionOverviewCardUpdateTrackSessionMutation$data = {
  readonly updateTrackSession: {
    readonly trackSession: {
      readonly classification: number;
      readonly conditions: string;
      readonly date: string;
      readonly fastestLap: number | null | undefined;
      readonly format: string;
      readonly id: string;
      readonly kart: {
        readonly id: string;
        readonly name: string;
      } | null | undefined;
      readonly kartNumber: string | null | undefined;
      readonly notes: string | null | undefined;
      readonly track: {
        readonly id: string;
        readonly name: string;
      };
      readonly trackLayout: {
        readonly id: string;
        readonly name: string;
      };
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
  (v1/*: any*/),
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "name",
    "storageKey": null
  }
],
v3 = [
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
            "name": "fastestLap",
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
            "kind": "ScalarField",
            "name": "kartNumber",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "Track",
            "kind": "LinkedField",
            "name": "track",
            "plural": false,
            "selections": (v2/*: any*/),
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "Kart",
            "kind": "LinkedField",
            "name": "kart",
            "plural": false,
            "selections": (v2/*: any*/),
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "TrackLayout",
            "kind": "LinkedField",
            "name": "trackLayout",
            "plural": false,
            "selections": (v2/*: any*/),
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
    "selections": (v3/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "SessionOverviewCardUpdateTrackSessionMutation",
    "selections": (v3/*: any*/)
  },
  "params": {
    "cacheID": "f275a1f01131be3d54dfdf8948dee96d",
    "id": null,
    "metadata": {},
    "name": "SessionOverviewCardUpdateTrackSessionMutation",
    "operationKind": "mutation",
    "text": "mutation SessionOverviewCardUpdateTrackSessionMutation(\n  $input: UpdateTrackSessionInput!\n) {\n  updateTrackSession(input: $input) {\n    trackSession {\n      id\n      date\n      format\n      classification\n      fastestLap\n      conditions\n      notes\n      kartNumber\n      track {\n        id\n        name\n      }\n      kart {\n        id\n        name\n      }\n      trackLayout {\n        id\n        name\n      }\n      updatedAt\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "ef4c51f849bdb6c7391a2c243a170777";

export default node;
