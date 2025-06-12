// scripts/agents/sfdcAuthorizer.js
// Reads environment variables from a local .env file if present
// Uses an existing jwt.key to run the Salesforce CLI JWT auth flow

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Inline .env loader for environments where dotenv isn't installed
(function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, "utf8")
      .split(/\r?\n/)
      .forEach((line) => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (!match) return;
        let [, key, val] = match;
        val = val.trim();
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) process.env[key] = val;
      });
  }
})();

function authorize() {
  const username = process.env.SFDC_USERNAME;
  const clientId = process.env.SFDC_CLIENT_ID;
  const loginUrl = process.env.SFDC_LOGIN_URL || "https://login.salesforce.com";
  if (!username || !clientId) {
    console.error(
      "Error: SFDC_USERNAME and SFDC_CLIENT_ID must be set"
    );
    process.exit(1);
  }

  // Path to the jwt.key generated during session setup
  const keyFile = path.resolve(process.cwd(), "jwt.key");
  if (!fs.existsSync(keyFile)) {
    console.error("Error: jwt.key not found at project root");
    process.exit(1);
  }

  // Run the CLI JWT auth command
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

if (require.main === module) authorize();

module.exports = authorize;
