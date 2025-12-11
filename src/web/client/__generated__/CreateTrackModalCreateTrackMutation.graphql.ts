/**
 * @generated SignedSource<<9e51f414f18bd5b3f1cc77897e93fefe>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type CreateCircuitInput = {
  heroImage?: string | null | undefined;
  karts: ReadonlyArray<CreateKartInput>;
  name: string;
  trackLayouts: ReadonlyArray<CreateTrackLayoutInput>;
};
export type CreateKartInput = {
  name: string;
};
export type CreateTrackLayoutInput = {
  name: string;
};
export type CreateTrackModalCreateTrackMutation$variables = {
  input: CreateCircuitInput;
};
export type CreateTrackModalCreateTrackMutation$data = {
  readonly createTrack: {
    readonly track: {
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
    "alias": "createTrack",
    "args": [
      {
        "kind": "Variable",
        "name": "input",
        "variableName": "input"
      }
    ],
    "concreteType": "CreateCircuitPayload",
    "kind": "LinkedField",
    "name": "createCircuit",
    "plural": false,
    "selections": [
      {
        "alias": "track",
        "args": null,
        "concreteType": "Circuit",
        "kind": "LinkedField",
        "name": "circuit",
        "plural": false,
        "selections": [
          (v1/*: any*/),
          (v2/*: any*/),
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
    "cacheID": "cc57d5d9d2818aacc5a38494da10bce9",
    "id": null,
    "metadata": {},
    "name": "CreateTrackModalCreateTrackMutation",
    "operationKind": "mutation",
    "text": "mutation CreateTrackModalCreateTrackMutation(\n  $input: CreateCircuitInput!\n) {\n  createTrack: createCircuit(input: $input) {\n    track: circuit {\n      id\n      name\n      karts {\n        id\n        name\n      }\n      trackLayouts {\n        id\n        name\n      }\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "4aeda83a03c6caabfc7d4bce6f52bfc5";

export default node;
