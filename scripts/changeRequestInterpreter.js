const fs = require('fs');
const path = require('path');

function formatValue(value) {
  if (typeof value === 'string') {
    return `"${value}"`;
  }
  return JSON.stringify(value);
}

function generateInstructions(changeRequestsPath, outputPath) {
  const data = fs.readFileSync(changeRequestsPath, 'utf8');
  const json = JSON.parse(data);
  const lines = [];
  let step = 1;
  json.changes.forEach((change) => {
    if (change.action === 'update' && Array.isArray(change.mismatches)) {
      change.mismatches.forEach((m) => {
        lines.push(
          `${step}. In ${change.targetFile}, update ${change.chartId} ${m.property} from ${formatValue(
            m.currentValue
          )} to ${formatValue(m.expectedValue)}.`
        );
        step += 1;
      });
    } else if (change.action === 'remove') {
      lines.push(
        `${step}. Remove the <div class='chart-${change.chartId}'>...</div> block from dynamicCharts.html.`
      );
      step += 1;
      lines.push(
        `${step}. Remove the corresponding SAQL and render call for ${change.chartId} in dynamicCharts.js.`
      );
      step += 1;
    } else if (change.action === 'add') {
      lines.push(
        `${step}. Add markup for ${change.chartId} to dynamicCharts.html.`
      );
      step += 1;
      lines.push(
        `${step}. Add initialization and rendering logic for ${change.chartId} in dynamicCharts.js.`
      );
      step += 1;
    }
  });

  const output = lines.join('\n') + '\n';
  fs.writeFileSync(outputPath, output);
  return output;
}

if (require.main === module) {
  const input = path.resolve(__dirname, '..', 'changeRequests.json');
  const output = path.resolve(__dirname, '..', 'changeRequestInstructions.txt');
  generateInstructions(input, output);
}

module.exports = generateInstructions;
