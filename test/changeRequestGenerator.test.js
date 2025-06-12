const fs = require('fs');
const path = require('path');
const generate = require('../scripts/agents/changeRequestGenerator');

describe('changeRequestGenerator', () => {
  const tmpDir = path.join(__dirname, 'crg');
  const chartsFile = path.join(tmpDir, 'charts.json');
  const revFile = path.join(tmpDir, 'rev.json');
  const outFile = path.join(tmpDir, 'out.json');

  beforeEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.mkdirSync(tmpDir, { recursive: true });
  });

  test('generates expected change requests from sample data', () => {
    fs.copyFileSync(path.resolve(__dirname, '../charts.json'), chartsFile);
    fs.copyFileSync(path.resolve(__dirname, '../revEngCharts.json'), revFile);

    const result = generate({ chartsFile, revEngChartsFile: revFile, outputFile: outFile, silent: true });
    const expected = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../changeRequests.json'), 'utf8'));
    const output = JSON.parse(fs.readFileSync(outFile, 'utf8'));
    expect(result).toEqual(expected);
    expect(output).toEqual(expected);
  });

  test('detects added and removed charts', () => {
    const charts = { charts: [{ id: 'A', title: 'a' }, { id: 'B', title: 'b' }] };
    const rev = { charts: [{ id: 'B', title: 'b' }, { id: 'C', title: 'c' }] };
    fs.writeFileSync(chartsFile, JSON.stringify(charts));
    fs.writeFileSync(revFile, JSON.stringify(rev));

    const result = generate({ chartsFile, revEngChartsFile: revFile, outputFile: outFile, silent: true });
    const actions = result.changes.map(c => `${c.action}:${c.chartId}`).sort();
    expect(actions).toEqual(['add:A', 'remove:C']);
  });

  test('throws when charts file missing', () => {
    fs.writeFileSync(revFile, JSON.stringify({ charts: [] }));
    expect(() => generate({ chartsFile, revEngChartsFile: revFile })).toThrow(/file not found/);
  });

  test('throws when revEng file missing', () => {
    fs.writeFileSync(chartsFile, JSON.stringify({ charts: [] }));
    expect(() => generate({ chartsFile, revEngChartsFile: revFile })).toThrow(/file not found/);
  });
});
