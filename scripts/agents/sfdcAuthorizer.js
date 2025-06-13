#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

/**
 * Performs a JWT-based SFDX login and writes the access token to tmp/accessToken.txt
 */
function authorize() {
  const alias = "myJwtOrg";
  const clientId = process.env.SFDC_CLIENT_ID;
  const keyFile = "./jwt.key";
  const username = process.env.SFDC_USERNAME;
  const instanceUrl = process.env.SFDC_LOGIN_URL;

  try {
    // 1) Log in via JWT
    execSync(
      `sf org login jwt \
        -i "${clientId}" \
        --jwt-key-file "${keyFile}" \
        --username "${username}" \
        --alias "${alias}" \
        --instance-url "${instanceUrl}" \
        --set-default`,
      { stdio: "inherit" }
    );

    // 2) Retrieve the org info as JSON
    const displayJson = execSync(
      `sf org display --target-org "${alias}" --json`,
      { encoding: "utf8" }
    );
    const token = JSON.parse(displayJson).result?.accessToken;
    if (!token)
      throw new Error("No accessToken found in sf org display output.");

    // 3) Ensure tmp directory exists
    const tmpDir = path.resolve(process.cwd(), "tmp");
    fs.mkdirSync(tmpDir, { recursive: true });

    // 4) Write token to tmp/accessToken.txt
    const outPath = path.join(tmpDir, "accessToken.txt");
    fs.writeFileSync(outPath, token, "utf8");
    console.log(`✔ Access token written to ${outPath}`);
  } catch (err) {
    console.error("❌ Error during JWT login or token write:", err.message);
    process.exit(1);
  }
}

// If this script is run directly, perform the authorization immediately
if (require.main === module) {
  authorize();
}

// Export the authorize function for programmatic use
module.exports = authorize;
