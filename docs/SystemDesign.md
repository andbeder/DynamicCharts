# SAC Charts System Design

## Overview
SAC Charts is implemented as a Lightning Web Component (LWC) named `dynamicCharts`. The component obtains data from CRM Analytics using wire adapters, generates SAQL queries based on user-selected filters, and renders charts with the ApexCharts JavaScript library.
Two charts are rendered side by side. The left chart applies the selected filters while the right chart applies the inverse for the `host` and `nation` filters.

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
- **dynamicCharts.js**: Core logic for loading datasets, handling filter selections, generating SAQL, cross-filtering available options, and rendering two charts with ApexCharts.
- **dynamicCharts.html**: Presents filter controls and two chart containers laid out side by side.
- **dynamicCharts.js-meta.xml**: Exposes the component to App, Record, and Home pages.
- **DPOStateMachine.cls**: Placeholder Apex class reserved for future enhancements or server-side processing.

## Data Flow
1. `getDatasets` retrieves dataset IDs when the component initializes.
2. Dual list boxes and combo box capture filter selections from the user.
3. Option queries apply the currently selected filters (excluding the field being queried) so that each filter only displays valid values.
4. `executeQuery` runs SAQL queries for both charts using the selected filters.
5. The left chart uses the filters as selected; the right chart inverses the `host` and `nation` filters.
6. Updating filters triggers `filtersUpdated`, which refreshes both charts with new query data.

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

