const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

function authorize() {
  const username = process.env.SFDC_USERNAME;
  const clientId = process.env.SFDC_CLIENT_ID;
  const loginUrl = process.env.SFDC_LOGIN_URL || 'https://login.salesforce.com';
  const keyFile = path.resolve(__dirname, '..', '..', 'jwt.key');

  if (!username || !clientId) {
    console.error('SFDC_USERNAME and SFDC_CLIENT_ID environment variables are required');
    process.exitCode = 1;
    return;
  }
  if (!fs.existsSync(keyFile)) {
    console.error(`JWT key file missing at ${keyFile}`);
    process.exitCode = 1;
    return;
  }

  const cmd = `sfdx auth:jwt:grant --clientid ${clientId} --jwtkeyfile ${keyFile} ` +
    `--username ${username} --instanceurl ${loginUrl} --setdefaultusername`;
  try {
    execSync(cmd, { stdio: 'inherit' });
  } catch (err) {
    console.error('Authorization failed');
    process.exitCode = 1;
  }
}

if (require.main === module) {
  authorize();
}

module.exports = authorize;
