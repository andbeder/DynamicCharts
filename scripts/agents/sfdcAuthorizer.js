// authorize.js
// Loads Salesforce CLI library, and JWT key from a Base64-encoded environment variable
// Uses the Salesforce CLI JWT flow without checking the key into source control.

// Load the Salesforce CLI library
require("@salesforce/cli");
require("dotenv").config();

const os = require("os");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

function authorize() {
  const username = process.env.SFDC_USERNAME;
  const clientId = process.env.SFDC_CLIENT_ID;
  const loginUrl = process.env.SFDC_LOGIN_URL || "https://login.salesforce.com";
  const keyB64 = process.env.SF_JWT_KEY_BASE64;

  if (!username || !clientId || !keyB64) {
    console.error(
      "Error: SFDC_USERNAME, SFDC_CLIENT_ID, and SF_JWT_KEY_BASE64 must be set"
    );
    process.exit(1);
  }

  // Decode Base64 key and write to a temporary file
  const keyFile = path.join(os.tmpdir(), "jwt.key");
  try {
    fs.writeFileSync(keyFile, Buffer.from(keyB64, "base64"));
  } catch (err) {
    console.error("Failed to write JWT key to file:", err);
    process.exit(1);
  }

  // Construct the `sf` CLI command for JWT auth
  const cmd = [
    "sf org login jwt",
    `--client-id ${clientId}`,
    `--jwt-key-file ${keyFile}`,
    `--username ${username}`,
    `--instance-url ${loginUrl}`,
    `--set-default`
  ].join(" ");

  try {
    execSync(cmd, { stdio: "inherit" });
  } catch (err) {
    console.error("Authorization failed:", err);
    process.exit(1);
  }
}

if (require.main === module) {
  authorize();
}

module.exports = authorize;
