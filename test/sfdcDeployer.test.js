const fs = require('fs');
const path = require('path');

jest.mock('child_process', () => ({ execSync: jest.fn() }));
jest.mock('../scripts/agents/sfdcAuthorizer', () => jest.fn());

const { execSync } = require('child_process');
const deployer = require('../scripts/agents/sfdcDeployer');

describe('sfdcDeployer', () => {
  const reportsDir = path.resolve('reports');

  beforeEach(() => {
    fs.rmSync(reportsDir, { recursive: true, force: true });
    jest.clearAllMocks();
  });

  test('builds deploy command and writes report', () => {
    execSync.mockReturnValueOnce('{"status":"Succeeded"}');
    const { cmd, reportPath } = deployer({
      sourceDir: 'src',
      verbose: true,
      wait: 5
    });
    const expectedCmd = `sf project deploy start --source-dir ${path.resolve('src')} --wait 5 --json --verbose`;
    expect(execSync).toHaveBeenCalledWith(expectedCmd, { encoding: 'utf8' });
    expect(fs.existsSync(reportPath)).toBe(true);
    expect(cmd).toBe(expectedCmd);
  });

  test('uses validate when checkonly', () => {
    execSync.mockReturnValueOnce('{}');
    const { cmd } = deployer({ checkOnly: true });
    expect(cmd.startsWith('sf project deploy validate')).toBe(true);
  });
});
