/**
 * @generated SignedSource<<552121841c1dc07dfc8e54b380cff631>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type CreateTrackInput = {
  heroImage?: string | null | undefined;
  isIndoors?: boolean | null | undefined;
  karts: ReadonlyArray<CreateKartInput>;
  name: string;
  postcode?: string | null | undefined;
  trackLayouts: ReadonlyArray<CreateTrackLayoutInput>;
};
export type CreateKartInput = {
  name: string;
};
export type CreateTrackLayoutInput = {
  name: string;
};
export type CreateTrackModalCreateTrackMutation$variables = {
  input: CreateTrackInput;
};
export type CreateTrackModalCreateTrackMutation$data = {
  readonly createTrack: {
    readonly track: {
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
    };
  };
};
export type CreateTrackModalCreateTrackMutation = {
  response: CreateTrackModalCreateTrackMutation$data;
  variables: CreateTrackModalCreateTrackMutation$variables;
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
  "name": "name",
  "storageKey": null
},
v3 = [
  (v1/*: any*/),
  (v2/*: any*/)
],
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
    "concreteType": "CreateTrackPayload",
    "kind": "LinkedField",
    "name": "createTrack",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "Track",
        "kind": "LinkedField",
        "name": "track",
        "plural": false,
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
    "name": "CreateTrackModalCreateTrackMutation",
    "selections": (v4/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "CreateTrackModalCreateTrackMutation",
    "selections": (v4/*: any*/)
  },
  "params": {
    "cacheID": "3d8e2c756cd08089003184b6a7bb88dd",
    "id": null,
    "metadata": {},
    "name": "CreateTrackModalCreateTrackMutation",
    "operationKind": "mutation",
    "text": "mutation CreateTrackModalCreateTrackMutation(\n  $input: CreateTrackInput!\n) {\n  createTrack(input: $input) {\n    track {\n      id\n      name\n      postcode\n      isIndoors\n      karts {\n        id\n        name\n      }\n      trackLayouts {\n        id\n        name\n      }\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "36d9035e406266a309985d39653bd911";

export default node;
