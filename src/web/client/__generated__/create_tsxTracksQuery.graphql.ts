/**
 * @generated SignedSource<<dcf25197c8b8dae26218c03e86f1c509>>
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
    readonly karts: ReadonlyArray<{
      readonly id: string;
      readonly name: string;
    }>;
    readonly name: string;
    readonly trackLayouts: ReadonlyArray<{
      readonly id: string;
      readonly name: string;
    }>;
  }>;
};
export type create_tsxTracksQuery = {
  response: create_tsxTracksQuery$data;
  variables: create_tsxTracksQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v1 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
},
v2 = [
  (v0/*: any*/),
  (v1/*: any*/)
],
v3 = [
  {
    "alias": "tracks",
    "args": null,
    "concreteType": "Circuit",
    "kind": "LinkedField",
    "name": "circuits",
    "plural": true,
    "selections": [
      (v0/*: any*/),
      (v1/*: any*/),
      {
        "alias": null,
        "args": null,
        "concreteType": "Kart",
        "kind": "LinkedField",
        "name": "karts",
        "plural": true,
        "selections": (v2/*: any*/),
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "concreteType": "TrackLayout",
        "kind": "LinkedField",
        "name": "trackLayouts",
        "plural": true,
        "selections": (v2/*: any*/),
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
    "name": "create_tsxTracksQuery",
    "selections": (v3/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "create_tsxTracksQuery",
    "selections": (v3/*: any*/)
  },
  "params": {
    "cacheID": "eb8fd7a2ec63fcc608c34264dd523077",
    "id": null,
    "metadata": {},
    "name": "create_tsxTracksQuery",
    "operationKind": "query",
    "text": "query create_tsxTracksQuery {\n  tracks: circuits {\n    id\n    name\n    karts {\n      id\n      name\n    }\n    trackLayouts {\n      id\n      name\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "03851b9df60f446cfdfd3fcfaceb3343";

export default node;
