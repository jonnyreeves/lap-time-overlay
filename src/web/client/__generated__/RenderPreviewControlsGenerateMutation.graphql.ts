/**
 * @generated SignedSource<<14a1788750a172c349cd45160eb3e0e1>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type OverlayPosition = "BOTTOM_LEFT" | "BOTTOM_RIGHT" | "TOP_LEFT" | "TOP_RIGHT" | "%future added value";
export type OverlayTextColor = "WHITE" | "YELLOW" | "%future added value";
export type RenderOverlayPreviewInput = {
  lapId: string;
  offsetSeconds: number;
  recordingId: string;
  style?: OverlayStyleInput | null | undefined;
};
export type OverlayStyleInput = {
  boxOpacity?: number | null | undefined;
  detailTextSize?: number | null | undefined;
  overlayPosition?: OverlayPosition | null | undefined;
  showLapCounter?: boolean | null | undefined;
  showLapDeltas?: boolean | null | undefined;
  showPosition?: boolean | null | undefined;
  textColor?: OverlayTextColor | null | undefined;
  textSize?: number | null | undefined;
};
export type RenderPreviewControlsGenerateMutation$variables = {
  input: RenderOverlayPreviewInput;
};
export type RenderPreviewControlsGenerateMutation$data = {
  readonly renderOverlayPreview: {
    readonly preview: {
      readonly generatedAt: string;
      readonly id: string;
      readonly lapId: string;
      readonly lapNumber: number;
      readonly previewTimeSeconds: number;
      readonly previewUrl: string;
      readonly recordingId: string;
      readonly requestedOffsetSeconds: number;
      readonly usedOffsetSeconds: number;
    };
  };
};
export type RenderPreviewControlsGenerateMutation = {
  response: RenderPreviewControlsGenerateMutation$data;
  variables: RenderPreviewControlsGenerateMutation$variables;
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
    "concreteType": "RenderOverlayPreviewPayload",
    "kind": "LinkedField",
    "name": "renderOverlayPreview",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "OverlayPreview",
        "kind": "LinkedField",
        "name": "preview",
        "plural": false,
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
            "name": "previewUrl",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "requestedOffsetSeconds",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "usedOffsetSeconds",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "previewTimeSeconds",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "lapId",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "lapNumber",
            "storageKey": null
          },
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
            "name": "generatedAt",
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
    "name": "RenderPreviewControlsGenerateMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "RenderPreviewControlsGenerateMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "e4708b6888d794d2b131e3c4ea6d443b",
    "id": null,
    "metadata": {},
    "name": "RenderPreviewControlsGenerateMutation",
    "operationKind": "mutation",
    "text": "mutation RenderPreviewControlsGenerateMutation(\n  $input: RenderOverlayPreviewInput!\n) {\n  renderOverlayPreview(input: $input) {\n    preview {\n      id\n      previewUrl\n      requestedOffsetSeconds\n      usedOffsetSeconds\n      previewTimeSeconds\n      lapId\n      lapNumber\n      recordingId\n      generatedAt\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "bae2085acc09506191afd6ac20ba80ac";

export default node;
