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
### Important Files

1. **charts.json**: Intemediary output of chart processing holding chart configuration details. This is updated by the `dashboardReader` agent and read by the `chartBuilder` agent
2. **revEngCharts.json**: This version of the output reflects the LWC state of charts reverse-engingeered from their configuration

## Environment Setup

1. **Node.js & npm**: Ensure Node.js (v14+) and npm are installed.
2. **Dependencies & CLI**:

   * Install project dependencies:

     ```bash
     npm install          # installs sfdx-lwc-jest, linters, etc.
     ```
   * Install Salesforce CLI:

     ```bash
     npm install -g @salesforce/cli --silent
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

   **Description**:  
   Installs required Salesforce CLI plugins and authenticates into the target Salesforce org using JWT-based authorization.

   **Behavior**:

   1. Installs Salesforce CLI globally:

      ```bash
      npm install -g @salesforce/cli --silent
      ```

   2. Logs into Salesforce using JWT authentication:

      ```bash
      sf org login jwt \
      -i 3MVG9XgkMlifdwVAA3YLU.YAgszhXc3HIDrpHaKyzpUhgusGKYXhm92lAgKYPvfviYQmosjdr.FqBtXfe.UB_ \
      --jwt-key-file ./jwt.key \
      --username andbeder@gmail.com \
      --alias myJwtOrg \
      --instance-url https://mcicvermont7-dev-ed.develop.my.salesforce.com \
      --set-default
      ```

   **Preconditions**:

   - `jwt.key` file exists in the project root.
   - Node.js and npm are installed.

   **Output**:  
   Salesforce CLI is globally available in the PATH, and the default org alias `myJwtOrg` is authenticated and ready.

   ---

### dashboardRetriever

  **Description**  
  Retrieves the editable `state` JSON definition of a CRM Analytics dashboard from Salesforce using the Wave REST API and `curl`.

  ---

  #### Inputs

  - `dashboardApiName`: The `DeveloperName` of the target dashboard.  
  - `accessToken`: OAuth access token (provided by `sfdcAuthorizer`).  
  - `instanceUrl`: Base URL of the authenticated Salesforce org (e.g., `https://yourInstance.salesforce.com`).  

  ---

  #### Behavior

  1. **Confirm Authentication**  
    Ensure session is authenticated via `sfdcAuthorizer`, which provides:
    - `accessToken`
    - `instanceUrl`

  2. **Retrieve Full Dashboard Definition by API Name**  
    Use the Wave REST API to retrieve the dashboard JSON directly by API name:

    ```bash
    curl -s -H "Authorization: Bearer ${accessToken}" \
      -H "Content-Type: application/json" \
      "${instanceUrl}/services/data/v60.0/wave/dashboards/${dashboardApiName}" \
      -o "dashboards/${dashboardApiName}_full.json"
    ```

  3. **Extract `state` Object**  
    Use `jq` to isolate and save the `state` object:

    ```bash
    jq '.state' "dashboards/${dashboardApiName}_full.json" > "dashboards/${dashboardApiName}.json"
    ```

  4. **Report Success or Failure**  
    Log a message based on whether `dashboards/${dashboardApiName}.json` was successfully created.

  ---

  #### Preconditions

  - Salesforce org is authenticated and valid `accessToken` and `instanceUrl` are set.
  - `jq` is installed for JSON parsing.
  - `dashboards/` directory exists or is created using:

    ```bash
    mkdir -p dashboards
    ```
### dashboardReader

  **Description**  
  Parses Salesforce dashboard JSON files to extract structured chart definitions compatible with ApexCharts. Produces normalized entries in `charts.json` that are consumable by Lightning Web Components (LWC).

  **Behavior**  
  - Reads input from `dashboards/${dashboardApiName}.json`
  - Applies parsing rules defined in `DASHBOARD_PARSING_INSTRUCTIONS.MD`
  - Outputs chart definitions to `charts.json`, replacing or appending entries by `chart.id`

  **Assumptions**  
  - `title` is converted to kebab-case and used as `chart.id`
  - `subtitle` contains chart config as semi-colon-separated key-value pairs
  - Color names not in the defined scheme are treated as valid CSS colors

  **Error Handling**  
  - Skips and logs any chart definitions that are missing required fields or contain invalid subtitle metadata
  - Handles missing dashboard files or unrecognized steps gracefully

  **Dependencies**  
  - `DASHBOARD_PARSING_INSTRUCTIONS.MD`
  - `charts.json` (output file)


### lwcReader

  **Description**  
  Parses Lightning Web Components (LWCs) to reverse-engineer and regenerate `revEngCharts.json` definitions based on existing chart configurations used in code.

  **Behavior**  
  - Scans the LWC component directory for references to chart components
  - Identifies and extracts relevant chart metadata
  - Ignores ambient or auxiliary charts (e.g., those marked as "AO" or not tied to visualizations)
  - Writes structured chart definitions to `revEngCharts.json` using the rules defined in `CHART_JSON_DEFINITION.MD`

  **Assumptions**  
  - Each chart component contains sufficient metadata to reconstruct chart definitions
  - Chart IDs are inferred from component usage and matched against internal naming conventions
  - Color and display properties are aligned with those specified in the subtitle format

  **Error Handling**  
  - Logs and skips malformed chart references or components lacking necessary metadata
  
  **Dependencies**  
  - LWC component files (source of truth)
  - `CHART_JSON_DEFINITION.MD` (parsing rules)
  - `revEngCharts.json` (output file)


### chartSynchronizer

**Description**:  
Synchronizes the `dynamicCharts` Lightning Web Component (LWC) with chart definitions in `charts.json`, ensuring consistency across metadata, HTML markup, and JavaScript logic.

**Behavior**:

- **Analyze & Compare**:
  - Parses chart metadata from `charts.json` using the `CHART_JSON_DEFINITION.MD` specification.
  - Scans the current LWC source files (`dynamicCharts.html` and `dynamicCharts.js`) to detect missing, outdated, or misaligned chart elements.

- **Update & Inject**:
  - Adds or updates `<div>` containers in `dynamicCharts.html` to reflect each chart specified in `charts.json`.
  - For each chart, creates two versions:
    - A primary version based on selected filter values.
    - An AO (Alternate Output) version that applies inverse logic for the `host` and `nation` filters.
  - Injects or updates SAQL query strings and chart rendering logic in `dynamicCharts.js`.
  - Ensures charts are correctly wired to filter change events and that rendering hooks are consistent across chart types.
  - Applies style configurations and series formatting as defined in `charts.json`.

**Outcome**:  
Ensures the `dynamicCharts` component remains fully synchronized with the central chart metadata file, supporting scalable updates and minimizing manual intervention.

### lwcRefactor

  **Description**:  
  Refactors and generates Lightning Web Components (LWC) based on codex-driven instructions to improve maintainability, performance, and scalability.

  **Behavior**:

  - Creates new LWC components based on defined architecture or codex output.
  - Refactors existing LWC components to align with best practices.
  - Optimizes for code readability, modularity, and performance.
  - Ensures resulting code is transparent, efficient, and reliable.

  ---

### lwcTester

  **Description**:  
  Validates Lightning Web Components by executing Jest-based unit tests to ensure functional reliability and deployment readiness.

  **Behavior**:

  1. Verifies that the org is authenticated via `sfdcAuthorizer`.
  2. Installs the Salesforce Jest testing plugin (if not already present):

    ```bash
    npm install --save-dev sfdx-lwc-jest --silent
    ```

  3. Generates or updates Jest test scripts for the target LWC components.
  4. Executes the full test suite.
  5. Captures and reports test outcomes, including success/failure diagnostics.

  **Preconditions**:

  - An authenticated Salesforce org via `sfdcAuthorizer`.


### sfdcDeployer

   **Description**:  
   Deploys the updated LWC codebase to a Salesforce org and validates the deployment through automated tests and optional linting.

   **Behavior**:

   1. Confirms authentication via `sfdcAuthorizer`.
   2. Deploys source code from the `force-app` directory:

      ```bash
      sf project deploy start --source-dir force-app
      ```

   3. Opens the Salesforce org for visual verification:

      ```bash
      sf org open
      ```

   4. Executes local unit tests to validate the deployed code:

      ```bash
      npm run test:unit
      ```

   5. Optionally runs linting checks:

      ```bash
      npm run lint
      ```

   **Preconditions**:

   - Salesforce CLI and Node.js installed.
   - Required CLI plugins installed.
   - Authenticated Salesforce org via `sfdcAuthorizer`.
   - `force-app/` directory exists and is correctly configured.

## Workflows

### 📈 Chart Update Workflow

  **User Request**:  
  _"Please read the dashboard `CR-02` and use it to refactor the LWC code, and push it to the org."_

  **Agent Sequence**:

  1. **`sfdcAuthorizer`**  
    Installs required Salesforce CLI plugins and authenticates into the target org.

  2. **`dashboardRetriever`**  
    Retrieves the `CR-02` dashboard from Salesforce and saves its editable `state` as a JSON file.

  3. **`dashboardReader`**  
    Parses the downloaded dashboard JSON and generates normalized chart definitions into `charts.json`.

  4. **`chartSynchronizer`**  
    Compares `charts.json` with existing LWC code and updates `dynamicCharts.html` and `dynamicCharts.js` accordingly.

  5. **`lwcTester`**  
    Runs Jest-based unit tests to validate correctness of the updated LWC implementation.

  6. **`sfdcDeployer`**  
    Deploys the updated LWC code to the authenticated Salesforce org and opens the org for manual verification.

  ---

### 🧾 LWC Reverse Engineer Workflow

  **User Request**:  
  _"Please regenerate the chart JSON configuration based on the current state of the LWC code."_

  **Agent Sequence**:

  1. **`lwcReader`**  
     Scans all relevant Lightning Web Component source files (typically `dynamicCharts.js` and `dynamicCharts.html`) and extracts structured chart metadata such as chart type, title, API mapping, and SAQL queries.  
     The agent filters out auxiliary or non-visual charts (e.g., AO-only charts), and writes the output to `revEngCharts.json` using parsing rules defined in `CHART_JSON_DEFINITION.MD`.

  2. **(Optional) `dashboardReader`**  
     Compares the regenerated `revEngCharts.json` with the latest dashboard-derived `charts.json` for alignment and detects discrepancies between declared and actual implementation.

  3. **(Optional) `chartSynchronizer`**  
     Uses `revEngCharts.json` as the input source to update or validate the LWC code, ensuring that the rendered charts match the current definitions reconstructed from code.

  **Outcome**:  
  Allows developers to reverse engineer and document the chart configuration directly from code when original dashboard definitions are unavailable or out of sync.
