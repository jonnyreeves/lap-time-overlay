import { formatTime } from "./formatters.js";
import { FALLBACK_FPS } from "./constants.js";

export function createVideoControls(options) {
  const {
    video,
    timeReadout,
    startFrameInput,
    markButton,
    stepBackButton,
    stepForwardButton,
    getFps,
    getDuration,
    onMark,
  } = options;

  const updateTimeReadout = () => {
    const t = Number(video.currentTime) || 0;
    const fps = getFps() || FALLBACK_FPS;
    const frame = Math.max(0, Math.floor(t * fps));
    timeReadout.textContent = `${formatTime(t)} • frame ${Number.isFinite(
      frame
    )
      ? frame
      : "--"} @ ${fps.toFixed(2)} fps`;
  };

  const stepFrames = (delta) => {
    const fps = getFps() || FALLBACK_FPS;
    const step = 1 / fps;
    const duration = getDuration();
    const nextTime = Math.max(
      0,
      Math.min(
        (video.currentTime || 0) + delta * step,
        Number.isFinite(duration) ? duration : Infinity
      )
    );
    video.currentTime = nextTime;
    updateTimeReadout();
  };

  const currentFrame = () => {
    const t = Number(video.currentTime) || 0;
    const fps = getFps() || FALLBACK_FPS;
    return Math.max(0, Math.floor(t * fps));
  };

  const setEnabled = (enabled) => {
    markButton.disabled = !enabled;
    stepBackButton.disabled = !enabled;
    stepForwardButton.disabled = !enabled;
  };

  video.addEventListener("timeupdate", updateTimeReadout);
  video.addEventListener("loadedmetadata", updateTimeReadout);

  markButton.addEventListener("click", (event) => {
    event.preventDefault();
    const frame = currentFrame();
    startFrameInput.value = frame;
    onMark?.(frame, video.currentTime || 0);
  });

  stepBackButton.addEventListener("click", (event) => {
    event.preventDefault();
    stepFrames(-1);
  });

  stepForwardButton.addEventListener("click", (event) => {
    event.preventDefault();
    stepFrames(1);
  });

  return {
    setEnabled,
    updateTimeReadout,
    stepFrames,
  };
}
