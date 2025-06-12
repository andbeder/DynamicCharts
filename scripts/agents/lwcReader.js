// scripts/agents/lwcReader.js
// Generates Lightning Web Component files from chart definitions in charts.json

const fs = require('fs');
const path = require('path');

function toKebab(str) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function renderTemplates(chart, templateDir) {
  const templates = {
    js: `import { LightningElement } from 'lwc';\n\nexport default class ${chart.id} extends LightningElement {\n  chart = ${JSON.stringify(chart, null, 2)};\n}\n`,
    html: `<template>\n  <div class="chart-${toKebab(chart.id)}"></div>\n</template>\n`,
    xml: `<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<LightningComponentBundle xmlns=\"http://soap.sforce.com/2006/04/metadata\" fqn=\"${chart.id}\">\n  <apiVersion>59.0</apiVersion>\n  <isExposed>false</isExposed>\n</LightningComponentBundle>\n`
  };

  if (templateDir) {
    const jsPath = path.join(templateDir, 'component.js');
    const htmlPath = path.join(templateDir, 'template.html');
    const xmlPath = path.join(templateDir, 'meta.xml');
    if (fs.existsSync(jsPath)) templates.js = fs.readFileSync(jsPath, 'utf8');
    if (fs.existsSync(htmlPath)) templates.html = fs.readFileSync(htmlPath, 'utf8');
    if (fs.existsSync(xmlPath)) templates.xml = fs.readFileSync(xmlPath, 'utf8');
    templates.js = templates.js.replace(/__CLASS__/g, chart.id).replace(/__CHART__/g, JSON.stringify(chart, null, 2));
    templates.html = templates.html.replace(/__CLASS__/g, toKebab(chart.id));
    templates.xml = templates.xml.replace(/__CLASS__/g, chart.id);
  }
  return templates;
}

function generateLWCs({ chartsFile = 'charts.json', outputDir = 'force-app/main/default/lwc', templateDir }) {
  if (!fs.existsSync(chartsFile)) {
    throw new Error(`charts file not found: ${chartsFile}`);
  }
  const data = JSON.parse(fs.readFileSync(chartsFile, 'utf8'));
  const charts = data.charts || [];
  charts.forEach((chart) => {
    if (!chart.id) return;
    const compDir = path.join(outputDir, toKebab(chart.id));
    ensureDir(compDir);
    const templates = renderTemplates(chart, templateDir);
    fs.writeFileSync(path.join(compDir, `${toKebab(chart.id)}.js`), templates.js);
    fs.writeFileSync(path.join(compDir, `${toKebab(chart.id)}.html`), templates.html);
    fs.writeFileSync(path.join(compDir, `${toKebab(chart.id)}.js-meta.xml`), templates.xml);
  });
  return charts.length;
}

if (require.main === module) {
  const opts = {};
  process.argv.slice(2).forEach((arg) => {
    if (arg.startsWith('--charts-file=')) {
      opts.chartsFile = arg.split('=')[1];
    } else if (arg.startsWith('--output-dir=')) {
      opts.outputDir = arg.split('=')[1];
    } else if (arg.startsWith('--template-dir=')) {
      opts.templateDir = arg.split('=')[1];
    } else if (arg === '--help' || arg === '-h') {
      console.log('Usage: node lwcReader.js [--charts-file file] [--output-dir dir] [--template-dir dir]');
      process.exit(0);
    }
  });
  try {
    const count = generateLWCs(opts);
    console.log(`Generated ${count} components`);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}

module.exports = generateLWCs;
