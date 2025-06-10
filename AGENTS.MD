# AGENTS.md

> **Note**: `AGENTS.md` files serve as specialized documentation to guide Codex on your project’s structure, conventions, setup, and commands.

## Project Overview
- **Name**: SAC Charts  
- **Purpose**: A Lightning Web Component (`dynamicCharts`) that fetches CRM Analytics datasets via SAQL, applies user‐selected filters, and renders interactive charts using ApexCharts.

## File Structure
force-app/
└─ main/
   └─ default/
      ├─ classes/
      │  └─ DPOStateMachine.cls        ← Apex placeholder for future logic
      └─ lwc/
         └─ dynamicCharts/
            ├─ dynamicCharts.js        ← Core SAQL & chart logic
            ├─ dynamicCharts.html      ← Markup for filters + chart container
            ├─ dynamicCharts.js-meta.xml
            └─ __tests__/
               └─ dynamicCharts.test.js ← Jest tests
staticresources/
└─ ApexCharts.resource             ← ApexCharts JS library

## Environment Setup
1. **Salesforce CLI**: Ensure `sfdx` is in your PATH.  
2. **Auth & Org**:
   ```bash
   sfdx auth:web:login
   sfdx force:org:create -s -f config/project-scratch-def.json
   ```
3. **Deploy & Develop**:
   ```bash
   sfdx force:source:push
   sfdx force:org:open
   ```
4. **Local Testing**:
   ```bash
   npm install          # installs sfdx-lwc-jest, linters, etc.
   npm run test:unit   # or use sfdx-lwc-jest directly
   npm run lint        # if ESLint is configured
   ```

## Coding Conventions
- **ES6 Modules**: `import { … } from '…';`  
- **Variables**: Use `const`/`let` (no `var`).  
- **SAQL**: Build queries dynamically in `dynamicCharts.js`, combining filters with `filter q by …`.  
- **UI**:  
  - Dual list boxes for **host**, **nation**, **season**  
  - Combo box for **ski** with options **All**, **Yes**, **No**  
  - `<lightning-card>` wrapper and `<div class="ClimbsByNation">` for the bar chart

## Commands Reference
- **Push source**: `sfdx force:source:push`  
- **Pull source**: `sfdx force:source:pull`  
- **Open org**: `sfdx force:org:open`  
- **Delete org**: `sfdx force:org:delete -p`  
- **Unit tests**: `sfdx-lwc-jest` or `npm run test:unit`  
- **Lint**: `npm run lint`  

## Testing & Quality
- **Dataset Retrieval**: Verify `getDatasets` returns only `Default`/`Live` datasets with `EinsteinAnalytics` license.  
- **Performance**: Chart renders within **1 second** after data load.  
- **Filters** refresh data on **Render** click.  
- **Security**: Enforce sharing & CRUD in LWC.  
- **Maintainability**: Follow modern JS & Apex standards for readability and future extensions.  

## Extensibility
- **New Charts**: Add a `chartType` parameter in `dynamicCharts.js` and adjust ApexCharts `options`.  
- **Server Logic**: Flesh out `DPOStateMachine.cls` and invoke via `@wire` or imperative Apex.

## Agents
### dashboardRetriever
- **Description**: Retrieves the full CRM Analytics (Wave) dashboard JSON definition from Salesforce using the REST API and extracts the editable `state` object to save locally.

- **Inputs**:
  - `dashboardApiName`: The API name (`DeveloperName`) of the CRM Analytics dashboard (e.g., `My_Dashboard`).

- **Behavior**:
  1. Authenticates into the Salesforce org (must have Wave API access and token).
  2. Retrieves the dashboard ID by querying the `WaveDashboard` object:
     ```bash
     sf data query --query "SELECT Id FROM WaveDashboard WHERE DeveloperName = '${dashboardApiName}'" --json
     ```
     - Parses the `records[0].Id` as `dashboardId`.
  3. Uses the Salesforce REST API to fetch the full dashboard definition:
     - Makes a GET request to:
       ```
       /services/data/v60.0/wave/dashboards/${dashboardId}
       ```
     - Authenticated using `Bearer ${ACCESS_TOKEN}`
     - The response structure looks like:
       ```json
       {
         "id": "...",
         "name": "...",
         "state": {
           ...dashboard definition here...
         }
       }
       ```
  4. Extracts the `state` object from the response JSON.
  5. Saves the `state` as a standalone JSON file:
     - File path: `dashboards/${dashboardApiName}.json`
     - File content:
       ```json
       { ... contents of "state" ... }
       ```
  6. Reports success or failure:
     - Fails if the dashboard is not found, token is invalid, or the response lacks a `state` object.
     - Warns if the file could not be written.

- **Preconditions**:
  - The user is authenticated to Salesforce and has permissions for:
    - SOQL query on `WaveDashboard`
    - GET access to `/wave/dashboards/{dashboardId}`
  - The environment must expose:
    - `ACCESS_TOKEN`: Salesforce OAuth bearer token
    - `INSTANCE_URL`: Salesforce instance domain (e.g., `myorg.my.salesforce.com`)
  - A local directory `dashboards/` exists or will be created.

- **Output**:
  - A local JSON file named `dashboards/${dashboardApiName}.json` containing the dashboard's editable state.

### dashboardReader
- **Description**: takes the output from `dashboardRetriever` and extracts chart definitions.
- **Behavior**:
  - Input: Dashboard JSON file from CRM Analytics.
  - Parses and extracts each chart’s:
    - Type (e.g., bar, line, pie)
    - Title
    - Dimensions (e.g., x-axis, y-axis fields)
    - SAQL query or underlying data query
  - Checks existing LWC component for charts with the same title or identifier.
    - If a chart exists, compares definitions and flags modifications if the JSON has changed.

### lwcBuilder
- **Description**: Takes the output from `dashboardReader` and updates the LWC component.
- **Behavior**:
  - Input: List of chart definitions from `dashboardReader`.
  - Updates `dynamicCharts.html`:
    - Adds new `<div>` containers for each chart.
    - Ensures correct Lightning markup (e.g., `<lightning-card>` wrappers).
  - Updates `dynamicCharts.js`:
    - Injects or updates SAQL queries and series configuration.
    - Applies filter hooks so charts refresh correctly.
  - Modifies existing chart definitions if flagged by `dashboardReader`.

### sfdcDeployer
- **Description**: Automates deployment of LWC code to a Salesforce org.
- **Behavior**:
  - Uses Salesforce CLI v2 (`sf`) commands when available, with fallback to `sfdx`:
    - `sf project deploy start --source-dir force-app` to deploy source to the default org.
    - `sf org open` (or `sfdx force:org:open`) to preview the deployed component.
    - `npm run test:unit` to execute local Jest tests.
    - Optionally `npm run lint` to enforce code quality.
  - Reports success or failure of each step.
  - If no default org is configured, runs:
    - `sf org login web --set-default --alias myOrg` to authenticate via browser.

- **Fallback Logic (optional)**:
  - If `sf` is not installed or fails, uses `sfdx force:source:push` instead.

- **Preconditions**:
  - Node.js and npm are installed.
  - Salesforce CLI (`sf`) is installed and accessible in PATH.
  - Project includes valid `force-app/` source directory.

## Workflow
1. **dashboardRetriever**
   - Retrieves the dashboard JSON from the target org
   - Extracts "state" object
   - Saves dashboard locally for next step

2. **dashboardReader**  
   - Run against the target dashboard JSON.  
   - Outputs a normalized list of chart definitions (type, title, dimensions, query).  

3. **lwcBuilder**  
   - Consumes chart definitions from `dashboardReader`.  
   - Updates LWC markup and JavaScript to reflect new or modified charts.  

4. **sfdcDeployer**  
   - Deploys the updated LWC code to Salesforce via SFDX.  
   - Runs tests and opens the org for verification.

