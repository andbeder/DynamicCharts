# AGENTS.md

> **Note**: `AGENTS.md` files serve as specialized documentation to guide Codex on your project’s structure, conventions, setup, and commands.

## Project Overview

* **Name**: Dynamic Charts
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
      -o "tmp/${dashboardApiName}_full.json"
    ```

  3. **Extract `state` Object**  
    Use `jq` to isolate and save the `state` object:

    ```bash
    jq '.state' "tmp/${dashboardApiName}_full.json" > "tmp/${dashboardApiName}.json"
    ```

  4. **Report Success or Failure**  
    Log a message based on whether `tmp/${dashboardApiName}.json` was successfully created.

  ---

  #### Preconditions

  - Salesforce org is authenticated and valid `accessToken` and `instanceUrl` are set.
  - `jq` is installed for JSON parsing.
  - `tmp/` directory exists or is created using:

    ```bash
    mkdir -p tmp
    ```

  #### Output

  - `tmp/${dashboardApiName}.json`: the state of the dashboard requested (not under source control)

### dashboardReader

  **Description**  
  Parses Salesforce dashboard JSON files to extract structured chart definitions compatible with ApexCharts. Produces normalized entries in `charts.json` that are consumable by downstream agents.

  **Behavior**  
  - Reads input from `tmp/${dashboardApiName}.json`
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

### changeRequestInterpreter

  **Description**  
  Continuously synchronizes your LWC change‐request script with both the structured diffs in `changeRequests.json` and the authoritative ApexCharts Options API documentation, ensuring every abstract “property” maps to a real, up-to-date `options.*` path and sample code.

  **Inputs**  
  - `changeRequests.json` (array of `{ chartId, action, targetFile, mismatches, instructions }`)  
  - ApexCharts Options API docs URL (`https://apexcharts.com/docs/options/`)

  **Behavior**  
  1. **Load** and parse `changeRequests.json`.  
  2. **Fetch & parse** the Options API docs:  
    - Use an HTTP client (e.g. `axios`) plus an HTML parser (e.g. `cheerio`) to retrieve and extract every option name, its full path (e.g. `chart.dropShadow`), default values, and code examples.  
    - Build an in‐memory mapping:
      ```js
      {
        seriesColors: { path: 'colors', example: "colors: ['#F00','#0F0']" },
        font:         { path: 'chart.fontFamily', example: "chart: { fontFamily: 'Helvetica' }" },
        shadow:       { path: 'chart.dropShadow', example: `chart: {
          dropShadow: {
            enabled: true,
            top: 2, left: 2, blur: 4, opacity: 0.35
          }
        }` },
        // ...all other documented options
      }
      ```
  3. **For each** change‐request:  
    - **add**  
      - Generate an HTML snippet insertion (if `targetFile === 'dynamicCharts.html'`).  
      - Or generate a JS init snippet invoking `new ApexCharts(elem, { …existingConfig, <mapped options> })`.  
    - **remove**  
      - Emit a “Remove the `<div class='chart-{{chartId}}'>…</div>` block from dynamicCharts.html” or “Remove the corresponding `chart.updateOptions({...})` call in dynamicCharts.js.”  
    - **update**  
      - **For each** mismatch in `.mismatches`:  
        1. Look up `m.property` in the docs mapping to get the real `options` path and example shape.  
        2. Compose a precise `chart.updateOptions({...})` call, merging in default values for any nested fields not affected by this change.  
        3. If the docs mapping is missing a property, fall back to a generic `updateOptions({ <property>: <value> })` and log a warning to extend the mapping.  
  4. **Monitor** the ApexCharts docs URL on a **daily** schedule (or on every run) and **refresh** the mapping so that any new options (or renamed paths) are automatically ingested.  
  5. **Aggregate** all generated edits into a **numbered list**, prefixing each entry with file & chart ID, and **write** out `changeRequestInstructions.txt`.  

  **Dependencies**  
  - Node.js ≥v14  
  - npm modules:
    - `axios` (HTTP fetch)  
    - `cheerio` (HTML parsing)  
    - `deep-diff` or similar (for JSON diffs)  
    - `fs` / `path` (file I/O)  
  - Access to `https://apexcharts.com/docs/options/`  

  **Output**  
  - `changeRequestInstructions.txt`: a human-readable, fully-code-snippet-driven, ordered list of exact ApexCharts edits—pulled straight from the latest docs—ready for direct copy-and-paste into your LWC source.

### chartSynchronizer

  **Description**
  Applies the detailed developer instructions from `changeRequestInstructions.txt` to the `dynamicCharts` Lightning Web Component, updating both HTML markup and JS logic according to the provided steps.

  **Inputs**

  * `changeRequestInstructions.txt` (text file with numbered, human‐readable edit steps)
  * `dynamicCharts.html` and `dynamicCharts.js` (source files)

  **Behavior**

  1. **Load** and read `changeRequestInstructions.txt` line by line.
  2. **Parse** each numbered instruction into actionable edits, identifying:

    * Target file (`dynamicCharts.html` or `dynamicCharts.js`)
    * Operation type (insert, remove, update)
    * Content snippet or property change details
  3. **For each** instruction in order:

    * **Open** the specified file and **apply** the edit:

      * **Insert**: place the snippet at the indicated location
      * **Remove**: locate and delete the specified block or line
      * **Update**: find the existing value and replace it with the new value
  4. **Write** the modified files back to disk.
  5. **Log** a summary of applied instructions (e.g., “Applied 5 inserts, 3 removals, 4 updates”).

  **Preconditions**

  * A valid `changeRequestInstructions.txt` file exists with clear, numbered steps.
  * `dynamicCharts.html` and `dynamicCharts.js` are present and well-formed.

  **Dependencies**

  * A text‐parsing or scripting utility (e.g., a Node.js script) capable of reading instructions and manipulating files.

  **Output**

  * Updated `dynamicCharts.html` and `dynamicCharts.js` reflecting all specified changes.

  **Outcome**
  Ensures your LWC source is synchronized by executing exactly the developer‐oriented instructions generated from the change requests.

### lwcTester

  **Description**
  Automates building, maintaining, and enhancing Jest-based unit and integration tests for the `dynamicCharts` Lightning Web Component. All test scripts are stored under the `test/lwcTester/` directory and are version-controlled alongside your application code.

  **Behavior**

  1. **Authenticate**

    * Verifies that the Salesforce org is authenticated via `sfdcAuthorizer`.

  2. **Install & Update Tooling**

    * Ensures the following devDependencies are installed and up-to-date:

      ```bash
      npm install --save-dev sfdx-lwc-jest apexcharts jest-canvas-mock --silent
      ```
    * Updates mocks and plugins as necessary.

  3. **Scaffold Test Structure**

    * Creates `test/lwcTester/` if it does not exist.
    * Initializes subdirectories:

      * `unit/` for Jest unit tests.
      * `integration/` for real-bundle integration tests.
      * `__mocks__/` for module mocks (e.g., `lightning/platformResourceLoader`).

  4. **Generate & Update Test Templates**

    * For each chart definition in `dynamicCharts.js` or `charts.json`, generates or refreshes parameterized test files:

      * Verifies SAQL query assembly.
      * Asserts correct ApexCharts instantiation and option merging.
      * Simulates filter UI interactions and validates re-render behavior.
    * Uses Jest snapshots where appropriate, prompting for snapshot updates when code changes.

  5. **Maintain Existing Tests**

    * Detects outdated or missing assertions when component code or chart configurations change.
    * Offers to update snapshots or generate placeholder specs for untested branches.

  6. **Enforce Coverage & Quality**

    * Applies minimum coverage thresholds (configurable in `jest.config.js`):

      * Statements: 80%
      * Branches: 75%
      * Functions: 80%
      * Lines: 80%
    * Reports missing coverage areas and creates TODO test stubs.
    * Integrates linting for test code via `npm run lint`.

  7. **Run & Watch Mode**

    * Executes tests on-demand:

      ```bash
      npm run test:lwc:unit
      npm run test:lwc:integration
      ```
    * Supports watch mode for real-time feedback:

      ```bash
      npm run test:lwc:unit -- --watch
      ```

  8. **Reporting**

    * Outputs test results and coverage summary to the console.
    * Generates detailed HTML reports and saves them to `test/lwcTester/reports/`.

  9. **CI Integration**

    * Updates `package.json` scripts to include:

      ```json
      "test:lwc:unit": "sfdx-lwc-jest test/lwcTester/unit --coverage",
      "test:lwc:integration": "sfdx-lwc-jest test/lwcTester/integration --runInBand",
      "test:lwc:ci": "npm run test:lwc:unit && npm run test:lwc:integration"
      ```
    * Ensures headless, environment-agnostic execution for CI pipelines.

  **Preconditions**

  * Authenticated Salesforce org via `sfdcAuthorizer`.
  * Valid `jest.config.js` in project root with appropriate module mappings and setup files.

  **Dependencies**

  * Node.js ≥ v14.
  * DevDependencies: `sfdx-lwc-jest`, `apexcharts`, `jest-canvas-mock`.
  * `test/lwcTester/` directory (auto-generated if absent).

  **Output**

  * A comprehensive, up-to-date test suite under `test/lwcTester/`.
  * Updated test-related scripts in `package.json`.
  * Coverage and test reports in `test/lwcTester/reports/`.

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
    Retrieves the `CR-02` dashboard from Salesforce and saves its editable `state` as `tmp/${dashboardApiName}`.

  3. **`dashboardReader`**  
    Parses `tmp/${dashboardApiName}` and writes the normalized chart definitions to `charts.json`.

  4. **`lwcReader`**  
    Reverse-engineers the existing `dynamicCharts` LWC and writes its live chart definitions to `revEngCharts.json`.

  5. **`changeRequestGenerator`**  
    Compares `charts.json` vs. `revEngCharts.json` and emits `changeRequests.json` with per-chart, per-property add/remove/update instructions.

  6. **`changeRequestInterpreter`**  
    Reads `changeRequests.json` and generates a set of LWC developer instructions to be followed to apply the changes written to `changeRequestInstructions.txt`.

  7. **`chartSynchronizer`**  
    Consumes `changeRequestInstructions.txt` and makes all changes to `dynamicCharts.html` and `dynamicCharts.js`.

  8. **`lwcTester`**  
    Runs Jest-based unit tests to verify the updated LWC implementation behaves as expected.

  9. **`sfdcDeployer`**  
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
  _"Please generate a change‐request file that syncs the LWC with the latest dashboard definition."_  

  **Agent Sequence**:

  1. **`sfdcAuthorizer`**  
    Ensure the Salesforce CLI is installed and authenticate into the target org.

  2. **`dashboardRetriever`**  
    Retrieve the specified dashboard and extract its `state` JSON to `dashboards/${dashboardApiName}.json`.

  3. **`dashboardReader`**  
    Parse `dashboards/${dashboardApiName}.json` and output the authoritative chart definitions to `charts.json`.

  4. **`lwcReader`**  
    Scan the existing `dynamicCharts` LWC and reverse‐engineer its live chart definitions into `revEngCharts.json`.

  5. **`changeRequestGenerator`**  
    Compare `charts.json` with `revEngCharts.json` and emit `changeRequests.json` containing:
    - **add** instructions for new charts,  
    - **remove** instructions for deprecated charts,  
    - **update** instructions for any property mismatches at the chart‐ and option‐level.

  **Outcome**:  
  A `changeRequests.json` file listing fine‐grained instructions to align `dynamicCharts.html` and `dynamicCharts.js` with your dashboard’s current metadata.

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

### 🔍 Change Request Interpretation Workflow

  **User Request**  
  _"Please generate detailed developer instructions from the existing change requests."_  

  **Agent Sequence**:

  1. **`changeRequestInterpreter`**  
    Reads `changeRequests.json`, translates each add/remove/update into human-readable LWC steps, and writes them to `changeRequestInstructions.txt`.  

  **Outcome**  
  A `changeRequestInstructions.txt` file containing a numbered list of concrete edits for `dynamicCharts.html` and `dynamicCharts.js`.  

### 🚀 Apply & Deploy Workflow

  **User Request**  
  _"Please apply the developer instructions, verify the changes, and deploy to the org."_  

  **Agent Sequence**:

  1. **`chartSynchronizer`**  
    Reads `changeRequestInstructions.txt` and applies each edit to `dynamicCharts.html` and `dynamicCharts.js`.

  2. **`lwcTester`**  
    Runs Jest-based unit and integration tests to confirm that the updated LWC behaves as expected.

  3. **`sfdcDeployer`**  
    Deploys the revised `force-app` source to your authenticated Salesforce org and opens the org for final verification.

  **Outcome**  
  Your Lightning Web Component is updated per the instructions, validated by tests, and deployed to the target org.  

### 📈 Change Request Definition Workflow

  **User Request**  
    _"Please read the dashboard `CR-02`, generate developer instructions to apply."_

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

  6. **`changeRequestInterpreter`**  
    Reads `changeRequests.json` and generates a set of LWC developer instructions to be followed to apply the changes written to `changeRequestInstructions.txt`.

  **Outcome**  
  `changeRequestInstructions.txt` has been generated with step-by-step instructions to apply the change request to any LWCs.


### 🐞 LWC Testing & Bug Report Workflow

  **User Request**
  *Run the full LWC test suite and generate a consolidated bug report.*

  **Agent Sequence**

  1. **`lwcTester`**

    * Installs/updates test tooling, scaffolds/maintains test scripts under `test/lwcTester/`, and executes both unit and integration suites using:

      ```bash
      npm run test:lwc:ci
      ```
    * Outputs raw Jest result JSON and coverage data in `test/lwcTester/reports/`.

  2. **`bugReporter`**

    * Parses the generated Jest JSON (`*.json`) and coverage summary (`coverage-summary.json`).
    * Extracts:

      * **Failures**: test names, error messages, and stack traces.
      * **Coverage Gaps**: modules or lines below configured thresholds.
      * **Snapshots**: any mismatches or outdated snapshots.
    * Compiles a Markdown report at `test/lwcTester/bug-report.md` including:

      * **Summary**: total tests run, passed, failed, and coverage percentages.
      * **Details**: per-test failure details and coverage deficits.
      * **Recommendations**: suggested areas for new or updated tests.

  **Output**

  * A human-readable `bug-report.md` summarizing all test failures and coverage issues, ready for developer action.
