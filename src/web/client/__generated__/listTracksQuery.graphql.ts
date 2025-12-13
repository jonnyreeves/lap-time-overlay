/**
 * @generated SignedSource<<2e860e8123aa437370ea0fa896776883>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type listTracksQuery$variables = Record<PropertyKey, never>;
export type listTracksQuery$data = {
  readonly tracks: ReadonlyArray<{
    readonly id: string;
    readonly lastVisit: string | null | undefined;
    readonly name: string;
    readonly timesRaced: number;
  }>;
};
export type listTracksQuery = {
  response: listTracksQuery$data;
  variables: listTracksQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "alias": null,
    "args": null,
    "concreteType": "Track",
    "kind": "LinkedField",
    "name": "tracks",
    "plural": true,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "id",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "name",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "timesRaced",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "lastVisit",
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
    "name": "listTracksQuery",
    "selections": (v0/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "listTracksQuery",
    "selections": (v0/*: any*/)
  },
  "params": {
    "cacheID": "f8c4525e672ec8baa23431fc90c4d56f",
    "id": null,
    "metadata": {},
    "name": "listTracksQuery",
    "operationKind": "query",
    "text": "query listTracksQuery {\n  tracks {\n    id\n    name\n    timesRaced\n    lastVisit\n  }\n}\n"
  }
};
})();

(node as any).hash = "891f98c654a886bb1581cee64ff54c03";

export default node;
