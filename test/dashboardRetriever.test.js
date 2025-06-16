const path = require("path");
jest.mock("child_process", () => ({ execSync: jest.fn() }));
jest.mock("fs", () => ({
  readFileSync: jest.fn(() => "token"),
  existsSync: jest.fn(() => true),
  rmSync: jest.fn(),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
}));
const fs = require("fs");
const { execSync } = require("child_process");

const retrieve = require("../scripts/agents/dashboardRetriever");

describe("dashboardRetriever", () => {
  const tempDir = path.join(__dirname, "tmp-output");
  const originalEnv = { ...process.env };

  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
    Object.assign(process.env, originalEnv);
  });

  test("retrieves JSON using API name", () => {
    process.env.SF_ACCESS_TOKEN = "token";
    process.env.SF_INSTANCE_URL = "https://example.my.salesforce.com";
    execSync.mockReturnValueOnce("{ }\n");

    retrieve({ dashboardApiName: "CR-02", outputDir: tempDir });

    const expectedCmd =
      'curl -s -H "Authorization: Bearer token" "https://example.my.salesforce.com/services/data/v60.0/wave/dashboards/CR-02"';
    expect(execSync).toHaveBeenCalledWith(expectedCmd, { encoding: "utf8" });
    expect(fs.existsSync(path.join(tempDir, "CR-02.json"))).toBe(true);
  });

  test("looks up API name using label", () => {
    process.env.SF_ACCESS_TOKEN = "token";
    process.env.SF_INSTANCE_URL = "https://example.my.salesforce.com";
    execSync.mockReturnValueOnce(
      JSON.stringify({ dashboards: [{ label: "My Dash", name: "MY_DASH" }] })
    );
    execSync.mockReturnValueOnce("{ }\n");

    retrieve({ dashboardLabel: "My Dash", outputDir: tempDir });

    const queryCmd =
      'curl -s -H "Authorization: Bearer token" "https://example.my.salesforce.com/services/data/v59.0/wave/dashboards"';
    const getCmd =
      'curl -s -H "Authorization: Bearer token" "https://example.my.salesforce.com/services/data/v60.0/wave/dashboards/MY_DASH"';

    expect(execSync).toHaveBeenNthCalledWith(1, queryCmd, { encoding: "utf8" });
    expect(execSync).toHaveBeenNthCalledWith(2, getCmd, { encoding: "utf8" });
    expect(fs.existsSync(path.join(tempDir, "MY_DASH.json"))).toBe(true);
  });

  test("throws when required args are missing", () => {
    expect(() => retrieve({})).toThrow(
      "dashboardApiName or dashboardLabel is required"
    );
  });

  test("throws when REST response contains error", () => {
    process.env.SF_ACCESS_TOKEN = "token";
    process.env.SF_INSTANCE_URL = "https://example.my.salesforce.com";
    execSync.mockReturnValueOnce(
      JSON.stringify({ errorCode: "NOT_FOUND", message: "not found" })
    );

    expect(() =>
      retrieve({ dashboardApiName: "BAD", outputDir: tempDir })
    ).toThrow("Dashboard retrieval failed: not found");
  });

  test("throws when JSON cannot be parsed", () => {
    process.env.SF_ACCESS_TOKEN = "token";
    process.env.SF_INSTANCE_URL = "https://example.my.salesforce.com";
    execSync.mockReturnValueOnce("<html></html>");

    expect(() =>
      retrieve({ dashboardApiName: "CR-02", outputDir: tempDir })
    ).toThrow(/Failed to parse dashboard JSON/);
  });
});
