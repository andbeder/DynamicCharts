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
  Parses Salesforce dashboard JSON files to extract structured chart definitions compatible with ApexCharts. Produces normalized entries in `charts.json` that are consumable by downstream agents.

  **Behavior**  
  - Reads input from `dashboards/${dashboardApiName}.json`
  - Applies parsing rules defined in `DASHBOARD_PARSING_INSTRUCTIONS.MD`
  - Outputs chart definitions to `charts.json`, replacing or appending entries by `chart.id`

  **Assumptions**  
  - `title` is converted to kebab-case and used as `chart.id`
  - `subtitle` contains chart config as semi-colon-separated key-value pairs
  - Color names not in the defined scheme are treated as valid CSS colors
  - If a chart entry for that dashboard exist in `charts.json` but not on the dashboard, it should be removed from `charts.json`

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


### changeRequestGenerator

   **Description**  
   Compares the “authoritative” chart definitions in `charts.json` against the reverse-engineered charts in `revEngCharts.json`, and emits a `changeRequests.json` file with fine-grained, property-level instructions.

   **Behavior**  
   1. **Load inputs**  
      - Read `charts.json` → _authoritativeCharts_  
      - Read `revEngCharts.json` → _currentCharts_

   2. **Build lookup maps**  
      - Map each by `chart.id` for quick compare.

   3. **Detect added & removed charts**  
      - **add**: in _authoritativeCharts_ but not in _currentCharts_  
      - **remove**: in _currentCharts_ but not in _authoritativeCharts_

   4. **Detect updated charts**  
      - For each `chartId` present in both sets:
      1. Compare each schema property (e.g. `title`, `type`, `saql`, `seriesColors`, `xAxis.label`, filter settings, etc.).
      2. For every property where `currentCharts[chartId][prop] !== authoritativeCharts[chartId][prop]`, record a mismatch:
         ```jsonc
         {
            "property": "<propName>",
            "currentValue": <value from revEngCharts.json>,
            "expectedValue": <value from charts.json>
         }
         ```
      3. If any mismatches exist, classify this as an **update**.

   5. **Construct change-request objects**  
      For each difference (`add` / `remove` / `update`), build:
      ```json
      {
      "chartId": "<chart.id>",
      "action": "add" | "remove" | "update",
      "targetFile": "dynamicCharts.html" | "dynamicCharts.js",
      "mismatches": [ /* only for updates: array of property diffs */ ],
      "instructions": [
         /* 
            - For adds: e.g. "Insert `<div class='chart{{chartId}}'>…</div>` into dynamicCharts.html" 
            - For removes: e.g. "Remove `<div class='chart{{chartId}}'>…</div>`" 
            - For updates: for each mismatch, 
            "In dynamicCharts.js, update `{{property}}` from `{{currentValue}}` to `{{expectedValue}}`"
         */
      ]
      }
      ```

   6. **Write output**  
      - Serialize the array of change-request objects to `changeRequests.json` (or under `change-requests/`).

   **Preconditions**  
   - Valid JSON in both `charts.json` and `revEngCharts.json`.  
   - A JSON diffing helper (e.g. `deep-diff` or custom comparator) is available.  
   - Output directory exists or is creatable.

   **Dependencies**  
   - `CHART_JSON_DEFINITION.MD` (for schema reference)  
   - `charts.json`  
   - `revEngCharts.json`  
   - JSON comparison library

   **Output**  
   - `changeRequests.json`: full list of per-chart, per-property changes required to sync your LWC.

### chartSynchronizer

**Description**  
Applies the fine-grained change requests produced by `changeRequestGenerator` to the `dynamicCharts` Lightning Web Component, updating HTML markup and JS logic to bring the component into sync with `charts.json`.

**Behavior**

1. **Load change requests**  
   - Read `changeRequests.json` (or `change-requests/*.json`) as an array of change-request objects.

2. **Process each change-request**  
   For each entry in the array:  
   - **add**  
     - In `dynamicCharts.html`: insert the `<div>` container snippet provided (or generate it from the request) at the appropriate location.  
     - In `dynamicCharts.js`: add initialization (SAQL string, ApexCharts instantiation, filter hooks) as specified.  
   - **remove**  
     - In `dynamicCharts.html`: remove the `<div>` block whose `chartId` matches.  
     - In `dynamicCharts.js`: remove the corresponding query string, render call, and any filter-binding logic for that chart.  
   - **update**  
     - Iterate over `mismatches[]`:  
       - If the mismatch’s `targetFile` is `dynamicCharts.html`, locate the relevant attribute or markup and replace the `currentValue` with the `expectedValue`.  
       - If the mismatch’s `targetFile` is `dynamicCharts.js`, locate the SAQL definition, option object, filter mapping, etc., and update each property from `currentValue` → `expectedValue`.  
     - Optionally: group multiple property updates for the same chart into a single patch operation.  
   - **Options validation**  
     - Whenever you’re adding or updating an ApexCharts `options` object, reference the official sub-sections under **https://apexcharts.com/docs/options/** (e.g. `chart/`, `plotOptions/`, `dataLabels/`, `grid/`, `tooltip/`, `xaxis/`, `yaxis/`, etc.) to ensure you’re using the correct JSON structure and supported property names.

3. **Write changes back**  
   - Overwrite `dynamicCharts.html` and `dynamicCharts.js` with the applied modifications.  
   - Log a summary of all applied changes (e.g., “3 adds, 2 removes, 5 updates applied”).

**Preconditions**  
- `changeRequests.json` exists and is valid.  
- Original `dynamicCharts.html` and `dynamicCharts.js` are parseable (e.g., well-formed HTML and JS).  
- A utility or parsing library (e.g., an HTML/JS AST manipulator) is available.

**Dependencies**  
- `changeRequests.json` (from `changeRequestGenerator`)  
- `dynamicCharts.html`  
- `dynamicCharts.js`

**Output**  
- Updated `dynamicCharts.html` and `dynamicCharts.js` reflecting all requested adds, removes, and property-level updates.

**Outcome**  
Ensures the `dynamicCharts` component remains fully synchronized with the central chart metadata file, supports scalable updates, and leverages the ApexCharts options docs for proper JSON configuration.

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

  **User Request**  
    _"Please read the dashboard `CR-02`, generate a change-request, apply it to the LWC, and push the updated code to the org."_
    _"Please update the charts based on dashboard `CR-02`."_

  **Agent Sequence**:

  1. **`sfdcAuthorizer`**  
    Installs required Salesforce CLI plugins and authenticates into the target org.

  2. **`dashboardRetriever`**  
    Retrieves the `CR-02` dashboard from Salesforce and saves its editable `state` as `dashboards/CR-02.json`.

  3. **`dashboardReader`**  
    Parses `dashboards/CR-02.json` and writes the normalized chart definitions to `charts.json`.

  4. **`lwcReader`**  
    Reverse-engineers the existing `dynamicCharts` LWC and writes its live chart definitions to `revEngCharts.json`.

  5. **`changeRequestGenerator`**  
    Compares `charts.json` vs. `revEngCharts.json` and emits `changeRequests.json` with per-chart, per-property add/remove/update instructions.

  6. **`chartSynchronizer`**  
    Consumes `changeRequests.json` and applies all adds, removes, and property-level updates to `dynamicCharts.html` and `dynamicCharts.js`.

  7. **`lwcTester`**  
    Runs Jest-based unit tests to verify the updated LWC implementation behaves as expected.

  8. **`sfdcDeployer`**  
    Deploys the revised `force-app` source to the authenticated Salesforce org and opens the org for final verification.

  **Outcome**  
  A `dynamicCharts` component that is fully synchronized with the dashboard definition and deployed to your org.

  ---

### 🧾 LWC Reverse Engineer Workflow

  **User Request**:  
  _"Please regenerate the chart JSON configuration based on the current state of the LWC code."_

  **Agent Sequence**:

  1. **`lwcReader`**  
     Scans all relevant Lightning Web Component source files (typically `dynamicCharts.js` and `dynamicCharts.html`) and extracts structured chart metadata such as chart type, title, API mapping, and SAQL queries.  
     The agent filters out auxiliary or non-visual charts (e.g., AO-only charts), and writes the output to `revEngCharts.json` using parsing rules defined in `CHART_JSON_DEFINITION.MD`.

  **Outcome**:  
  Allows developers to reverse engineer and document the chart configuration directly from code when original dashboard definitions are unavailable or out of sync.

  ---

### 📝 Change Request Generation Workflow

  **User Request**:  
  _"Please generate a change-request file to sync the LWC with `charts.json`."_

  **Agent Sequence**:

  1. **`changeRequestGenerator`**  
    Compares `charts.json` and `revEngCharts.json` and writes out `changeRequests.json`.

  **Outcome**:  
  A `changeRequests.json` file listing all additions, removals, and updates needed in `dynamicCharts.html` and `dynamicCharts.js`.

### 🔄 Change Request Apply & Deploy Workflow

**User Request**  
_"Please apply the pending change requests to the LWC and deploy them to the org."_

**Agent Sequence**:

1. **`sfdcAuthorizer`**  
   Ensure the Salesforce CLI is installed and authenticate into the target org.

2. **`chartSynchronizer`**  
   Consume `changeRequests.json` and apply all add/remove/update operations to `dynamicCharts.html` and `dynamicCharts.js`.

3. **`lwcTester`**  
   Run Jest-based unit tests (`npm run test:unit` or `sfdx-lwc-jest`) to verify the updated component.

4. **`sfdcDeployer`**  
   Deploy the revised `force-app` source to the authenticated Salesforce org and open the org for final verification:

   ```bash
   sf project deploy start --source-dir force-app
   sf org open
   ```
  **Outcome**:  
  The dynamicCharts component is updated per the change requests, validated by unit tests, and deployed to your Salesforce org.