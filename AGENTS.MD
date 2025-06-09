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
  - `<lightning-card>` wrapper and `<div class="chart1">` for the bar chart  

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
### dashboardReader
- **Description**: Ingests a CRM Analytics dashboard JSON and extracts chart definitions.
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
  - Uses Salesforce CLI (`sfdx`) commands:
    - `sfdx force:source:push` to deploy local source to the scratch/org.
    - `sfdx force:org:open` to preview the deployed component.
    - `npm run test:unit` to execute local Jest tests.
    - Optionally `npm run lint` to enforce code quality.
  - Reports success or failure of each step.

## Workflow
1. **dashboardReader**  
   - Run against the target dashboard JSON.  
   - Outputs a normalized list of chart definitions (type, title, dimensions, query).  

2. **lwcBuilder**  
   - Consumes chart definitions from `dashboardReader`.  
   - Updates LWC markup and JavaScript to reflect new or modified charts.  

3. **sfdcDeployer**  
   - Deploys the updated LWC code to Salesforce via SFDX.  
   - Runs tests and opens the org for verification.

