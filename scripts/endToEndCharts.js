#!/usr/bin/env node

const sfdcAuthorizer = require('./agents/sfdcAuthorizer');
const dashboardRetriever = require('./agents/dashboardRetriever');
const dashboardReader = require('./agents/dashboardReader');
const lwcReader = require('./agents/lwcReader');
const changeRequestGenerator = require('./agents/changeRequestGenerator');
const syncCharts = require('./agents/syncCharts');
const lwcTester = require('./agents/lwcTester');
const sfdcDeployer = require('./agents/sfdcDeployer');

function runEndToEnd({ dashboard } = {}) {
  sfdcAuthorizer();
  dashboardRetriever({ dashboardApiName: dashboard });
  dashboardReader({ dashboardApiName: dashboard });
  lwcReader();
  changeRequestGenerator();
  syncCharts();
  lwcTester();
  sfdcDeployer();
}

if (require.main === module) {
  const opts = {};
  process.argv.slice(2).forEach((arg) => {
    if (arg.startsWith('--dashboard=')) {
      opts.dashboard = arg.split('=')[1];
    } else if (arg.startsWith('--dashboard-api-name=')) {
      opts.dashboard = arg.split('=')[1];
    }
  });
  runEndToEnd(opts);
}

module.exports = runEndToEnd;
