const path = require("path");
jest.mock("child_process", () => ({ execSync: jest.fn() }));
jest.mock("fs", () => ({
  existsSync: jest.fn(() => true),
  readFileSync: jest.fn(() => "")
}));
const { execSync } = require("child_process");

describe("sfdcAuthorizer", () => {
  const originalEnv = { ...process.env };
  const scriptPath = "../scripts/agents/sfdcAuthorizer";
  afterEach(() => {
    jest.resetModules();
    Object.assign(process.env, originalEnv);
  });

  test("builds correct sf command with env vars", () => {
    process.env.SFDC_USERNAME = "test@example.com";
    process.env.SFDC_CLIENT_ID = "123456";
    process.env.SFDC_LOGIN_URL = "https://test.salesforce.com";

    const authorize = require(scriptPath);
    authorize();

    const keyPath = path.resolve(__dirname, "..", "jwt.key");
    const expected =
      `sf org login jwt --client-id 123456 --jwt-key-file ${keyPath} ` +
      "--username test@example.com --instance-url https://test.salesforce.com --set-default";

    expect(execSync).toHaveBeenCalledWith(expected, { stdio: "inherit" });
  });
});
