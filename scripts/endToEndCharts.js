#!/usr/bin/env node

const sfdcAuthorizer = require("./agents/sfdcAuthorizer");
const dashboardRetriever = require("./agents/dashboardRetriever");
const dashboardReader = require("./agents/dashboardReader");
const sfdcDeployer = require("./agents/sfdcDeployer");

function runEndToEnd({ dashboard } = {}) {
  const dash = dashboard || process.env.npm_config_dashboard;
  sfdcAuthorizer();
  dashboardRetriever({ dashboardApiName: dash });
  dashboardReader({ dashboardApiName: dash });
  sfdcDeployer();
}

if (require.main === module) {
  const opts = {};
  process.argv.slice(2).forEach((arg) => {
    if (arg.startsWith("--dashboard=")) {
      opts.dashboard = arg.split("=")[1];
    } else if (arg.startsWith("--dashboard-api-name=")) {
      opts.dashboard = arg.split("=")[1];
    }
  });
  runEndToEnd(opts);
}

module.exports = runEndToEnd;
