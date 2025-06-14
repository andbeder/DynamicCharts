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
      state: {
        widgets: {
        w1: {
          saql: 'saql1',
          parameters: {
            title: {
              label: 'Climbs By Nation',
              subtitleLabel: 'type=bar; colors=red; title=Top 20 Climbs by Nation'
            },
            step: 'step1'
          },
          fieldMappings: { nation: 'Nation', Climbs: 'Climbs' }
        },
        w2: {
          saql: 'saql2',
          parameters: {
            title: {
              label: 'Time By Peak',
              subtitleLabel:
                'type=box-and-whisker; colors=light blue,dark blue; title=Days per Peak by Top 20 Climbs'
            },
            step: 'step2'
          },
          fieldMappings: {
            peakid: 'Peak ID',
            A: 'Min',
            B: 'Q1',
            C: 'Q3',
            D: 'Max'
          }
        },
        w3: { saql: 'invalid' }
        },
        steps: {
          step1: { query: 'saql1' },
          step2: { query: 'saql2' }
        },
        gridLayouts: [
          {
            pages: [
              {
                widgets: [
                  { name: 'w1', column: 1, row: 1 },
                  { name: 'w2', column: 1, row: 2 }
                ]
              }
            ]
          }
        ]
      }
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
