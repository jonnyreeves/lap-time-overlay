/**
 * @generated SignedSource<<de604abb0c8a5caac1a026c26d3c7297>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type RebuildJellyfinProjectionInput = {
  sessionId: string;
};
export type adminRebuildJellyfinProjectionMutation$variables = {
  input: RebuildJellyfinProjectionInput;
};
export type adminRebuildJellyfinProjectionMutation$data = {
  readonly rebuildJellyfinProjection: {
    readonly view: {
      readonly folderName: string;
      readonly recordings: ReadonlyArray<{
        readonly jellyfinPath: string;
        readonly nfoPath: string;
        readonly rawPath: string;
        readonly recordingId: string;
      }>;
    };
  };
};
export type adminRebuildJellyfinProjectionMutation = {
  response: adminRebuildJellyfinProjectionMutation$data;
  variables: adminRebuildJellyfinProjectionMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "input"
  }
],
v1 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "input",
        "variableName": "input"
      }
    ],
    "concreteType": "RebuildJellyfinProjectionPayload",
    "kind": "LinkedField",
    "name": "rebuildJellyfinProjection",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "JellyfinSessionView",
        "kind": "LinkedField",
        "name": "view",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "folderName",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "JellyfinRecordingView",
            "kind": "LinkedField",
            "name": "recordings",
            "plural": true,
            "selections": [
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "recordingId",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "rawPath",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "jellyfinPath",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "nfoPath",
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
    "name": "adminRebuildJellyfinProjectionMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "adminRebuildJellyfinProjectionMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "cc5e998b1645741972f58717a58bcdfd",
    "id": null,
    "metadata": {},
    "name": "adminRebuildJellyfinProjectionMutation",
    "operationKind": "mutation",
    "text": "mutation adminRebuildJellyfinProjectionMutation(\n  $input: RebuildJellyfinProjectionInput!\n) {\n  rebuildJellyfinProjection(input: $input) {\n    view {\n      folderName\n      recordings {\n        recordingId\n        rawPath\n        jellyfinPath\n        nfoPath\n      }\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "af2b5e5b7c00be5b5e760fc031aa4d33";

export default node;
