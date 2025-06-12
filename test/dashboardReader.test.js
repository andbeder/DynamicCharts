const fs = require('fs');
const path = require('path');
const readDashboard = require('../scripts/agents/dashboardReader');

describe('dashboardReader', () => {
  const tmpDir = path.join(__dirname, 'dash');
  const chartsFile = path.join(tmpDir, 'charts.json');
  const inputFile = path.join(tmpDir, 'CR-02.json');

  beforeEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.mkdirSync(tmpDir, { recursive: true });
  });

  test('parses widgets and writes charts.json', () => {
    const dashboard = {
      widgets: [
        {
          title: 'Climbs By Nation',
          saql: 'q = load "d";',
          subtitle: 'type=bar; colors=red; title=Top 20 Climbs by Nation',
          fieldMappings: { nation: 'Nation', Climbs: 'Climbs' }
        },
        {
          title: 'Time By Peak',
          step: { query: 'saql2' },
          subtitle:
            'type=box-and-whisker; colors=light blue,dark blue; title=Days per Peak by Top 20 Climbs',
          fieldMappings: {
            peakid: 'Peak ID',
            A: 'Min',
            B: 'Q1',
            C: 'Q3',
            D: 'Max'
          }
        },
        { saql: 'invalid' }
      ]
    };
    fs.writeFileSync(inputFile, JSON.stringify(dashboard));

    const result = readDashboard({
      dashboardApiName: 'CR-02',
      inputDir: tmpDir,
      chartsFile
    });

    const data = JSON.parse(fs.readFileSync(chartsFile, 'utf8'));
    expect(data).toEqual(result);
    expect(data.charts.length).toBe(2);
    const ids = data.charts.map((c) => c.id);
    expect(ids).toEqual(['climbs-by-nation', 'time-by-peak']);
    expect(data.charts[0].style.seriesColors).toBe('#EF6B4D');
    expect(data.charts[1].style.seriesColors).toBe('#97C1DA,#002060');
  });

  test('throws when file missing', () => {
    expect(() =>
      readDashboard({ dashboardApiName: 'CR-02', inputDir: tmpDir, chartsFile })
    ).toThrow(/Dashboard JSON not found/);
  });

  test('throws when dashboardApiName missing', () => {
    expect(() => readDashboard({ inputDir: tmpDir, chartsFile })).toThrow(
      /dashboardApiName is required/
    );
  });
});
