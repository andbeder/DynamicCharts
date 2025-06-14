const path = require("path");
jest.mock("child_process", () => ({ execSync: jest.fn() }));
jest.mock("fs", () => ({
  existsSync: jest.fn(() => true),
  readFileSync: jest.fn(() => ""),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn()
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

    execSync.mockReturnValueOnce("");
    execSync.mockReturnValueOnce(
      JSON.stringify({ result: { accessToken: "TOKEN" } })
    );

    const authorize = require(scriptPath);
    authorize();

    const call = execSync.mock.calls[0][0];
    expect(call).toContain("sf org login jwt");
    expect(call).toContain("--username \"test@example.com\"");
    expect(call).toContain("-i \"123456\"");
    expect(call).toContain("--instance-url \"https://test.salesforce.com\"");
  });
});
