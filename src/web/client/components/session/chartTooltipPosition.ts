export function resolveChartTooltipY(
  hoveredPointYs: number[],
  tooltipHeight: number,
  plotTopY: number,
  plotBottomY: number,
  gap = 14
): number {
  const visiblePoints = hoveredPointYs.filter((value) => Number.isFinite(value));
  if (visiblePoints.length === 0) {
    return plotTopY;
  }

  const topPointY = Math.min(...visiblePoints);
  const bottomPointY = Math.max(...visiblePoints);
  const aboveY = topPointY - tooltipHeight - gap;
  if (aboveY >= plotTopY) {
    return aboveY;
  }

  const belowY = bottomPointY + gap;
  const maxTooltipY = Math.max(plotTopY, plotBottomY - tooltipHeight);
  if (belowY <= maxTooltipY) {
    return belowY;
  }

  return Math.max(plotTopY, Math.min(maxTooltipY, plotTopY + gap));
}
