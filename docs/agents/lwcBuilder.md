# lwcBuilder Agent

**Script Path**: `scripts/agents/lwcBuilder.js`

## Description

The `lwcBuilder` agent reads a `charts.json` file and generates the Lightning Web
Component source for `dynamicCharts`. Chart definitions are converted into a
`chartSettings` object in `dynamicCharts.js` and matching `<div>` placeholders in
`dynamicCharts.html`. A basic `dynamicCharts.js-meta.xml` file is also
produced. Style keys discovered in the chart definitions are compared against the
ApexCharts option documentation at [apexcharts.com](https://apexcharts.com/docs/)
to populate `chartStyles.txt` with descriptions of new options.

## CLI Options

- `--charts-file <path>`: Path to the input chart definition JSON (default:
  `charts.json`).
- `--output-dir <dir>`: Directory where the LWC files should be written
  (default: `force-app/main/default/lwc/dynamicCharts`).
- `--silent`: Suppress console output.
- `-h`, `--help`: Show usage information.

## Inputs

- `chartsFile`: JSON file containing a `charts` array as documented in
  `CHART_JSON_DEFINITION.MD`.
- _(Optional)_ `outputDir`: Destination for the generated component files.
- _(Optional)_ `silent`: Flag to reduce log verbosity.

## Behavior

1. Parse `chartsFile` and validate the result contains a `charts` array.
2. Create `outputDir` if it does not already exist.
3. Write `dynamicCharts.html` with a `<div>` element for each chart id.
4. Write `dynamicCharts.js` exporting a `LightningElement` class with a
   `chartSettings` property reflecting the chart definitions. The style section is
   normalized so `seriesColors` becomes `colors` and `effects` is copied as-is.
5. Write a minimal `dynamicCharts.js-meta.xml` that exposes the component to App,
   Record and Home pages.
6. For each style key encountered, fetch a short description from the ApexCharts
   documentation site and append unknown keys to `chartStyles.txt`.
7. Return an object describing the files that were written.

## Output

- `dynamicCharts.html`
- `dynamicCharts.js`
- `dynamicCharts.js-meta.xml`
- Updated `chartStyles.txt`

## Example

```bash
node scripts/agents/lwcBuilder.js --charts-file charts.json --output-dir force-app/main/default/lwc/dynamicCharts
```
