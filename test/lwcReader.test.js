const fs = require('fs');
const path = require('path');
const parseLWC = require('../scripts/agents/lwcReader');

describe('lwcReader', () => {
  const tmpDir = path.join(__dirname, 'lwc');
  const jsFile = path.join(tmpDir, 'dynamicCharts.js');
  const htmlFile = path.join(tmpDir, 'dynamicCharts.html');
  const outFile = path.join(tmpDir, 'rev.json');

  beforeEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.copyFileSync(
      path.resolve(__dirname, '../force-app/main/default/lwc/dynamicCharts/dynamicCharts.js'),
      jsFile
    );
    fs.copyFileSync(
      path.resolve(__dirname, '../force-app/main/default/lwc/dynamicCharts/dynamicCharts.html'),
      htmlFile
    );
  });

  test('parses chart settings and writes file', () => {
    const result = parseLWC({ jsFile, htmlFile, outputFile: outFile, silent: true });
    const data = JSON.parse(fs.readFileSync(outFile, 'utf8'));
    expect(data).toEqual(result);
    expect(data.charts.length).toBe(7);
    const ids = data.charts.map(c => c.id).sort();
    expect(ids).toEqual(
      ['ClimbsByNation', 'TimeByPeak', 'CampsByPeak', 'climbs-by-nation', 'time-by-peak', 'camps-by-peak', 'deaths-by-peak'].sort()
    );
  });

  test('throws when js file missing', () => {
    fs.unlinkSync(jsFile);
    expect(() => parseLWC({ jsFile, htmlFile, outputFile: outFile })).toThrow(/JS file not found/);
  });
});
