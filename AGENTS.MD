# AGENTS.md

> This file lists the agents implemented for the Dynamic Charts project and the high-level workflows that tie them together.

## Agents

All agent implementations live under `scripts/agents/`, with per-agent documentation in `docs/agents/`.
Each agent is responsible for providing a runnable Node.js script named after the
agent. The file must be placed at `scripts/agents/<agent name>.js` so the
automation commands can locate it.

| Agent Name                 | Script Path                                | Documentation                           |                       |
| -------------------------- | ------------------------------------------ | --------------------------------------- | --------------------- |
| **sfdcAuthorizer**         | `scripts/agents/sfdcAuthorizer.js`         | `docs/agents/sfdcAuthorizer.md`         |                       |
| **dashboardRetriever**     | `scripts/agents/dashboardRetriever.js`     | `docs/agents/dashboardRetriever.md`     |                       |
| **dashboardReader**        | `scripts/agents/dashboardReader.js`        | `docs/agents/dashboardReader.md`        |                       |
| **lwcReader**              | `scripts/agents/lwcReader.js`              | `docs/agents/lwcReader.md`              |                       |
| **lwcBuilder**             | `scripts/agents/lwcBuilder.js`             | `docs/agents/lwcBuilder.md`             |                       |
| **sfdcDeployer**           | `scripts/agents/sfdcDeployer.js`           | `docs/agents/sfdcDeployer.md`           |  |

## Workflows


### generate\:charts

   **Sequence**:

   1. **sfdcAuthorizer**

      * Authenticates with Salesforce and caches an access token.
   2. **dashboardRetriever**

      * Retrieves dashboard state JSON (e.g., `CR-02.json`).
   3. **dashboardReader**

      * Parses dashboard JSON into normalized chart definitions and writes `charts.json`.
   4. **lwcReader**

      * Reads `force-app\main\default\lwc\dynamicCharts\dynamicCharts.js` and `force-app\main\default\lwc\dynamicCharts\dynamicCharts.html` for chart components and ApexCharts options driving them
      * Writes `revEndCharts.json` based on `CHART_JSON_DEFINITION.MD` 

   **Outputs**: `charts.json`

   ---

### deploy\:charts

   1. **sfdcDeployer**

      * Deploys changes in `force-app/main/default` to the Salesforce org.

**Outputs**: Test reports and deployment logs. 


### end-to-end\:charts


   1. **sfdcAuthorizer**

      * Authenticates with Salesforce and caches an access token.
   2. **dashboardRetriever**

      * Retrieves dashboard state JSON (e.g., `CR-02.json`).
   3. **dashboardReader**

      * Parses dashboard JSON into normalized chart definitions and writes `charts.json`.
   4. **lwcReader**

      * Reads `charts.json` and generates LWC component files (`.js`, `.html`, `.js-meta.xml`).
   5. **sfdcDeployer**

      * Deploys changes in `force-app/main/default` to the Salesforce org.

  **Outputs**: `charts.json`, Updated LWC source files.

