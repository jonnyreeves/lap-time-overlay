const EPSILON = 1e-6;

type Tick = {
  value: number;
  y: number;
};

export type CompressedLapTimeScale = {
  hasCompressedOutliers: boolean;
  ticks: Tick[];
  breakYs: number[];
  project: (value: number) => number;
};

function quantile(sortedValues: number[], percentile: number): number {
  if (sortedValues.length === 0) return 0;
  if (sortedValues.length === 1) return sortedValues[0] ?? 0;

  const clampedPercentile = Math.max(0, Math.min(1, percentile));
  const index = (sortedValues.length - 1) * clampedPercentile;
  const lowerIndex = Math.floor(index);
  const upperIndex = Math.ceil(index);
  const lowerValue = sortedValues[lowerIndex] ?? 0;
  const upperValue = sortedValues[upperIndex] ?? lowerValue;
  const weight = index - lowerIndex;
  return lowerValue + (upperValue - lowerValue) * weight;
}

function dedupeSortedValues(values: number[]): number[] {
  const result: number[] = [];
  for (const value of values.sort((a, b) => a - b)) {
    if (result.length === 0 || Math.abs(value - (result[result.length - 1] ?? 0)) > 0.001) {
      result.push(value);
    }
  }
  return result;
}

function buildTicks(values: number[], project: (value: number) => number): Tick[] {
  return dedupeSortedValues(values).map((value) => ({ value, y: project(value) }));
}

function buildLinearScale(values: number[], plotTopY: number, plotBottomY: number): CompressedLapTimeScale {
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const span = Math.max(maxValue - minValue, 0.001);
  const height = Math.max(plotBottomY - plotTopY, 1);
  const project = (value: number) => plotBottomY - ((value - minValue) / span) * height;
  const ticks = buildTicks(
    Array.from({ length: 5 }, (_, index) => minValue + ((maxValue - minValue) * index) / 4),
    project
  );
  return { hasCompressedOutliers: false, ticks, breakYs: [], project };
}

export function createCompressedLapTimeScale(
  rawValues: ReadonlyArray<number>,
  plotTopY: number,
  plotBottomY: number
): CompressedLapTimeScale {
  const values = rawValues.filter((value) => Number.isFinite(value) && value > 0);
  if (values.length < 2) {
    return buildLinearScale(values.length > 0 ? values : [0, 1], plotTopY, plotBottomY);
  }

  const sortedValues = [...values].sort((a, b) => a - b);
  const minValue = sortedValues[0] ?? 0;
  const maxValue = sortedValues[sortedValues.length - 1] ?? minValue;
  const totalSpan = maxValue - minValue;
  if (totalSpan < 0.5) {
    return buildLinearScale(sortedValues, plotTopY, plotBottomY);
  }

  const focusInnerMin = quantile(sortedValues, 0.15);
  const focusInnerMax = quantile(sortedValues, 0.85);
  const focusInnerSpan = Math.max(focusInnerMax - focusInnerMin, totalSpan * 0.15, 0.35);
  const padding = Math.max(focusInnerSpan * 0.12, 0.15);
  const focusMin = Math.max(minValue, focusInnerMin - padding);
  const focusMax = Math.min(maxValue, focusInnerMax + padding);
  const hasLowerCompression = focusMin - minValue > Math.max(totalSpan * 0.08, 0.35);
  const hasUpperCompression = maxValue - focusMax > Math.max(totalSpan * 0.08, 0.35);

  if (!hasLowerCompression && !hasUpperCompression) {
    return buildLinearScale(sortedValues, plotTopY, plotBottomY);
  }

  const chartHeight = Math.max(plotBottomY - plotTopY, 1);
  const topCompressedHeight = hasUpperCompression ? (hasLowerCompression ? 0.12 : 0.16) * chartHeight : 0;
  const bottomCompressedHeight = hasLowerCompression ? (hasUpperCompression ? 0.12 : 0.16) * chartHeight : 0;
  const focusTopY = plotTopY + topCompressedHeight;
  const focusBottomY = plotBottomY - bottomCompressedHeight;
  const focusHeight = Math.max(focusBottomY - focusTopY, 1);
  const lowerSpan = Math.max(focusMin - minValue, EPSILON);
  const focusSpan = Math.max(focusMax - focusMin, EPSILON);
  const upperSpan = Math.max(maxValue - focusMax, EPSILON);

  const project = (value: number) => {
    if (hasLowerCompression && value < focusMin) {
      return plotBottomY - ((value - minValue) / lowerSpan) * bottomCompressedHeight;
    }
    if (hasUpperCompression && value > focusMax) {
      return focusTopY - ((value - focusMax) / upperSpan) * topCompressedHeight;
    }
    return focusBottomY - ((value - focusMin) / focusSpan) * focusHeight;
  };

  const focusTicks = Array.from({ length: 4 }, (_, index) => focusMin + (focusSpan * index) / 3);
  const tickValues = [
    ...(hasLowerCompression ? [minValue] : []),
    ...focusTicks,
    ...(hasUpperCompression ? [maxValue] : []),
  ];

  return {
    hasCompressedOutliers: true,
    ticks: buildTicks(tickValues, project),
    breakYs: [
      ...(hasLowerCompression ? [focusTopY] : []),
      ...(hasUpperCompression ? [focusBottomY] : []),
    ],
    project,
  };
}
