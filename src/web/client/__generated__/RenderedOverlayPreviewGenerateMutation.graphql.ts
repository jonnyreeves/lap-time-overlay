/**
 * @generated SignedSource<<7144a34713ce77b6dc2052858df67efb>>
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
  overlayPosition?: OverlayPosition | null | undefined;
  showLapDeltas?: boolean | null | undefined;
  textColor?: OverlayTextColor | null | undefined;
  textSize?: number | null | undefined;
};
export type RenderedOverlayPreviewGenerateMutation$variables = {
  input: RenderOverlayPreviewInput;
};
export type RenderedOverlayPreviewGenerateMutation$data = {
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
export type RenderedOverlayPreviewGenerateMutation = {
  response: RenderedOverlayPreviewGenerateMutation$data;
  variables: RenderedOverlayPreviewGenerateMutation$variables;
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
    "name": "RenderedOverlayPreviewGenerateMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "RenderedOverlayPreviewGenerateMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "35dbb7f1fed06e6e6037a5955ba1c28f",
    "id": null,
    "metadata": {},
    "name": "RenderedOverlayPreviewGenerateMutation",
    "operationKind": "mutation",
    "text": "mutation RenderedOverlayPreviewGenerateMutation(\n  $input: RenderOverlayPreviewInput!\n) {\n  renderOverlayPreview(input: $input) {\n    preview {\n      id\n      previewUrl\n      requestedOffsetSeconds\n      usedOffsetSeconds\n      previewTimeSeconds\n      lapId\n      lapNumber\n      recordingId\n      generatedAt\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "161e608cf40d135bbaf859b40cf86e21";

export default node;
