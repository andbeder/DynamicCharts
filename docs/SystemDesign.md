# SAC Charts System Design

## Overview
SAC Charts is implemented as a Lightning Web Component (LWC) named `dynamicCharts`. The component obtains data from CRM Analytics using wire adapters, generates SAQL queries based on user-selected filters, and renders charts with the ApexCharts JavaScript library.
Two pairs of charts are rendered: **ClimbsByCountry** and **ClimbsByCountryAO** for the bar series, and **TotalTimeByPeak** and **TotalTimeByPeakAO** for the box plot series.

The project follows the Salesforce DX structure with source located under `force-app/main/default` and uses `sfdx-lwc-jest` for unit testing.

## Architecture
```
+-----------------------+
| Salesforce UI (LWC)   |
+-----------+-----------+
            |
            v
+-----------+-----------+
| dynamicCharts.js      |
| - Builds SAQL queries |
| - Uses ApexCharts     |
+-----------+-----------+
            |
            v
+-----------+-----------+
| CRM Analytics (Wave)  |
| Datasets via API      |
+-----------------------+
```

### Key Components
- **dynamicCharts.js**: Core logic for loading datasets, handling filter selections, generating SAQL, cross-filtering available options, and rendering four charts with ApexCharts.
- **dynamicCharts.html**: Presents filter controls and four chart containers arranged in two side-by-side pairs.
- **dynamicCharts.js-meta.xml**: Exposes the component to App, Record, and Home pages.
- **multiSelectPicklist**: Reusable search-based picklist used for the Season and Ski filters.
- **DPOStateMachine.cls**: Placeholder Apex class reserved for future enhancements or server-side processing.
- **chartRequirements.json**: Defines chart metadata such as type, dimensions, titles, colors, and effects used by the LWC.

## Data Flow
1. `getDatasets` retrieves dataset IDs when the component initializes.
2. Dual list boxes capture `host` and `nation` selections while a reusable `multiSelectPicklist` component handles `season` and `ski` filters.
3. Option queries apply the currently selected filters (excluding the field being queried) so that each filter only displays valid values.
4. `executeQuery` runs SAQL queries for all charts using the selected filters and limits each result set to 20 rows.
5. The first chart in each pair uses the filters as selected; the second chart applies the inverse of the `host` and `nation` filters.
6. Updating filters triggers `filtersUpdated`, which refreshes every chart with new query data.

## Dependencies
- **ApexCharts**: Loaded from the static resource `ApexCharts` at runtime.
- **lightning/analyticsWaveApi**: Provides `getDatasets` and `executeQuery` wire adapters.
- **Salesforce LWC**: Standard library for creating Lightning Web Components.

## Testing
Unit tests reside under `force-app/main/default/lwc/dynamicCharts/__tests__` and use `sfdx-lwc-jest`. Additional Apex test classes are stored in the `force-app/test` package to validate server-side code. The sample tests verify that both chart containers render when the component is created.

## Future Considerations
- Implement additional chart types (line, pie, etc.) using ApexCharts options.
- Integrate server-side logic via the `DPOStateMachine` Apex class for more complex query operations.
- Provide configuration to select datasets and SAQL queries through custom metadata or custom settings.

