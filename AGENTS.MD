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
