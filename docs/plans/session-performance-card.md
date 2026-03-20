# Session Performance Card Replacement Plan

## Summary

Replace the session `Consistency` card with a session-type-aware `Session Performance` card that answers:

1. How good was this session?
2. Why?

The new card keeps the existing summary-card footprint, but changes the KPI model by format:

- `Practice`: representative pace first, then consistency and usable-session quality
- `Qualifying`: field-relative one-lap pace first, then repeatability near peak
- `Race`: representative pace and stint quality first, then reliability

V1 should stay compact: one headline score, 2 primary KPIs, 4 supporting diagnostics, and one compact visual.

## KPI Model

### Practice

- Headline: `Session Performance Score`
- Primary: `Top 5 Average`, `Best Lap Gap to Session Best`
- Supporting: `Top 10 Average`, `Clean Lap Std Dev`, `Longest Consistent Stint`, `Clean Lap Ratio`
- Visual: lap-order trace with representative pace band and excluded laps marked

### Qualifying

- Headline: `Qualifying Performance Score`
- Primary: `Gap to P1`, `Top 3 Average`
- Supporting: `Gap to P3`, `Top 3 Spread`, `Second Lap Delta`, `Push Rate`
- Visual: lap-order push trace with top-3 push laps highlighted

### Race

- Headline: `Race Performance Score`
- Primary: `Top 10 Average` with `Top 5 Average` fallback, `Longest Consistent Stint`
- Supporting: `Best Lap Gap to Session Best`, `% Within Threshold`, `Clean Lap Std Dev`, `Clean Lap Ratio`
- Visual: lap-order trace with consistent-stint block highlighted

## Metric and Scoring Defaults

- Clean laps exclude invalid laps, lap 1 when later valid laps exist, and slow statistical outliers
- Clean-lap filtering is deterministic and heuristic-only in v1; lap events are not used
- Practice/Race field-relative analysis is limited to best-lap comparison in v1
- Qualifying weights:
  - `Gap to P1`: 45
  - `Top 3 Average`: 25
  - `Top 3 Spread`: 10
  - `Second Lap Delta`: 10
  - `Push Rate`: 10
- Practice weights:
  - `Top 5 Average`: 25
  - `Top 10 Average`: 15
  - `Best Lap Gap`: 20
  - `Clean Lap Std Dev`: 15
  - `Longest Stint`: 15
  - `Clean Lap Ratio`: 10
- Race weights:
  - `Top 10 Average`: 25
  - `Top 5 Average`: 10
  - `Longest Stint`: 25
  - `% Within Threshold`: 15
  - `Best Lap Gap`: 15
  - `Clean Lap Ratio`: 10

## API and UI Changes

- Replace `consistencyScore` with `sessionPerformanceScore`
- Replace `consistency` with `sessionPerformance`
- Keep computation on the server and render the card from the server payload
- Replace the `ConsistencyCard` session-page slot with `SessionPerformanceCard`
- Update session list sorting and display from consistency-based semantics to performance-based semantics

## Validation

- Add unit coverage for qualifying, practice, and race KPI computation
- Cover short-session fallbacks, outlier trimming, stint recovery after one bad lap, and missing field benchmarks
- Update GraphQL resolver tests to assert the new score and payload shape
- Run `npm run check` before handoff
