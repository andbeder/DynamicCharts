const fs = require('fs');
const path = require('path');
const buildLwc = require('../scripts/agents/lwcBuilder');

describe('lwcBuilder', () => {
  const tmpDir = path.join(__dirname, 'lwcBuilder');
  const chartsFile = path.join(tmpDir, 'charts.json');

  beforeEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.copyFileSync(path.resolve(__dirname, '../charts.json'), chartsFile);
  });

  test('generates component files from charts', () => {
    const result = buildLwc({ chartsFile, outputDir: tmpDir, silent: true });
    expect(fs.existsSync(result.htmlFile)).toBe(true);
    expect(fs.existsSync(result.jsFile)).toBe(true);
    expect(fs.existsSync(result.metaFile)).toBe(true);
    const js = fs.readFileSync(result.jsFile, 'utf8');
    const html = fs.readFileSync(result.htmlFile, 'utf8');
    expect(js).toMatch(/chartSettings/);
    expect(js).toMatch(/climbs-by-nation/);
    expect(html).toMatch(/climbs-by-nation/);
  });

  test('throws when charts file missing', () => {
    fs.unlinkSync(chartsFile);
    expect(() => buildLwc({ chartsFile, outputDir: tmpDir })).toThrow(/Charts file not found/);
  });

  test('uses defaults when no options passed', () => {
    const cwd = process.cwd();
    const projDir = path.join(tmpDir, 'proj');
    fs.mkdirSync(projDir, { recursive: true });
    fs.copyFileSync(chartsFile, path.join(projDir, 'charts.json'));
    process.chdir(projDir);
    try {
      buildLwc();
      const jsPath = path.join(projDir, 'force-app/main/default/lwc/dynamicCharts/dynamicCharts.js');
      expect(fs.existsSync(jsPath)).toBe(true);
    } finally {
      process.chdir(cwd);
    }
  });
});
