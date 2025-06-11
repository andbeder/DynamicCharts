# Dynamic Charts System Requirements

## Purpose

Dynamic Charts is a Lightning application for Salesforce that enables users to quickly generate interactive charts in the Salesforce UI. The application leverages the ApexCharts JavaScript library to render charts and retrieves data from CRM Analytics (Wave) datasets using SAQL queries.

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
   - All charts shall be shown in pairs side-by-side:
     - The original chart bound to the filters so that it is applying a positive filter
     - A clone of the original chart with `AO` appended to the ID which shows 'All Others' or the inverse (!=) of the filters applied
   - Chart data shall refresh whenever the user updates filter selections
   - Chart content and presentation shall be goverened by CRMA dashboards referenced by a property in `charts.json`
5. **User Interface**
   - The component shall expose a Lightning App Page, Record Page, and Home Page target as defined in the metadata file.
   - Chart content shall appear within `<lightning-card>` containers that include `<div>` elements with classes matching the titles of charts within CRM Analytics dashboards.
6. **Compatibility**
   - The application shall be compatible with Salesforce API version 59.0 as specified in the `sfdx-project.json` configuration.
7. **Change Request Generation**
   - The system shall compare `charts.json` with `revEngCharts.json` and output `changeRequests.json` listing required code updates.
   - A script shall convert `changeRequests.json` into a human-readable `changeRequestInstructions.txt` file for developers, translating style changes into their corresponding ApexCharts option paths.

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
