# Developer Instructions for Change Requests

This document summarizes the updates contained in `changeRequests.json` and outlines the steps required to apply them to the `dynamicCharts` Lightning Web Component.

To regenerate this list at any time, run:

```bash
npm run generate:instructions
```

## Overview

The CR‑02 dashboard introduces new titles, field labels and styles for the three primary charts. It also removes the obsolete `DaysPerPeak` chart. All changes target `force-app/main/default/lwc/dynamicCharts/dynamicCharts.js`.

## Steps

1. **Update Chart Metadata**
   - Set `dashboard: "CR_02"` for `ClimbsByNation`, `TimeByPeak` and `CampsByPeak`.
   - Replace titles with:
     - `ClimbsByNation` → **Top 20 Climbs by Nation**
     - `TimeByPeak` → **Days per Peak by Top 20 Climbs**
     - `CampsByPeak` → **Average Number of Camps per Peak**
   - Adjust field mappings:
     - `ClimbsByNation` maps `nation` → `Nation`.
     - `TimeByPeak` maps `peakid` → `Peak ID`, `A` → `Min`, `B` → `Q1`, `C` → `Q3`, `D` → `Max`.
     - `CampsByPeak` maps `peakid` → `Peak ID`, `A` → `Average Camps`.

2. **Apply Style Updates**
   - Update `seriesColors` and effects:
     - `ClimbsByNation` uses `#002060` with `shadow` effect.
     - `TimeByPeak` uses `#97C1DA,#002060` with `shadow` effect.
     - `CampsByPeak` uses `#175F68` with `shadow` effect.

3. **Remove Deprecated Chart**
   - Delete all references to the `DaysPerPeak` chart including option objects, render calls and markup containers.

4. **Validate Changes**
   - Run `npm run test:unit` to ensure all Jest tests pass.

