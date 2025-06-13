// scripts/agents/sfdcDeployer.js
// Deploys metadata to a Salesforce org using the `sf` CLI

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const authorize = require('./sfdcAuthorizer');

function writeReport(content) {
  const reportsDir = path.resolve('reports');
  fs.mkdirSync(reportsDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const file = path.join(reportsDir, `deploy-report-${timestamp}.json`);
  fs.writeFileSync(file, content);
  console.log(`Deployment report written to ${file}`);
  return file;
}

function sfdcDeployer({
  sourceDir = 'force-app/main/default',
  checkOnly = false,
  verbose = false,
  wait = 10
} = {}) {
  authorize();

  const baseCmd = checkOnly
    ? 'sf project deploy validate'
    : 'sf project deploy start';

  const args = [
    `--source-dir ${path.resolve(sourceDir)}`,
    `--wait ${wait}`,
    '--json'
  ];
  if (verbose) args.push('--verbose');

  const cmd = `${baseCmd} ${args.join(' ')}`;
  const output = execSync(cmd, { encoding: 'utf8' });
  const reportPath = writeReport(output);
  return { cmd, reportPath };
}

if (require.main === module) {
  const opts = {};
  process.argv.slice(2).forEach((arg) => {
    if (arg.startsWith('--source-dir=')) {
      opts.sourceDir = arg.split('=')[1];
    } else if (arg === '--checkonly' || arg === '-c') {
      opts.checkOnly = true;
    } else if (arg === '--verbose' || arg === '-v') {
      opts.verbose = true;
    } else if (arg.startsWith('--wait=')) {
      opts.wait = parseInt(arg.split('=')[1], 10);
    }
  });
  sfdcDeployer(opts);
}

module.exports = sfdcDeployer;
module.exports.writeReport = writeReport;
