const fs = require("fs");
const path = require("path");

describe("package.json agent scripts", () => {
  test("defines npm scripts for each agent", () => {
    const pkg = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, "../package.json"), "utf8")
    );
    const scripts = pkg.scripts || {};
    const agents = [
      "sfdcAuthorizer",
      "dashboardRetriever",
      "dashboardReader",
      "lwcBuilder",
      "sfdcDeployer"
    ];
    agents.forEach((a) => expect(scripts).toHaveProperty(a));
    expect(scripts.dashboardRetriever).toMatch(
      /--dashboard-api-name=\$npm_config_dashboard/
    );
    expect(scripts.dashboardReader).toMatch(
      /--dashboard-api-name=\$npm_config_dashboard/
    );
  });
});
