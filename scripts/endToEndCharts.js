#!/usr/bin/env node

const sfdcAuthorizer = require('./agents/sfdcAuthorizer');
const dashboardRetriever = require('./agents/dashboardRetriever');
const dashboardReader = require('./agents/dashboardReader');
const lwcReader = require('./agents/lwcReader');
const changeRequestGenerator = require('./agents/changeRequestGenerator');
const syncCharts = require('./agents/syncCharts');
const lwcTester = require('./agents/lwcTester');
const sfdcDeployer = require('./agents/sfdcDeployer');

function runEndToEnd() {
  sfdcAuthorizer();
  dashboardRetriever();
  dashboardReader();
  lwcReader();
  changeRequestGenerator();
  syncCharts();
  lwcTester();
  sfdcDeployer();
}

if (require.main === module) {
  runEndToEnd();
}

module.exports = runEndToEnd;
