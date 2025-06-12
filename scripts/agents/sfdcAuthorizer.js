// scripts/agents/sfdcAuthorizer.js
// Loads JWT key from Base64 env var or .env fallback without external modules
// Uses the Salesforce CLI JWT flow via shell

const os = require("os");
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
  const keyB64 = process.env.SF_JWT_KEY_BASE64;

  if (!username || !clientId || !keyB64) {
    console.error(
      "Error: SFDC_USERNAME, SFDC_CLIENT_ID, and SF_JWT_KEY_BASE64 must be set"
    );
    process.exit(1);
  }

  // Write the JWT key to a temp file
  const keyFile = path.join(os.tmpdir(), "jwt.key");
  try {
    fs.writeFileSync(keyFile, Buffer.from(keyB64, "base64"));
  } catch (err) {
    console.error("Failed to write JWT key:", err);
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
