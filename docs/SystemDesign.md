# SAC Charts System Design

## Overview

Dynamic Charts is implemented as a Lightning Web Component (LWC) named `dynamicCharts`. The component obtains data from CRM Analytics using wire adapters, generates SAQL queries based on user-selected filters, and renders charts with the ApexCharts JavaScript library.
The objective of this system is twofold:

1. Manage the application lifecycle through Change Requests (CRs) which specify changes to the architecture and program flow.
2. Manage the reporting lifecycle through adding, changing and deleting charts through Dashboard Requests (DRs)
   Because the reporting lifecycle is to be kept separate from the application lifecycle, with no audit trail necessary, specific dashboard requrirements are meant to be left out of SDD and SRDs

The project follows the Salesforce DX structure with source located under `force-app/main/default` and uses `sfdx-lwc-jest` for unit testing.
All automation scripts assume a Node.js 18 or later runtime (tested with Node.js 22). Using older or unsupported versions may cause `npm install` failures or other issues with the Salesforce CLI.

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
| LWC Page              |
+-----------------------+
```

### Key Components

- **dynamicCharts.js**: Core logic for loading datasets, handling filter selections, generating SAQL, cross-filtering available options, and rendering six charts with ApexCharts.
- The component applies visual effects such as drop shadows based on chart settings to enhance chart readability.
- **dynamicCharts.html**: Presents filter controls and a left-hand list of chart names. Each chart pair appears on its own page that can be selected from this list. Pages are rendered with a two-column grid: charts on the left and a text widget on the right that supplies style metadata separated by semicolons or newlines.
- **dynamicCharts.js-meta.xml**: Exposes the component to App, Record, and Home pages.
- **DPOStateMachine.cls**: Placeholder Apex class reserved for future enhancements or server-side processing.
- **charts.json**: Generated from the CRM Analytics dashboards to list supported charts. Primary charts are included, while `AO` variants are ignored.
- **revEngCharts.json**: Generated from the LWC charts to build a comparable reference of the current configuration
- **changeRequests.json**: Previously generated change request data comparing dashboard charts with the LWC implementation. No longer produced.
- **changeRequestInstructions.txt**: Historical file containing developer steps for applying change requests. Kept for reference only.
- **chartStyles.txt**: Reference file listing every style key discovered in dashboard text widgets along with a brief description.

## Data Flow

1. `getDatasets` retrieves dataset IDs when the component initializes.
2. Dual list boxes and combo box capture filter selections from the user.
3. A left-hand navigation list allows the user to switch between chart pages.
4. Widgets in the first dashboard layout are sorted by row then column so that each chart is followed by its companion text widget on the same row.
5. Option queries apply the currently selected filters (excluding the field being queried) so that each filter only displays valid values.
6. Chart queries are placed into a queue and executed via a single `executeQuery` wire adapter using the `nextQuery` getter.
7. The first bar chart uses the filters as selected; the second applies the inverse of the `host` and `nation` filters.
8. The **Render** button triggers `filtersUpdated`, which refreshes every chart with new query data.
9. The queue ensures no more than one CRM Analytics query runs at a time so the five-concurrent limit is never exceeded.

## Dependencies

- **ApexCharts**: Loaded once from the static resource `ApexCharts` on first render and reused for all charts.
- **lightning/analyticsWaveApi**: Provides `getDatasets` and `executeQuery` wire adapters.
- **Salesforce LWC**: Standard library for creating Lightning Web Components.
- **sfdcAuthorizer**: Node script that performs JWT-based authentication so other automation agents can access the org. The script first checks for `./tmp/access_token.txt` and verifies the token against Salesforce. If the token is accepted, the cached value is reused and login is skipped. The validation uses `SF_INSTANCE_URL` when available (falling back to `SFDC_LOGIN_URL`) so tokens are not refreshed unnecessarily.
- **dashboardRetriever**: Downloads dashboard state JSON using the CRM Analytics REST API so parsing agents can generate `charts.json`. When a dashboard label is supplied, it first queries the REST API to determine the API name and validates the REST response for errors before saving.
- **dashboardReader**: Parses exported dashboard JSON into normalized chart definitions written to `charts.json`. The parser now supports dashboard files where the `widgets` section is expressed as an object rather than an array and throws an error when the JSON contains an `errorCode` field.
- **sfdcDeployer**: Deploys metadata in `force-app/main/default` to the target org using the `sf` CLI and writes a JSON report under `reports/`.
- **endToEndCharts.js**: Runs `sfdcAuthorizer`, `dashboardRetriever`, `dashboardReader` and `sfdcDeployer` in sequence. Execute with `npm run end-to-end:charts -- --dashboard=CR_02` to process a dashboard from authentication through deployment.
- **Salesforce CLI** and **Jest** are included in `devDependencies` so running `npm install` prepares the full toolchain automatically.

Each agent also has a dedicated npm script named after the agent. For example,
`npm run dashboardRetriever --dashboard=CR_02` passes the dashboard API name to
`dashboardRetriever.js` and `dashboardReader.js` uses the same parameter.
The full workflow script `end-to-end:charts` accepts this option as well so that all
agents operate on the specified dashboard.

## Testing

Unit tests reside under `force-app/main/default/lwc/dynamicCharts/__tests__` and use `sfdx-lwc-jest`. Additional Apex test classes are stored in the `force-app/test` package to validate server-side code. The root `test` directory contains integration checks—for example, verifying that chart container IDs (and their `AO` counterparts) match the chart definitions in `charts.json`.
The suite also verifies that each chart container creates an ApexCharts instance by mocking `lightning/platformResourceLoader` to load the real library.
Each agent's tests can be run individually using npm scripts, for example `npm run test:sfdcDeployer`.

## Future Considerations

- Implement additional chart types (line, pie, etc.) using ApexCharts options.
- Integrate server-side logic via the `DPOStateMachine` Apex class for more complex query operations.
- Provide configuration to select datasets and SAQL queries through custom metadata or custom settings.
