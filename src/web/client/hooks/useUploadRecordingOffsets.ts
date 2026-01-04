import { useMemo } from "react";

export type EndOffsetButtonInput = {
  videoCount: number;
  currentVideoIndex: number;
  playheadMs: number;
  startOffsetMs: number | null | undefined;
  lapOneOffsetMs: number | null | undefined;
  hasEndOffset: boolean;
  isBusy: boolean;
};

export function getEndOffsetButtonDisabled({
  videoCount,
  currentVideoIndex,
  playheadMs,
  startOffsetMs,
  lapOneOffsetMs,
  hasEndOffset,
  isBusy,
}: EndOffsetButtonInput): boolean {
  if (isBusy) return true;
  if (hasEndOffset) return false;
  if (videoCount <= 0) return true;
  if (currentVideoIndex !== videoCount - 1) return true;
  if (videoCount > 1) return false;

  const startOffset = Math.max(0, startOffsetMs ?? 0);
  if (startOffsetMs != null && playheadMs <= startOffset) return true;
  const requiredEndPlayheadMs = Math.max(startOffset, lapOneOffsetMs ?? startOffset);
  return playheadMs <= requiredEndPlayheadMs;
}

export function useEndOffsetButtonDisabled(input: EndOffsetButtonInput): boolean {
  return useMemo(
    () => getEndOffsetButtonDisabled(input),
    [
      input.videoCount,
      input.currentVideoIndex,
      input.playheadMs,
      input.startOffsetMs,
      input.lapOneOffsetMs,
      input.hasEndOffset,
      input.isBusy,
    ]
  );
}
