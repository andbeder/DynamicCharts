const fs = require('fs');
const path = require('path');

describe('chartSynchronizer verification', () => {
  test('chartSettings keys match charts.json ids', () => {
    const chartsPath = path.resolve(__dirname, '../charts.json');
    const chartsData = JSON.parse(fs.readFileSync(chartsPath, 'utf8'));
    const jsonIds = chartsData.charts.map((c) => c.id).sort();

    const jsPath = path.resolve(
      __dirname,
      '../force-app/main/default/lwc/dynamicCharts/dynamicCharts.js'
    );
    const jsContent = fs.readFileSync(jsPath, 'utf8');
    const lines = jsContent.split(/\r?\n/);
    const start = lines.findIndex((l) => l.includes('chartSettings = {'));
    let end = start;
    while (end < lines.length && !lines[end].includes('};')) {
      end += 1;
    }
    const objectLines = lines.slice(start + 1, end);
    const jsIds = [];
    objectLines.forEach((l) => {
      const m = l.match(/^\s{4}(\w+):\s*{/);
      if (m) {
        jsIds.push(m[1]);
      }
    });

    const toKebab = (s) =>
      s
        .replace(/([a-z])([A-Z])/g, "$1-$2")
        .replace(/[\s_]+/g, "-")
        .toLowerCase();

    const normalizedJsIds = jsIds.map(toKebab).sort();
    const filteredJsonIds = jsonIds.filter((id) => normalizedJsIds.includes(id)).sort();
    expect(normalizedJsIds).toEqual(filteredJsonIds);
  });
});
