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
  renderLapTimesStep,
  initLapTimesStep,
} from "./steps/lapTimesStep.js";
import {
  renderPreviewStep,
  initPreviewStep,
} from "./steps/previewStep.js";
import {
  renderTransformStep,
  initTransformStep,
} from "./steps/transformStep.js";

const stepsRoot = document.getElementById("stepsRoot");
renderUploadStep(stepsRoot);
renderOffsetsStep(stepsRoot);
renderLapTimesStep(stepsRoot);
renderPreviewStep(stepsRoot);
renderTransformStep(stepsRoot);

const els = collectElements();

const router = createRouter({
  steps: {
    upload: els.stepUpload,
    offsets: els.stepOffsets,
    lapTimes: els.stepLapTimes,
    preview: els.stepPreview,
    transform: els.stepTransform,
  },
});

const offsets = initOffsetsStep({ els, state, router });
const transform = initTransformStep({ els, state, router });
const preview = initPreviewStep({
  els,
  state,
  router,
  startPolling: transform.startPolling,
});
initUploadStep({
  els,
  state,
  router,
  preparePreview: offsets.preparePreview,
  handleUploadInfo: offsets.handleUploadInfo,
});
initLapTimesStep({
  els,
  state,
  router,
  onLapDataReady: preview.syncFromLapData,
});

router.goTo("upload");
