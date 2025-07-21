#!/usr/bin/env node
// scripts/agents/lwcBuilder.js

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TEMPLATE_DIR = path.join(
  __dirname,
  '..',
  '..',
  'force-app',
  'main',
  'default',
  'lwc',
  'dynamicCharts'
);

function fetchDescription(key) {
  try {
    const html = execSync(`curl -s https://apexcharts.com/docs/options/${key}/`, {
      encoding: 'utf8'
    });
    const m = html.match(/<h1[^>]*>(.*?)<\/h1>/i) || html.match(/<title>(.*?)<\/title>/i);
    return m ? m[1].trim() : 'ApexCharts option';
  } catch {
    return 'ApexCharts option';
  }
}

function updateStyleReference(charts, file) {
  if (!file) return;
  const seen = fs.existsSync(file)
    ? fs.readFileSync(file, 'utf8').split(/\n/).map(l => l.split(' - ')[0])
    : [];
  charts.forEach(chart => {
    const style = chart.style || {};
    Object.keys(style).forEach(k => {
      if (!seen.includes(k)) {
        const desc = fetchDescription(k);
        fs.appendFileSync(file, `${k} - ${desc}\n`);
        seen.push(k);
      }
    });
  });
}

function toPascalCase(str) {
  return str
    .split(/[-_\s]+/)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
}

function replaceChartSettings(jsContent, settings) {
  const marker = 'chartSettings =';
  const start = jsContent.indexOf(marker);
  if (start === -1) return jsContent;
  const open = jsContent.indexOf('{', start);
  if (open === -1) return jsContent;
  let idx = open;
  let depth = 0;
  while (idx < jsContent.length) {
    const ch = jsContent[idx];
    if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        idx += 1;
        break;
      }
    }
    idx += 1;
  }
  const end = jsContent.indexOf(';', idx);
  if (end === -1) return jsContent;
  const before = jsContent.slice(0, open);
  const after = jsContent.slice(end);
  const objText = JSON.stringify(settings, null, 2);
  return `${before}${objText}${after}`;
}

function buildLwc({ chartsFile = 'charts.json', outputDir = 'force-app/main/default/lwc/dynamicCharts', silent = false } = {}) {
  if (!fs.existsSync(chartsFile)) {
    throw new Error(`Charts file not found: ${chartsFile}`);
  }
  const chartsData = JSON.parse(fs.readFileSync(chartsFile, 'utf8'));
  const charts = chartsData.charts || [];

  const outDir = path.resolve(outputDir);
  fs.mkdirSync(outDir, { recursive: true });

  const htmlPath = path.join(outDir, 'dynamicCharts.html');
  const jsPath = path.join(outDir, 'dynamicCharts.js');
  const metaPath = path.join(outDir, 'dynamicCharts.js-meta.xml');

  fs.copyFileSync(path.join(TEMPLATE_DIR, 'dynamicChartsExample.html'), htmlPath);

  const settings = {};
  charts.forEach((c) => {
    const style = c.style || {};
    const entry = {
      dashboard: c.dashboard,
      title: c.title,
      fieldMappings: c.fieldMappings,
    };
    if (style.seriesColors) entry.colors = style.seriesColors.split(',');
    if (style.effects) entry.effects = style.effects;
    settings[toPascalCase(c.id)] = { ...entry };
    settings[c.id] = { ...entry };
  });

  let jsTemplate = fs.readFileSync(path.join(TEMPLATE_DIR, 'dynamicChartsExample.js'), 'utf8');
  jsTemplate = replaceChartSettings(jsTemplate, settings);
  fs.writeFileSync(jsPath, jsTemplate);

  fs.copyFileSync(path.join(TEMPLATE_DIR, 'dynamicCharts.js-meta.xml'), metaPath);

  updateStyleReference(charts, 'chartStyles.txt');

  if (!silent) {
    console.log(`✔ LWC files written to ${outDir}`);
  }
  return { htmlFile: htmlPath, jsFile: jsPath, metaFile: metaPath };
}

if (require.main === module) {
  const opts = {};
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--charts-file' && args[i + 1]) {
      opts.chartsFile = args[i + 1];
      i += 1;
    } else if (arg.startsWith('--charts-file=')) {
      opts.chartsFile = arg.split('=')[1];
    } else if (arg === '--output-dir' && args[i + 1]) {
      opts.outputDir = args[i + 1];
      i += 1;
    } else if (arg.startsWith('--output-dir=')) {
      opts.outputDir = arg.split('=')[1];
    } else if (arg === '--silent') {
      opts.silent = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log('Usage: node lwcBuilder.js [--charts-file file] [--output-dir dir] [--silent]');
      process.exit(0);
    }
  }
  try {
    buildLwc(opts);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

module.exports = buildLwc;
