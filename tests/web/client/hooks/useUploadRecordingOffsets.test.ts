import { describe, expect, it } from "vitest";
import { getEndOffsetButtonDisabled } from "../../../../src/web/client/hooks/useUploadRecordingOffsets.js";

describe("getEndOffsetButtonDisabled", () => {
  it("allows end offset on the final clip even when playhead is before the first clip start offset", () => {
    const disabled = getEndOffsetButtonDisabled({
      videoCount: 3,
      currentVideoIndex: 2,
      playheadMs: 1000,
      startOffsetMs: 90000,
      lapOneOffsetMs: null,
      hasEndOffset: false,
      isBusy: false,
    });

    expect(disabled).toBe(false);
  });

  it("blocks end offset on non-final clips for multi-clip uploads", () => {
    const disabled = getEndOffsetButtonDisabled({
      videoCount: 2,
      currentVideoIndex: 0,
      playheadMs: 2000,
      startOffsetMs: 1000,
      lapOneOffsetMs: null,
      hasEndOffset: false,
      isBusy: false,
    });

    expect(disabled).toBe(true);
  });

  it("enforces start and lap one offsets when there is only one clip", () => {
    const blocked = getEndOffsetButtonDisabled({
      videoCount: 1,
      currentVideoIndex: 0,
      playheadMs: 4000,
      startOffsetMs: 1000,
      lapOneOffsetMs: 5000,
      hasEndOffset: false,
      isBusy: false,
    });
    const allowed = getEndOffsetButtonDisabled({
      videoCount: 1,
      currentVideoIndex: 0,
      playheadMs: 6000,
      startOffsetMs: 1000,
      lapOneOffsetMs: 5000,
      hasEndOffset: false,
      isBusy: false,
    });

    expect(blocked).toBe(true);
    expect(allowed).toBe(false);
  });

  it("blocks end offsets before the start offset when there is only one clip", () => {
    const disabled = getEndOffsetButtonDisabled({
      videoCount: 1,
      currentVideoIndex: 0,
      playheadMs: 2000,
      startOffsetMs: 5000,
      lapOneOffsetMs: null,
      hasEndOffset: false,
      isBusy: false,
    });

    expect(disabled).toBe(true);
  });
});
