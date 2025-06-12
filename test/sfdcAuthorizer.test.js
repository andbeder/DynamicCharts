const path = require("path");
jest.mock("child_process", () => ({ execSync: jest.fn() }));
const { execSync } = require("child_process");

describe("sfdcAuthorizer", () => {
  const originalEnv = { ...process.env };
  const scriptPath = "../scripts/agents/sfdcAuthorizer";
  afterEach(() => {
    jest.resetModules();
    Object.assign(process.env, originalEnv);
  });

  test("builds correct sfdx command with env vars", () => {
    process.env.SFDC_USERNAME = "test@example.com";
    process.env.SFDC_CLIENT_ID = "123456";
    process.env.SFDC_LOGIN_URL = "https://test.salesforce.com";

    const authorize = require(scriptPath);
    authorize();

    const keyPath = path.resolve(__dirname, "..", "jwt.key");
    const expected =
      `sfdx auth:jwt:grant --clientid 123456 --jwtkeyfile ${keyPath} ` +
      "--username test@example.com --instanceurl https://test.salesforce.com --setdefaultusername";

    expect(execSync).toHaveBeenCalledWith(expected, { stdio: "inherit" });
  });
});
