/**
 * @generated SignedSource<<56230178caf2a95154773bb178e7197f>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type VideoAccelerationBackend = "NONE" | "QSV" | "VAAPI" | "%future added value";
export type UpdateVideoAccelerationPreferenceInput = {
  preferHardwareEncoding: boolean;
};
export type adminUpdateVideoAccelerationPreferenceMutation$variables = {
  input: UpdateVideoAccelerationPreferenceInput;
};
export type adminUpdateVideoAccelerationPreferenceMutation$data = {
  readonly updateVideoAccelerationPreference: {
    readonly status: {
      readonly available: boolean;
      readonly backend: VideoAccelerationBackend;
      readonly circuitBreakerActive: boolean;
      readonly circuitResetAt: string | null | undefined;
      readonly details: {
        readonly ffmpegHasEncoder: {
          readonly h264_qsv: boolean;
          readonly h264_vaapi: boolean;
          readonly hevc_qsv: boolean;
          readonly hevc_vaapi: boolean;
        };
        readonly ffmpegHasHwaccel: {
          readonly qsv: boolean;
          readonly vaapi: boolean;
        };
        readonly hasCard0: boolean;
        readonly hasDri: boolean;
        readonly hasRenderD128: boolean;
        readonly probeErrors: ReadonlyArray<string>;
      };
      readonly effectiveBackend: VideoAccelerationBackend;
      readonly preferHardwareEncoding: boolean;
      readonly probing: boolean;
    };
  };
};
export type adminUpdateVideoAccelerationPreferenceMutation = {
  response: adminUpdateVideoAccelerationPreferenceMutation$data;
  variables: adminUpdateVideoAccelerationPreferenceMutation$variables;
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
    "concreteType": "UpdateVideoAccelerationPreferencePayload",
    "kind": "LinkedField",
    "name": "updateVideoAccelerationPreference",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "VideoAccelerationStatus",
        "kind": "LinkedField",
        "name": "status",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "available",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "backend",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "effectiveBackend",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "preferHardwareEncoding",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "probing",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "circuitBreakerActive",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "circuitResetAt",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "VideoAccelerationDetails",
            "kind": "LinkedField",
            "name": "details",
            "plural": false,
            "selections": [
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "hasDri",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "hasRenderD128",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "hasCard0",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "concreteType": "VideoAccelerationHwaccel",
                "kind": "LinkedField",
                "name": "ffmpegHasHwaccel",
                "plural": false,
                "selections": [
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "qsv",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "vaapi",
                    "storageKey": null
                  }
                ],
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "concreteType": "VideoAccelerationEncoders",
                "kind": "LinkedField",
                "name": "ffmpegHasEncoder",
                "plural": false,
                "selections": [
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "h264_qsv",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "h264_vaapi",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "hevc_qsv",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "hevc_vaapi",
                    "storageKey": null
                  }
                ],
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "probeErrors",
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
    "name": "adminUpdateVideoAccelerationPreferenceMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "adminUpdateVideoAccelerationPreferenceMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "1e739d802319a5da0fd66d513610957e",
    "id": null,
    "metadata": {},
    "name": "adminUpdateVideoAccelerationPreferenceMutation",
    "operationKind": "mutation",
    "text": "mutation adminUpdateVideoAccelerationPreferenceMutation(\n  $input: UpdateVideoAccelerationPreferenceInput!\n) {\n  updateVideoAccelerationPreference(input: $input) {\n    status {\n      available\n      backend\n      effectiveBackend\n      preferHardwareEncoding\n      probing\n      circuitBreakerActive\n      circuitResetAt\n      details {\n        hasDri\n        hasRenderD128\n        hasCard0\n        ffmpegHasHwaccel {\n          qsv\n          vaapi\n        }\n        ffmpegHasEncoder {\n          h264_qsv\n          h264_vaapi\n          hevc_qsv\n          hevc_vaapi\n        }\n        probeErrors\n      }\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "7719366427c2b0cb2c6787a6b83a9ec8";

export default node;
