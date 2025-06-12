// scripts/agents/changeRequestGenerator.js
// Generates changeRequests.json by comparing charts.json with revEngCharts.json

const fs = require('fs');
const path = require('path');

function loadJson(file) {
  if (!fs.existsSync(file)) {
    throw new Error(`file not found: ${file}`);
  }
  const text = fs.readFileSync(file, 'utf8');
  return JSON.parse(text);
}

function compareCharts(authoritative, current) {
  const mapA = new Map();
  const mapB = new Map();
  (authoritative.charts || []).forEach((c) => mapA.set(c.id, c));
  (current.charts || []).forEach((c) => mapB.set(c.id, c));

  const changes = [];

  for (const [id, chart] of mapA.entries()) {
    if (!mapB.has(id)) {
      changes.push({ chartId: id, action: 'add', targetFile: 'dynamicCharts.js' });
    } else {
      const cur = mapB.get(id);
      const mismatches = [];
      ['dashboard', 'title', 'type', 'saql', 'fieldMappings', 'style'].forEach((prop) => {
        const aVal = chart[prop];
        const bVal = cur[prop];
        if (JSON.stringify(aVal) !== JSON.stringify(bVal)) {
          mismatches.push({ property: prop, currentValue: bVal, expectedValue: aVal });
        }
      });
      if (mismatches.length) {
        changes.push({
          chartId: id,
          action: 'update',
          targetFile: 'dynamicCharts.js',
          mismatches,
          instructions: mismatches.map((m) => `Update ${id} ${m.property}`)
        });
      }
    }
  }

  for (const [id] of mapB.entries()) {
    if (!mapA.has(id)) {
      changes.push({ chartId: id, action: 'remove', targetFile: 'dynamicCharts.js' });
    }
  }

  return { changes };
}

function generateChangeRequests({
  chartsFile = 'charts.json',
  revEngChartsFile = 'revEngCharts.json',
  outputFile = 'changeRequests.json',
  silent = false
} = {}) {
  const chartsPath = path.resolve(chartsFile);
  const revPath = path.resolve(revEngChartsFile);
  const outPath = path.resolve(outputFile);

  const authoritative = loadJson(chartsPath);
  const current = loadJson(revPath);

  const result = compareCharts(authoritative, current);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
  if (!silent) {
    console.log(`Wrote ${result.changes.length} changes to ${outPath}`);
  }
  return result;
}

if (require.main === module) {
  const opts = {};
  process.argv.slice(2).forEach((arg) => {
    if (arg.startsWith('--charts-file=')) {
      opts.chartsFile = arg.split('=')[1];
    } else if (arg.startsWith('--rev-eng-charts-file=')) {
      opts.revEngChartsFile = arg.split('=')[1];
    } else if (arg.startsWith('--output-file=')) {
      opts.outputFile = arg.split('=')[1];
    } else if (arg === '--silent') {
      opts.silent = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log(
        'Usage: node changeRequestGenerator.js [--charts-file file] [--rev-eng-charts-file file] [--output-file file] [--silent]'
      );
      process.exit(0);
    }
  });
  try {
    generateChangeRequests(opts);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}

module.exports = generateChangeRequests;
