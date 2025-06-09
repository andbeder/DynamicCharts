# SAC Charts System Design

## Overview
SAC Charts is implemented as a Lightning Web Component (LWC) named `dynamicCharts`. The component obtains data from CRM Analytics using wire adapters, generates SAQL queries based on user-selected filters, and renders charts with the ApexCharts JavaScript library.

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
- **dynamicCharts.js**: Core logic for loading datasets, handling filter selections, generating SAQL, and rendering charts with ApexCharts.
- **dynamicCharts.html**: Presents filter controls and the chart container.
- **dynamicCharts.js-meta.xml**: Exposes the component to App, Record, and Home pages.
- **DPOStateMachine.cls**: Placeholder Apex class reserved for future enhancements or server-side processing.

## Data Flow
1. `getDatasets` retrieves dataset IDs when the component initializes.
2. Dual list boxes and combo box capture filter selections from the user.
3. `executeQuery` runs a SAQL query constructed from selected filters.
4. Query results drive the chart options and data series in ApexCharts.
5. Updating filters triggers `filtersUpdated`, which refreshes the chart with new query data.

## Dependencies
- **ApexCharts**: Loaded from the static resource `ApexCharts` at runtime.
- **lightning/analyticsWaveApi**: Provides `getDatasets` and `executeQuery` wire adapters.
- **Salesforce LWC**: Standard library for creating Lightning Web Components.

## Testing
Unit tests reside under `force-app/main/default/lwc/dynamicCharts/__tests__` and use `sfdx-lwc-jest`. The sample test verifies that the chart container renders when the component is created.

## Future Considerations
- Implement additional chart types (line, pie, etc.) using ApexCharts options.
- Integrate server-side logic via the `DPOStateMachine` Apex class for more complex query operations.
- Provide configuration to select datasets and SAQL queries through custom metadata or custom settings.

