# lwcReader

> Generates Lightning Web Component files from normalized chart definitions for use in Salesforce LWC.

## Script Path

`scripts/agents/lwcReader.js`

## Description

This agent reads the normalized chart definitions from `charts.json` and generates a corresponding directory of Lightning Web Components, including `.js`, `.html`, and `.js-meta.xml` files for each chart. It uses templating to produce standardized component scaffolding ready for deployment.

## CLI Options

- `--charts-file <file>` (optional, default: `charts.json`): Path to the JSON file containing chart definitions.
- `--output-dir <directory>` (optional, default: `lwc`): Directory in which to generate component folders.
- `--template-dir <directory>` (optional, default: `templates/lwc`): Directory containing component templates.
- `--silent` (optional): Suppress informational output.
- `-h, --help`: Display help information.

## Inputs

- _(Optional)_ `chartsFile`: Path to the chart definitions JSON.
- _(Optional)_ `outputDir`: Target directory for generated LWC components.
- _(Optional)_ `templateDir`: Source directory for template files.
- _(Optional)_ `silent`: Flag to suppress logs.

## Behavior

1. **Validate Preconditions**

   - Ensure `chartsFile` exists and is valid JSON.
   - Create `outputDir` if it does not exist.

2. **Load Templates**

   - Load component templates from `templateDir` for `.js`, `.html`, and `.js-meta.xml`.

3. **Generate Components**  
   For each chart definition in `chartsFile`:

   - Create a subdirectory `<outputDir>/<chart.id>` (kebab-case).
   - Render templates by injecting chart-specific variables:
     - `chart.id` → component folder and class name.
     - `chart.type` → component logic type.
     - `chart.title` → readable label.
     - `chart.fieldMappings` and `chart.style` → passed as component properties.
   - Write files:
     - `<chart.id>.js`
     - `<chart.id>.html`
     - `<chart.id>.js-meta.xml`

4. **Post-Generation**
   - Log generated components summary.
   - Exit with code `0` on success.

## Assumptions

- Chart definitions include valid `id`, `type`, and metadata required by templates.
- Template placeholders follow `{{placeholderName}}` syntax.
- Output directory is writeable.

## Error Handling

- Skips chart definitions missing required fields and logs a warning.
- Exits with non-zero code if template files are missing or write errors occur.

## Dependencies

- Node.js (v14+)
- `fs-extra` for file operations
- `mustache` or similar templating library

## Preconditions

- Previous agents (`dashboardRetriever` and `dashboardReader`) have produced `charts.json`.
- Template directory (`templates/lwc`) contains the necessary template files.

## Output

- the file `revEngCharts.json`

## Examples

### Basic Usage

```bash
node scripts/agents/lwcReader.js
```

### Custom Paths

```bash
node scripts/agents/lwcReader.js --charts-file revEngCharts.json --output-dir force-app/main/default/lwc --template-dir tools/lwc-templates
```
