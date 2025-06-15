const path = require("path");
jest.mock("child_process", () => ({ execSync: jest.fn() }));
jest.mock("fs", () => ({
  existsSync: jest.fn(() => false),
  readFileSync: jest.fn(() => ""),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn()
}));
const { execSync } = require("child_process");
const exitSpy = jest.spyOn(process, "exit").mockImplementation(() => {});

describe("sfdcAuthorizer", () => {
  const originalEnv = { ...process.env };
  const scriptPath = "../scripts/agents/sfdcAuthorizer";
  afterEach(() => {
    jest.clearAllMocks();
    Object.assign(process.env, originalEnv);
    exitSpy.mockClear();
  });

  afterAll(() => {
    exitSpy.mockRestore();
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

  test("reuses token when valid", () => {
    const fs = require("fs");
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue("cached");
    process.env.SF_INSTANCE_URL = "https://example.my.salesforce.com";
    execSync.mockImplementationOnce(() => "200");

    const authorize = require(scriptPath);
    authorize();

    expect(execSync).toHaveBeenCalledTimes(1);
    expect(execSync.mock.calls[0][0]).toContain(
      "https://example.my.salesforce.com/services/data/v60.0"
    );
  });

  test("reuses token using login URL when instance not set", () => {
    const fs = require("fs");
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue("cached");
    process.env.SFDC_LOGIN_URL = "https://test.salesforce.com";
    delete process.env.SF_INSTANCE_URL;
    execSync.mockImplementationOnce(() => "200");

    const authorize = require(scriptPath);
    authorize();

    expect(execSync).toHaveBeenCalledTimes(1);
    expect(execSync.mock.calls[0][0]).toContain(
      "https://test.salesforce.com/services/data/v60.0"
    );
  });

  test("logs in when cached token rejected", () => {
    const fs = require("fs");
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue("old");
    execSync
      .mockImplementationOnce(() => "401")
      .mockImplementationOnce(() => "")
      .mockImplementationOnce(() =>
        JSON.stringify({ result: { accessToken: "NEW" } })
      )
      .mockImplementation(() => "200");

    const authorize = require(scriptPath);
    authorize();

    const loginCall = execSync.mock.calls[1][0];
    expect(loginCall).toContain("sf org login jwt");
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      path.join(path.resolve("tmp"), "access_token.txt"),
      "NEW",
      "utf8"
    );
  });
});
