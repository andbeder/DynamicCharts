#!/usr/bin/env node
// scripts/agents/lwcBuilder.js

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

  const htmlLines = ['<template>'];
  charts.forEach(c => {
    htmlLines.push(`  <div class="${c.id} slds-var-m-around_medium" lwc:dom="manual"></div>`);
  });
  htmlLines.push('</template>');
  fs.writeFileSync(htmlPath, htmlLines.join('\n'));

  const settings = {};
  charts.forEach(c => {
    const style = c.style || {};
    const entry = {
      dashboard: c.dashboard,
      title: c.title,
      fieldMappings: c.fieldMappings
    };
    if (style.seriesColors) entry.colors = style.seriesColors.split(',');
    if (style.effects) entry.effects = style.effects;
    settings[c.id] = entry;
  });

  const jsContent = `import { LightningElement } from 'lwc';

export default class DynamicCharts extends LightningElement {
  chartSettings = ${JSON.stringify(settings, null, 2)};
}
`;
  fs.writeFileSync(jsPath, jsContent);

  const metaContent = `<?xml version="1.0" encoding="UTF-8"?>
<LightningComponentBundle xmlns="http://soap.sforce.com/2006/04/metadata">
  <apiVersion>60.0</apiVersion>
  <isExposed>true</isExposed>
  <targets>
    <target>lightning__AppPage</target>
    <target>lightning__RecordPage</target>
    <target>lightning__HomePage</target>
  </targets>
</LightningComponentBundle>`;
  fs.writeFileSync(metaPath, metaContent);

  updateStyleReference(charts, 'chartStyles.txt');

  if (!silent) {
    console.log(`✔ LWC files written to ${outDir}`);
  }
  return { htmlFile: htmlPath, jsFile: jsPath, metaFile: metaPath };
}

if (require.main === module) {
  const opts = {};
  process.argv.slice(2).forEach(arg => {
    if (arg.startsWith('--charts-file=')) {
      opts.chartsFile = arg.split('=')[1];
    } else if (arg.startsWith('--output-dir=')) {
      opts.outputDir = arg.split('=')[1];
    } else if (arg === '--silent') {
      opts.silent = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log('Usage: node lwcBuilder.js [--charts-file file] [--output-dir dir] [--silent]');
      process.exit(0);
    }
  });
  try {
    buildLwc(opts);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

module.exports = buildLwc;
