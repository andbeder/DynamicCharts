// scripts/agents/dashboardRetriever.js
// Retrieves a CRM Analytics dashboard state JSON using the Salesforce CLI

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

function lookupApiNameByLabel(label) {
  const token = process.env.SF_ACCESS_TOKEN;
  const instance = process.env.SF_INSTANCE_URL;
  const apiVersion = process.env.SF_API_VERSION || "59.0";

  if (!token || !instance) {
    throw new Error("SF_ACCESS_TOKEN and SF_INSTANCE_URL must be set");
  }

  const url = `${instance}/services/data/v${apiVersion}/wave/dashboards`;
  const curlCmd = `curl -s -H "Authorization: Bearer ${token}" ${url}`;
  const output = execSync(curlCmd, { encoding: "utf8" });
  const dashboards = JSON.parse(output).dashboards || [];
  const match = dashboards.find((d) => d.label === label);
  if (!match) {
    throw new Error(`Dashboard with label ${label} not found`);
  }
  return match.name;
}

function retrieveDashboard({
  dashboardApiName,
  dashboardLabel,
  outputDir = "tmp"
}) {
  if (!dashboardApiName) {
    if (!dashboardLabel) {
      throw new Error("dashboardApiName or dashboardLabel is required");
    }
    dashboardApiName = lookupApiNameByLabel(dashboardLabel);
  }

  const outDir = path.resolve(process.cwd(), outputDir);
  fs.mkdirSync(outDir, { recursive: true });

  const cmd = [
    "sf analytics:dashboard:export",
    `--name ${dashboardApiName}`,
    `--output-dir ${outDir}`
  ].join(" ");

  execSync(cmd, { stdio: "inherit" });
  return cmd;
}

if (require.main === module) {
  let apiName;
  let label;
  let dir = "tmp";
  process.argv.forEach((arg) => {
    if (arg.startsWith("--dashboard-api-name=")) {
      apiName = arg.split("=")[1];
    } else if (arg.startsWith("--dashboard-label=")) {
      label = arg.split("=")[1];
    } else if (arg.startsWith("--output-dir=")) {
      dir = arg.split("=")[1];
    }
  });
  retrieveDashboard({
    dashboardApiName: apiName,
    dashboardLabel: label,
    outputDir: dir
  });
}

module.exports = retrieveDashboard;
