# AGENTS.md

> **Note**: `AGENTS.md` files serve as specialized documentation to guide Codex on your project’s structure, conventions, setup, and commands.

## Project Overview

* **Name**: SAC Charts
* **Purpose**: A Lightning Web Component (`dynamicCharts`) that fetches CRM Analytics datasets via SAQL, applies user‐selected filters, and renders interactive charts using ApexCharts.

## File Structure

```
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
```

## Environment Setup

1. **Node.js & npm**: Ensure Node.js (v14+) and npm are installed.
2. **Dependencies & CLI**:

   * Install project dependencies:

     ```bash
     npm install          # installs sfdx-lwc-jest, linters, etc.
     ```
   * Install Salesforce CLI:

     ```bash
     npm install -g @salesforce/cli
     ```
3. **Authentication & Org**:

   * JWT key (`jwt.key`) must be present at project root.
   * Use `sfdcAuthorizer` agent to perform authentication (see Agents section).
4. **Deploy & Develop**:

   ```bash
   sf project deploy start --source-dir force-app
   sf org open
   ```

## Coding Conventions

* **ES6 Modules**: `import { … } from '…';`
* **Variables**: Use `const`/`let` (no `var`).
* **SAQL**: Build queries dynamically in `dynamicCharts.js`, combining filters with `filter q by …`.
* **UI**:

  * Dual list boxes for **host**, **nation**, **season**
  * Combo box for **ski** with options **All**, **Yes**, **No**
  * `<lightning-card>` wrapper and `<div class="chart1">` for the bar chart

## Commands Reference

* **Push source**: `sf project deploy start --source-dir force-app`
* **Pull source**: `sf project retrieve start --source-dir force-app`
* **Open org**: `sf org open`
* **Delete org**: `sf org delete -p`
* **Unit tests**: `npm run test:unit` or `sfdx-lwc-jest`
* **Lint**: `npm run lint`

## Testing & Quality

* **Dataset Retrieval**: Verify `getDatasets` returns only `Default`/`Live` datasets with `EinsteinAnalytics` license.
* **Performance**: Chart renders within **1 second** after data load.
* **Filters** refresh data on **Render** click.
* **Security**: Enforce sharing & CRUD in LWC.
* **Maintainability**: Follow modern JS & Apex standards for readability and future extensions.

## Extensibility

* **New Charts**: Add a `chartType` parameter in `dynamicCharts.js` and adjust ApexCharts `options`.
* **Server Logic**: Flesh out `DPOStateMachine.cls` and invoke via `@wire` or imperative Apex.

## Agents

### sfdcAuthorizer

* **Description**: Installs required Salesforce CLI plugins and authenticates into the target org using JWT.
* **Behavior**:

  1. Installs Salesforce CLI globally:

     ```bash
     npm install -g @salesforce/cli
     ```
  2. Logs into Salesforce via JWT:

     ```bash
     sf org login jwt \
       -i 3MVG9XgkMlifdwVAA3YLU.YAgszhXc3HIDrpHaKyzpUhgusGKYXhm92lAgKYPvfviYQmosjdr.FqBtXfe.UB_ \
       --jwt-key-file ./jwt.key \
       --username andbeder@gmail.com \
       --alias myJwtOrg \
       --instance-url https://mcicvermont7-dev-ed.develop.my.salesforce.com \
       --set-default
     ```
* **Preconditions**:

  * `jwt.key` file exists in project root.
  * npm and Node.js are installed.
* **Output**: Salesforce CLI ready in PATH, default org alias `myJwtOrg` is authenticated.

### dashboardRetriever

* **Description**: Retrieves the CRM Analytics dashboard JSON definition (editable `state`) from Salesforce.
* **Inputs**:

  * `dashboardApiName`: DeveloperName of the dashboard.
* **Behavior**:

  1. Ensures `sfdcAuthorizer` has run to authenticate.
  2. Queries `WaveDashboard` to get `Id`:

     ```bash
     sf data query --query "SELECT Id FROM WaveDashboard WHERE DeveloperName='${dashboardApiName}'" --json
     ```
  3. Fetches full dashboard definition via REST API:

     ```bash
     sf rest /services/data/v60.0/wave/dashboards/${dashboardId}
     ```
  4. Extracts `state` from response and saves:

     * Path: `dashboards/${dashboardApiName}.json`
  5. Reports success or failure.
* **Preconditions**:

  * Authenticated org via `sfdcAuthorizer`.
  * `dashboards/` directory exists or is created.

### dashboardReader

* **Description**: Parses dashboard JSON to extract chart definitions.
* **Behavior**:

  * Reads `dashboards/${dashboardApiName}.json`.
  * Creates JSON chart definition based on `CHART_JSON_DEFINITION.MD`
  * Updates dashboard entries in `charts.json` to reflect new state

### lwcReader

* **Description**: Parses LWC components and writes `charts.json`
* **Behavior**

  * Reads LWC files
  * Parses out charts, ignoring AO charts
  * Writes `charts.json` based on `CHART_JSON_DEFINITION.MD`

### updateAnalyzer

* **Description**: Analyzes chart content of `charts.json` based on `CHART_JSON_DEFINITION.MD` and compares it against the existing code base.
* **Behavior**:

  * Reads `charts.json` and parses chart metadata
  * Analyzes current state of LWC files
  * Recommends changes to the LWC

### chartBuilder

* **Description**: Updates LWC component with the charts from `updateAnalyzer`.
* **Behavior**:

  * Adds or updates `<div>` containers in `dynamicCharts.html`.
  * Injects SAQL queries and series into `dynamicCharts.js`.
  * Ensures filter hooks and Lightning markup consistency.

### lwcRefector

* **Description**: Updates LWC component based on instructions from codex.
* **Behavior**:

  * Creates new LWC components.
  * Refectors existing LWC components.
  * Ensures code transparency, efficiency and reliability.

### sfdcDeployer

* **Description**: Deploys the updated LWC code to Salesforce.
* **Behavior**:

  1. Ensures `sfdcAuthorizer` has run.
  2. Deploys source:

     ```bash
     sf project deploy start --source-dir force-app
     ```
  3. Opens org for verification:

     ```bash
     sf org open
     ```
  4. Runs local unit tests:

     ```bash
     npm run test:unit
     ```
  5. Optionally runs lint:

     ```bash
     npm run lint
     ```
* **Preconditions**:

  * Installed CLI Plugins and Authenticated org via `sfdcAuthorizer`.
  * Node.js, npm, and Salesforce CLI installed.
  * `force-app/` directory present.

## Workflows

### Chart update Workflow

1. **User Request**: "I've added a new chart to the CR-02 dashboard. Pleaes push this change to the org."
2. **Agent Chain**:

  1. `sfdcAuthorizer` installs jest, sf plugin and authorizes org
  2. `dashboardRetriever` finds the dashboard, downloads the current version and saves the STATE locally
  3. `dashboardReader` parses the dashboard JSON, isolates charts and updates charts.json based on them.
  4. `chartBuilder` analyzes the LWC and charts.json, determines changes and makes them
  5. `sfdcDeployer` pushes changes to org

### JSON Engineer Workflow

1. **User Request**: "Please refactor `charts.json` based on LWC"
2. ** Agent Chain**:

  1. `lwcReader`: Parses LWC components and reverse-engineers `charts.json`