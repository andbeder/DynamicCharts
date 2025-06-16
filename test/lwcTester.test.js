const fs = require("fs");
const path = require("path");
jest.mock("child_process", () => ({ execSync: jest.fn() }));
const { execSync } = require("child_process");

const tester = require("../scripts/agents/lwcTester");

describe("lwcTester", () => {
  const baseDir = path.join(__dirname, "lwcTester");

  beforeEach(() => {
    fs.rmSync(baseDir, { recursive: true, force: true });
    jest.clearAllMocks();
  });

  test("creates test folder structure", () => {
    tester.ensureTestStructure(baseDir);
    expect(fs.existsSync(path.join(baseDir, "unit"))).toBe(true);
    expect(fs.existsSync(path.join(baseDir, "integration"))).toBe(true);
    expect(fs.existsSync(path.join(baseDir, "__mocks__"))).toBe(true);
    expect(fs.existsSync(path.join(baseDir, "reports"))).toBe(true);
  });

  test("installs missing dev dependencies when node_modules is empty", () => {
    const tmp = fs.mkdtempSync(path.join(__dirname, "deps-"));
    fs.writeFileSync(
      path.join(tmp, "package.json"),
      JSON.stringify({
        devDependencies: {
          "sfdx-lwc-jest": "1.0.0",
          apexcharts: "1.0.0",
          "jest-canvas-mock": "1.0.0"
        }
      })
    );
    const cwd = process.cwd();
    process.chdir(tmp);
    tester.ensureDevDependencies();
    process.chdir(cwd);
    fs.rmSync(tmp, { recursive: true, force: true });
    expect(execSync).toHaveBeenCalledWith(
      "npm install --save-dev sfdx-lwc-jest apexcharts jest-canvas-mock",
      { stdio: "inherit" }
    );
  });

  test("runs unit tests by default", () => {
    tester.runTests();
    expect(execSync).toHaveBeenCalledWith("npm run test:lwc:unit", {
      stdio: "inherit"
    });
  });

  test("runs integration tests when flag provided", () => {
    tester.runTests({ integration: true });
    expect(execSync).toHaveBeenCalledWith("npm run test:lwc:integration", {
      stdio: "inherit"
    });
  });

  test("runs lint in ci mode", () => {
    tester.runTests({ ci: true });
    expect(execSync).toHaveBeenNthCalledWith(1, "npm run lint", {
      stdio: "inherit"
    });
    expect(execSync).toHaveBeenNthCalledWith(2, "npm run test:lwc:unit", {
      stdio: "inherit"
    });
  });
});
