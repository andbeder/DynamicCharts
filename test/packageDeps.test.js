const fs = require('fs');
const path = require('path');

describe('package.json devDependencies', () => {
  test('includes Salesforce CLI and Jest', () => {
    const pkgPath = path.resolve(__dirname, '../package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    expect(pkg.devDependencies).toHaveProperty('@salesforce/cli');
    expect(pkg.devDependencies).toHaveProperty('jest');
  });
});
