import { collectElements } from "./dom.js";
import { state } from "./state.js";
import { createRouter } from "./router.js";
import {
  renderUploadStep,
  initUploadStep,
} from "./steps/uploadStep.js";
import {
  renderOffsetsStep,
  initOffsetsStep,
} from "./steps/offsetsStep.js";
import {
  renderPreviewStep,
  initPreviewStep,
} from "./steps/previewStep.js";
import {
  renderTransformStep,
  initTransformStep,
} from "./steps/transformStep.js";
import { setStatus } from "./status.js";

const stepsRoot = document.getElementById("stepsRoot");
renderUploadStep(stepsRoot);
renderOffsetsStep(stepsRoot);
renderPreviewStep(stepsRoot);
renderTransformStep(stepsRoot);

const els = collectElements();

const router = createRouter({
  steps: {
    upload: els.stepUpload,
    offsets: els.stepOffsets,
    preview: els.stepPreview,
    transform: els.stepTransform,
  },
});

const goToRaw = router.goTo;
router.goTo = (name, options = {}) => {
  if (name === "offsets" && !state.uploadReady) {
    setStatus(
      els.statusBody,
      "Upload a video before setting the start offset.",
      true
    );
    return goToRaw("upload", { replaceHistory: true });
  }
  return goToRaw(name, options);
};

const transform = initTransformStep({ els, state, router });
const preview = initPreviewStep({
  els,
  state,
  router,
  syncTransform: transform.syncFromState,
});
const offsets = initOffsetsStep({
  els,
  state,
  router,
  onLapDataReady: preview.syncFromLapData,
});
initUploadStep({
  els,
  state,
  router,
  preparePreviewFromFile: offsets.preparePreviewFromFile,
  preparePreviewFromUpload: offsets.preparePreviewFromUpload,
  handleUploadInfo: offsets.handleUploadInfo,
});

const initialStep = router.getInitialStep();
if (initialStep) {
  router.goTo(initialStep, { replaceHistory: true });
}
