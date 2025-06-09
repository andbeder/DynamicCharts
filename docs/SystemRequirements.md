# SAC Charts System Requirements

## Purpose
SAC Charts is a Lightning application for Salesforce that enables users to quickly generate interactive charts in the Salesforce UI. The application leverages the ApexCharts JavaScript library to render charts and retrieves data from CRM Analytics (Wave) datasets using SAQL queries.

## Functional Requirements
1. **Dataset Retrieval**
   - The system shall fetch available CRM Analytics datasets using the `getDatasets` wire adapter.
   - Only datasets of type `Default` or `Live` with license type `EinsteinAnalytics` shall be returned.
2. **Filter Options**
   - Users shall filter chart results by `host`, `nation`, `season`, and `ski` attributes.
   - Dual list boxes shall be provided for `host`, `nation`, and `season` selections.
   - A combo box shall be provided for the `ski` selection with the choices **All**, **Yes**, and **No**.
   - Selecting a value in any filter shall refresh the remaining filter options so that only valid values are displayed.
3. **Dynamic Query Generation**
   - The component shall build a SAQL query based on selected filter values.
   - Filters shall be combined using the `filter q by` SAQL syntax.
4. **Chart Rendering**
   - The system shall load the ApexCharts library from a static resource.
   - Two bar charts shall be displayed side by side.
   - The left chart shall use the selected filters directly.
   - The right chart shall apply the inverse of the `host` and `nation` filters while honoring `season` and `ski` selections.
   - Chart data shall refresh whenever the user updates filter selections and clicks **Render**.
5. **User Interface**
   - The component shall expose a Lightning App Page, Record Page, and Home Page target as defined in the metadata file.
   - Chart content shall appear within a `<lightning-card>` container containing two `<div>` elements with classes `chart1` and `chart2`.
6. **Compatibility**
   - The application shall be compatible with Salesforce API version 59.0 as specified in the `sfdx-project.json` configuration.

## Non‑Functional Requirements
1. **Performance**
   - Chart rendering shall occur within one second after the ApexCharts library loads and the SAQL query completes.
2. **Security**
   - The LWC shall operate with sharing enforced through Salesforce security mechanisms.
3. **Maintainability**
   - Code shall be written in modern JavaScript and Apex standards to ease future modifications.
4. **Extensibility**
   - The system should allow additional chart types and datasets to be introduced with minimal code changes.

## Out of Scope
- Complex state management beyond the provided filters.
- Server-side Apex logic aside from the placeholder `DPOStateMachine` class.
- Advanced chart features such as drill‑down or cross‑filtering between multiple charts.

