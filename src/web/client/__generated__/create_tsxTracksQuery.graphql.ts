/**
 * @generated SignedSource<<79dae35cbfafa2857b0d81b1b4adedab>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type create_tsxTracksQuery$variables = Record<PropertyKey, never>;
export type create_tsxTracksQuery$data = {
  readonly tracks: ReadonlyArray<{
    readonly id: string;
    readonly isIndoors: boolean;
    readonly karts: ReadonlyArray<{
      readonly id: string;
      readonly name: string;
    }>;
    readonly name: string;
    readonly postcode: string | null | undefined;
    readonly trackLayouts: ReadonlyArray<{
      readonly id: string;
      readonly name: string;
    }>;
  }>;
  readonly viewer: {
    readonly daytonaClubspeedCredentialStatus: {
      readonly configured: boolean;
      readonly lastValidationError: string | null | undefined;
    };
  } | null | undefined;
};
export type create_tsxTracksQuery = {
  response: create_tsxTracksQuery$data;
  variables: create_tsxTracksQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "alias": null,
  "args": null,
  "concreteType": "DaytonaClubspeedCredentialStatus",
  "kind": "LinkedField",
  "name": "daytonaClubspeedCredentialStatus",
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
      "name": "lastValidationError",
      "storageKey": null
    }
  ],
  "storageKey": null
},
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
  "name": "name",
  "storageKey": null
},
v3 = [
  (v1/*: any*/),
  (v2/*: any*/)
],
v4 = {
  "alias": null,
  "args": null,
  "concreteType": "Track",
  "kind": "LinkedField",
  "name": "tracks",
  "plural": true,
  "selections": [
    (v1/*: any*/),
    (v2/*: any*/),
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "postcode",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "isIndoors",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "concreteType": "Kart",
      "kind": "LinkedField",
      "name": "karts",
      "plural": true,
      "selections": (v3/*: any*/),
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "concreteType": "TrackLayout",
      "kind": "LinkedField",
      "name": "trackLayouts",
      "plural": true,
      "selections": (v3/*: any*/),
      "storageKey": null
    }
  ],
  "storageKey": null
};
return {
  "fragment": {
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": null,
    "name": "create_tsxTracksQuery",
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "User",
        "kind": "LinkedField",
        "name": "viewer",
        "plural": false,
        "selections": [
          (v0/*: any*/)
        ],
        "storageKey": null
      },
      (v4/*: any*/)
    ],
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "create_tsxTracksQuery",
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "User",
        "kind": "LinkedField",
        "name": "viewer",
        "plural": false,
        "selections": [
          (v0/*: any*/),
          (v1/*: any*/)
        ],
        "storageKey": null
      },
      (v4/*: any*/)
    ]
  },
  "params": {
    "cacheID": "d2b16537adfcd9383e3c84740b21c621",
    "id": null,
    "metadata": {},
    "name": "create_tsxTracksQuery",
    "operationKind": "query",
    "text": "query create_tsxTracksQuery {\n  viewer {\n    daytonaClubspeedCredentialStatus {\n      configured\n      lastValidationError\n    }\n    id\n  }\n  tracks {\n    id\n    name\n    postcode\n    isIndoors\n    karts {\n      id\n      name\n    }\n    trackLayouts {\n      id\n      name\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "6d2c9bce8f8c0576be37ccadc036b3fa";

export default node;
