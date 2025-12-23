/**
 * @generated SignedSource<<c3dbae8340e2012a9801d7c124a7f1a6>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type adminAdminToolsRoute_viewer$data = {
  readonly id: string;
  readonly isAdmin: boolean;
  readonly " $fragmentType": "adminAdminToolsRoute_viewer";
};
export type adminAdminToolsRoute_viewer$key = {
  readonly " $data"?: adminAdminToolsRoute_viewer$data;
  readonly " $fragmentSpreads": FragmentRefs<"adminAdminToolsRoute_viewer">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "adminAdminToolsRoute_viewer",
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
      "name": "isAdmin",
      "storageKey": null
    }
  ],
  "type": "User",
  "abstractKey": null
};

(node as any).hash = "7589bb5b5fd1a3f2b2b430c5efd2c234";

export default node;
