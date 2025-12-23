/**
 * @generated SignedSource<<17217f1d4b1ffdda7c74dc3ecb6f02d0>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type OverlayExportCodec = "H264" | "H265" | "%future added value";
export type OverlayExportQuality = "BEST" | "GOOD" | "ULTRAFAST" | "%future added value";
export type OverlayPosition = "BOTTOM_LEFT" | "BOTTOM_RIGHT" | "TOP_LEFT" | "TOP_RIGHT" | "%future added value";
export type OverlayTextColor = "WHITE" | "YELLOW" | "%future added value";
export type BurnRecordingOverlayInput = {
  codec?: OverlayExportCodec | null | undefined;
  embedChapters?: boolean | null | undefined;
  quality: OverlayExportQuality;
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
export type RenderedOverlayPreviewBurnOverlayMutation$variables = {
  input: BurnRecordingOverlayInput;
};
export type RenderedOverlayPreviewBurnOverlayMutation$data = {
  readonly burnRecordingOverlay: {
    readonly recording: {
      readonly id: string;
      readonly overlayBurned: boolean;
      readonly updatedAt: string;
    };
  };
};
export type RenderedOverlayPreviewBurnOverlayMutation = {
  response: RenderedOverlayPreviewBurnOverlayMutation$data;
  variables: RenderedOverlayPreviewBurnOverlayMutation$variables;
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
    "concreteType": "BurnRecordingOverlayPayload",
    "kind": "LinkedField",
    "name": "burnRecordingOverlay",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "TrackRecording",
        "kind": "LinkedField",
        "name": "recording",
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
            "name": "overlayBurned",
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
    "name": "RenderedOverlayPreviewBurnOverlayMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "RenderedOverlayPreviewBurnOverlayMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "f53cec9738a6023d756ebc63ff81d000",
    "id": null,
    "metadata": {},
    "name": "RenderedOverlayPreviewBurnOverlayMutation",
    "operationKind": "mutation",
    "text": "mutation RenderedOverlayPreviewBurnOverlayMutation(\n  $input: BurnRecordingOverlayInput!\n) {\n  burnRecordingOverlay(input: $input) {\n    recording {\n      id\n      overlayBurned\n      updatedAt\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "88ef93f1e9bb7c081892b5819a559ef0";

export default node;
