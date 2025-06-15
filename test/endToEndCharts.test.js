jest.mock('../scripts/agents/sfdcAuthorizer', () => jest.fn());
jest.mock('../scripts/agents/dashboardRetriever', () => jest.fn());
jest.mock('../scripts/agents/dashboardReader', () => jest.fn());
jest.mock('../scripts/agents/lwcReader', () => jest.fn());
jest.mock('../scripts/agents/changeRequestGenerator', () => jest.fn());
jest.mock('../scripts/agents/syncCharts', () => jest.fn());
jest.mock('../scripts/agents/lwcTester', () => jest.fn());
jest.mock('../scripts/agents/sfdcDeployer', () => jest.fn());

const sfdcAuthorizer = require('../scripts/agents/sfdcAuthorizer');
const dashboardRetriever = require('../scripts/agents/dashboardRetriever');
const dashboardReader = require('../scripts/agents/dashboardReader');
const lwcReader = require('../scripts/agents/lwcReader');
const changeRequestGenerator = require('../scripts/agents/changeRequestGenerator');
const syncCharts = require('../scripts/agents/syncCharts');
const lwcTester = require('../scripts/agents/lwcTester');
const sfdcDeployer = require('../scripts/agents/sfdcDeployer');

const runEndToEnd = require('../scripts/endToEndCharts');

function callOrder(mockFn) {
  return mockFn.mock.invocationCallOrder[0] || 0;
}

describe('endToEndCharts workflow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('runs agents in sequence with dashboard parameter', () => {
    runEndToEnd({ dashboard: 'CR_02' });
    expect(dashboardRetriever).toHaveBeenCalledWith({ dashboardApiName: 'CR_02' });
    expect(dashboardReader).toHaveBeenCalledWith({ dashboardApiName: 'CR_02' });
    const order = [
      sfdcAuthorizer,
      dashboardRetriever,
      dashboardReader,
      lwcReader,
      changeRequestGenerator,
      syncCharts,
      lwcTester,
      sfdcDeployer,
    ].map(callOrder);

    for (let i = 0; i < order.length - 1; i++) {
      expect(order[i]).toBeLessThan(order[i + 1]);
    }
  });

  test('reads dashboard from npm_config_dashboard env var', () => {
    process.env.npm_config_dashboard = 'ENV_02';
    runEndToEnd();
    expect(dashboardRetriever).toHaveBeenCalledWith({ dashboardApiName: 'ENV_02' });
    expect(dashboardReader).toHaveBeenCalledWith({ dashboardApiName: 'ENV_02' });
  });
});
