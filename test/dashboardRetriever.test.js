const fs = require("fs");
const path = require("path");
jest.mock("child_process", () => ({ execSync: jest.fn() }));
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

  test("builds correct CLI command and creates directory", () => {
    retrieve({ dashboardApiName: "CR-02", outputDir: tempDir });
    const expectedCmd = `sf analytics:dashboard:export --name CR-02 --output-dir ${path.resolve(tempDir)}`;
    expect(execSync).toHaveBeenCalledWith(expectedCmd, { stdio: "inherit" });
    expect(fs.existsSync(tempDir)).toBe(true);
  });

  test("looks up API name using label", () => {
    process.env.SF_ACCESS_TOKEN = "token";
    process.env.SF_INSTANCE_URL = "https://example.my.salesforce.com";
    execSync.mockReturnValueOnce(
      JSON.stringify({ dashboards: [{ label: "My Dash", name: "MY_DASH" }] })
    );
    retrieve({ dashboardLabel: "My Dash", outputDir: tempDir });
    const curlCmd =
      'curl -s -H "Authorization: Bearer token" https://example.my.salesforce.com/services/data/v59.0/wave/dashboards';
    const exportCmd = `sf analytics:dashboard:export --name MY_DASH --output-dir ${path.resolve(tempDir)}`;
    expect(execSync).toHaveBeenNthCalledWith(1, curlCmd, { encoding: "utf8" });
    expect(execSync).toHaveBeenNthCalledWith(2, exportCmd, {
      stdio: "inherit"
    });
  });

  test("throws when required args are missing", () => {
    expect(() => retrieve({})).toThrow(
      "dashboardApiName or dashboardLabel is required"
    );
  });
});
