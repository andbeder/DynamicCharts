const fs = require('fs');
const path = require('path');
jest.mock('child_process', () => ({ execSync: jest.fn() }));
const { execSync } = require('child_process');

const tester = require('../scripts/agents/lwcTester');

describe('lwcTester', () => {
  const baseDir = path.join(__dirname, 'lwcTester');

  beforeEach(() => {
    fs.rmSync(baseDir, { recursive: true, force: true });
    jest.clearAllMocks();
  });

  test('creates test folder structure', () => {
    tester.ensureTestStructure(baseDir);
    expect(fs.existsSync(path.join(baseDir, 'unit'))).toBe(true);
    expect(fs.existsSync(path.join(baseDir, 'integration'))).toBe(true);
    expect(fs.existsSync(path.join(baseDir, '__mocks__'))).toBe(true);
    expect(fs.existsSync(path.join(baseDir, 'reports'))).toBe(true);
  });

  test('runs unit tests by default', () => {
    tester.runTests();
    expect(execSync).toHaveBeenCalledWith('npm run test:lwc:unit', { stdio: 'inherit' });
  });

  test('runs integration tests when flag provided', () => {
    tester.runTests({ integration: true });
    expect(execSync).toHaveBeenCalledWith('npm run test:lwc:integration', { stdio: 'inherit' });
  });

  test('runs lint in ci mode', () => {
    tester.runTests({ ci: true });
    expect(execSync).toHaveBeenNthCalledWith(1, 'npm run lint', { stdio: 'inherit' });
    expect(execSync).toHaveBeenNthCalledWith(2, 'npm run test:lwc:unit', { stdio: 'inherit' });
  });
});
