const fs = require('fs');
const path = require('path');
const syncCharts = require('../scripts/agents/syncCharts');

function makeOutdated(jsPath) {
  let content = fs.readFileSync(jsPath, 'utf8');
  content = content
    .replace(/CR_02/g, 'Unknown')
    .replace('Top 20 Climbs by Nation', 'Climbs By Nation')
    .replace('Days per Peak by Top 20 Climbs', 'Time By Peak')
    .replace('Average Number of Camps per Peak', 'Camps By Peak')
    .replace(
      'fieldMappings: { nation: "Nation", Climbs: "Climbs" }',
      'fieldMappings: { nation: "nation", Climbs: "Climbs" }'
    )
    .replace(
      'fieldMappings: {\n        peakid: "Peak ID",\n        A: "Min",\n        B: "Q1",\n        C: "Q3",\n        D: "Max"\n      }',
      'fieldMappings: {\n        peakid: "peakid",\n        A: "A",\n        B: "B",\n        C: "C",\n        D: "D"\n      }'
    )
    .replace(
      'fieldMappings: { peakid: "Peak ID", A: "Average Camps" }',
      'fieldMappings: { peakid: "peakid", A: "A" }'
    )
    .replace(/colors: \[[^\]]*\]/g, 'colors: []')
    .replace(/effects: \[[^\]]*\]/g, 'effects: []');
  fs.writeFileSync(jsPath, content);
}

describe('syncCharts', () => {
  const tmpDir = path.join(__dirname, 'syncCharts');
  const jsPath = path.join(tmpDir, 'dynamicCharts.js');
  const htmlPath = path.join(tmpDir, 'dynamicCharts.html');
  const inputPath = path.resolve(__dirname, '../changeRequests.json');

  beforeEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.copyFileSync(
      path.resolve(
        __dirname,
        '../force-app/main/default/lwc/dynamicCharts/dynamicCharts.js'
      ),
      jsPath
    );
    fs.copyFileSync(
      path.resolve(
        __dirname,
        '../force-app/main/default/lwc/dynamicCharts/dynamicCharts.html'
      ),
      htmlPath
    );
    makeOutdated(jsPath);
  });

  test('updates chart settings based on change requests', () => {
    syncCharts({ input: inputPath, html: htmlPath, js: jsPath });
    const updated = fs.readFileSync(jsPath, 'utf8');
    expect(updated).toContain('dashboard: "CR_02"');
    expect(updated).toContain('title: "Top 20 Climbs by Nation"');
    expect(updated).toMatch(/colors:\s*\[\s*"#002060"\s*\]/);
    expect(updated).toMatch(/colors:\s*\[\s*"#97C1DA",\s*"#002060"\s*\]/);
    expect(updated).toMatch(/colors:\s*\[\s*"#175F68"\s*\]/);
    expect(updated).toMatch(/effects:\s*\[\s*"shadow"\s*\]/);
  });

  test('uses default file paths when options are omitted', () => {
    const cwd = process.cwd();
    const defaultDir = path.join(tmpDir, 'proj');
    const defaultLwcDir = path.join(
      defaultDir,
      'force-app/main/default/lwc/dynamicCharts'
    );
    fs.mkdirSync(defaultLwcDir, { recursive: true });
    fs.copyFileSync(htmlPath, path.join(defaultLwcDir, 'dynamicCharts.html'));
    fs.copyFileSync(jsPath, path.join(defaultLwcDir, 'dynamicCharts.js'));
    fs.copyFileSync(inputPath, path.join(defaultDir, 'changeRequests.json'));
    process.chdir(defaultDir);
    try {
      syncCharts();
      const updated = fs.readFileSync(
        path.join(defaultLwcDir, 'dynamicCharts.js'),
        'utf8'
      );
      expect(updated).toContain('dashboard: "CR_02"');
    } finally {
      process.chdir(cwd);
    }
  });
});
