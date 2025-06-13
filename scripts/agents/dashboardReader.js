// scripts/agents/dashboardReader.js
// Parses dashboard JSON into normalized chart definitions and writes charts.json

const fs = require('fs');
const path = require('path');

const COLOR_MAP = {
  'red': '#EF6B4D',
  'light blue': '#97C1DA',
  'blue': '#3C5B81',
  'green': '#1BAA96',
  'teal': '#E2F4F9',
  'grey': '#98ACBD',
  'dark green': '#175F68',
  'dark grey': '#283140',
  'dark blue': '#002060'
};

function toKebab(str) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

function parseSubtitle(subtitle) {
  const meta = {};
  if (!subtitle) return meta;
  subtitle.split(';').forEach((pair) => {
    const [key, value] = pair.split('=').map((s) => s.trim());
    if (key) meta[key] = value;
  });
  return meta;
}

function mapColors(str) {
  if (!str) return str;
  return str
    .split(',')
    .map((c) => COLOR_MAP[c.trim().toLowerCase()] || c.trim())
    .join(',');
}

function readDashboard({
  dashboardApiName,
  inputDir = 'tmp',
  chartsFile = 'charts.json',
  silent = false
}) {
  if (!dashboardApiName) {
    throw new Error('dashboardApiName is required');
  }

  const filePath = path.resolve(inputDir, `${dashboardApiName}.json`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Dashboard JSON not found: ${filePath}`);
  }

  const dashboard = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const steps = dashboard.steps || {};
  const widgetSource = dashboard.widgets || [];
  const widgets = Array.isArray(widgetSource)
    ? widgetSource
    : Object.values(widgetSource);

  const charts = [];

  widgets.forEach((w) => {
    const title =
      w.title ||
      (w.parameters && w.parameters.title && w.parameters.title.label) ||
      (w.properties && w.properties.title);
    const subtitle =
      w.subtitle ||
      (w.parameters && w.parameters.title && w.parameters.title.subtitleLabel);
    const stepName =
      (typeof w.step === 'string' && w.step) ||
      (w.parameters && w.parameters.step);
    let saql =
      w.saql ||
      (w.step && typeof w.step === 'object' && w.step.query) ||
      (steps[stepName] && steps[stepName].query);
    if (!title || !saql) return; // skip invalid widget

    const meta = parseSubtitle(subtitle);
    const type =
      meta.type ||
      w.type ||
      (w.parameters && w.parameters.visualizationType);
    if (!type) return;

    const style = {};
    if (meta.colors) style.seriesColors = mapColors(meta.colors);
    if (meta.font) style.font = meta.font;
    if (
      meta.shadow === 'true' ||
      meta.effects === 'shadow' ||
      meta.DropShadow === 'true'
    ) {
      style.effects = ['shadow'];
    }

    const chart = {
      dashboard: dashboardApiName,
      id: toKebab(title),
      type,
      title: meta.title || title,
      fieldMappings: w.fieldMappings || {},
      saql: typeof saql === 'object' ? JSON.stringify(saql) : saql,
      style
    };

    charts.push(chart);
  });

  const output = { charts };
  fs.writeFileSync(chartsFile, JSON.stringify(output, null, 2));
  if (!silent) {
    console.log(`Wrote ${charts.length} charts to ${chartsFile}`);
  }
  return output;
}

if (require.main === module) {
  const opts = {};
  process.argv.slice(2).forEach((arg) => {
    if (arg.startsWith('--dashboard-api-name=')) {
      opts.dashboardApiName = arg.split('=')[1];
    } else if (arg.startsWith('--input-dir=')) {
      opts.inputDir = arg.split('=')[1];
    } else if (arg.startsWith('--charts-file=')) {
      opts.chartsFile = arg.split('=')[1];
    } else if (arg === '--silent') {
      opts.silent = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log('Usage: node dashboardReader.js --dashboard-api-name <name> [--input-dir dir] [--charts-file file] [--silent]');
      process.exit(0);
    }
  });
  readDashboard(opts);
}

module.exports = readDashboard;
