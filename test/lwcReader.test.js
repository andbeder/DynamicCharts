const fs = require('fs');
const path = require('path');
const generateLWCs = require('../scripts/agents/lwcReader');

describe('lwcReader', () => {
  const tmpDir = path.join(__dirname, 'lwc');
  const chartsFile = path.join(tmpDir, 'charts.json');

  beforeEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.mkdirSync(tmpDir, { recursive: true });
  });

  test('generates lwc components for each chart', () => {
    const charts = {
      charts: [
        { id: 'TestChart', type: 'bar', title: 'Test Chart', fieldMappings: {} }
      ]
    };
    fs.writeFileSync(chartsFile, JSON.stringify(charts));

    const count = generateLWCs({ chartsFile, outputDir: tmpDir });
    expect(count).toBe(1);

    const compPath = path.join(tmpDir, 'test-chart');
    expect(fs.existsSync(path.join(compPath, 'test-chart.js'))).toBe(true);
    expect(fs.existsSync(path.join(compPath, 'test-chart.html'))).toBe(true);
    expect(fs.existsSync(path.join(compPath, 'test-chart.js-meta.xml'))).toBe(true);

    const jsContent = fs.readFileSync(path.join(compPath, 'test-chart.js'), 'utf8');
    expect(jsContent).toContain('class TestChart');
  });

  test('throws when charts file missing', () => {
    expect(() => generateLWCs({ chartsFile, outputDir: tmpDir })).toThrow(/charts file not found/);
  });
});
