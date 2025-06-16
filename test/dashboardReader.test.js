const fs = require('fs');
const path = require('path');
jest.mock('child_process', () => ({ execSync: jest.fn(() => '<h1>colors</h1>') }));
const readDashboard = require('../scripts/agents/dashboardReader');

describe('dashboardReader', () => {
  const tmpDir = path.join(__dirname, 'dash');
  const chartsFile = path.join(tmpDir, 'charts.json');
  const stylesFile = path.join(tmpDir, 'chartStyles.txt');
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
          type: 'chart',
          saql: 'saql1',
          parameters: {
            title: { label: 'Climbs By Nation' },
            step: 'step1',
            columnMap: { dimensionAxis: ['nation'], plots: ['A'] }
          },
          fieldMappings: { nation: 'Nation', Climbs: 'Climbs' }
        },
        w1desc: {
          type: 'text',
          parameters: {
            content: { richTextContent: [{ insert: 'type: bar; colors: red; title: Top 20 Climbs by Nation' }] }
          }
        },
        w2: {
          type: 'chart',
          saql: 'saql2',
          parameters: {
            title: { label: 'Time By Peak' },
            step: 'step2',
            columnMap: { dimensionAxis: ['peakid'], plots: ['A','B','C','D'] }
          },
          fieldMappings: {
            peakid: 'Peak ID',
            A: 'Min',
            B: 'Q1',
            C: 'Q3',
            D: 'Max'
          }
        },
        w2desc: {
          type: 'text',
          parameters: {
            content: { richTextContent: [{ insert: 'type: box-and-whisker; colors: light blue,dark blue; title: Days per Peak by Top 20 Climbs' }] }
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
                  { name: 'w1', column: 0, row: 1 },
                  { name: 'w1desc', column: 1, row: 1 },
                  { name: 'w2', column: 0, row: 2 },
                  { name: 'w2desc', column: 1, row: 2 }
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
      chartsFile,
      chartStylesFile: stylesFile
    });

    const data = JSON.parse(fs.readFileSync(chartsFile, 'utf8'));
    expect(data).toEqual(result);
    expect(data.charts.length).toBe(2);
    const ids = data.charts.map((c) => c.id);
    expect(ids).toEqual(['climbs-by-nation', 'time-by-peak']);
    expect(data.charts[0].style.seriesColors).toBe('#EF6B4D');
    expect(data.charts[1].style.seriesColors).toBe('#97C1DA,#002060');
    const stylesText = fs.readFileSync(stylesFile, 'utf8');
    expect(stylesText).toMatch(/colors/);
  });

  test('parses text widget styles separated by newlines', () => {
    const dashboard = {
      state: {
        widgets: {
          w1: {
            type: 'chart',
            saql: 'saql1',
            parameters: {
              title: { label: 'Climbs By Nation' },
              step: 'step1',
              columnMap: { dimensionAxis: ['nation'], plots: ['A'] }
            },
            fieldMappings: { nation: 'Nation', Climbs: 'Climbs' }
          },
          w1desc: {
            type: 'text',
            parameters: {
              content: { richTextContent: [{ insert: 'type: bar\ncolors: red\nshadow: true' }] }
            }
          }
        },
        steps: { step1: { query: 'saql1' } },
        gridLayouts: [
          {
            pages: [
              {
                widgets: [
                  { name: 'w1', column: 0, row: 1 },
                  { name: 'w1desc', column: 1, row: 1 }
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
      chartsFile,
      chartStylesFile: stylesFile
    });

    const data = JSON.parse(fs.readFileSync(chartsFile, 'utf8'));
    expect(data).toEqual(result);
    expect(data.charts[0].style.seriesColors).toBe('#EF6B4D');
    expect(data.charts[0].style.effects).toEqual(['shadow']);
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

  test('throws when JSON contains error message', () => {
    fs.writeFileSync(
      inputFile,
      JSON.stringify({ errorCode: 'NOT_FOUND', message: 'not found' })
    );
    expect(() =>
      readDashboard({ dashboardApiName: 'CR-02', inputDir: tmpDir, chartsFile })
    ).toThrow('Invalid dashboard JSON: not found');
  });
});
