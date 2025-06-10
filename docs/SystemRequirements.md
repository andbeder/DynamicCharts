# SAC Charts System Requirements

## Purpose
SAC Charts is a Lightning application for Salesforce that enables users to quickly generate interactive charts in the Salesforce UI. The application leverages the ApexCharts JavaScript library to render charts and retrieves data from CRM Analytics (Wave) datasets using SAQL queries.

## Functional Requirements
1. **Dataset Retrieval**
   - The system shall fetch available CRM Analytics datasets using the `getDatasets` wire adapter.
   - Only datasets of type `Default` or `Live` with license type `EinsteinAnalytics` shall be returned.
2. **Filter Options**
   - Users shall filter chart results by `host`, `nation`, `season`, and `ski` attributes.
   - Dual list boxes shall be provided for `host` and `nation` selections.
   - A reusable `multiSelectPicklist` component shall be used for `season` and `ski` selections. The ski picklist is limited to a single choice (**All**, **Yes**, or **No**).
   - Selecting a value in any filter shall refresh the remaining filter options so that only valid values are displayed.
   - The picklist shall derive option labels from the first field of query results when no `label` field exists.
3. **Dynamic Query Generation**
   - The component shall build a SAQL query based on selected filter values.
   - Filters shall be combined using the `filter q by` SAQL syntax.
4. **Chart Rendering**
   - The system shall load the ApexCharts library from a static resource and cache it with a shared promise so it is loaded only once, preventing `Apex._chartInstances` errors.
   - Charts shall be initialized only on the first render to avoid duplicate ApexCharts instances when the component rerenders.
   - Two bar charts and two box plots shall be displayed side by side in pairs.
   - The first chart in each pair shall use the selected filters directly.
   - The second chart in each pair shall apply the inverse of the `host` and `nation` filters while honoring `season` and `ski` selections.
   - Chart data shall refresh whenever the user updates filter selections and clicks **Render**.
   - Each chart shall display no more than the top 20 results as determined by the query order.
   - If a query returns no records, the chart shall remain unchanged to prevent ApexCharts runtime errors.
5. **User Interface**
   - The component shall expose a Lightning App Page, Record Page, and Home Page target as defined in the metadata file.
   - Chart content shall appear within `<lightning-card>` containers that include four `<div>` elements identified by `ClimbsByCountry`, `ClimbsByCountryAO`, `TotalTimeByPeak`, and `TotalTimeByPeakAO`.
   - Charts shall render with a drop shadow effect for visual emphasis.
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
   - Chart metadata shall be maintained in the `config/charts.json` file and deployed as a static resource so that chart options persist across iterations.

## Out of Scope
- Complex state management beyond the provided filters.
- Server-side Apex logic aside from the placeholder `DPOStateMachine` class.
- Advanced chart features such as drill‑down or cross‑filtering between multiple charts.

