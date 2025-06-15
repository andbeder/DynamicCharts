// scripts/agents/dashboardReader.js
// Parses dashboard JSON into normalized chart definitions and writes charts.json

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Color name to hex mapping
const COLOR_MAP = {
  red: "#EF6B4D",
  "light blue": "#97C1DA",
  blue: "#3C5B81",
  green: "#1BAA96",
  teal: "#E2F4F9",
  grey: "#98ACBD",
  "dark green": "#175F68",
  "dark grey": "#283140",
  "dark blue": "#002060"
};

// SAQL mapping for compact-to-SAQL conversion
const saqlMapping = {
  load: 'q = load "<datasetId>";',
  where: "q = filter q by <filters>;",
  group: "q = group q by <dimension>;",
  foreach: "q = foreach q generate <aggregates>;",
  order: "q = order q by <orderField> <orderDirection>;",
  limit: "limit <limit>;"
};

function toKebab(str) {
  return str
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}

const STYLES_FILE = "chartStyles.txt";
let knownStyleKeys = new Set();
if (fs.existsSync(STYLES_FILE)) {
  fs
    .readFileSync(STYLES_FILE, "utf8")
    .split(/\r?\n/)
    .forEach((l) => {
      const key = l.split("-")[0].trim();
      if (key) knownStyleKeys.add(key);
    });
}

function fetchStyleDescription(key) {
  try {
    const result = execSync(
      `curl -Ls https://apexcharts.com/docs/options/${key}/`
    ).toString();
    const match = result.match(
      /<meta name="description" content="([^"]+)"/i
    );
    if (match) return match[1];
  } catch (e) {
    // ignore network errors
  }
  return "";
}

function ensureStyleKey(key) {
  if (!knownStyleKeys.has(key)) {
    const desc = fetchStyleDescription(key);
    fs.appendFileSync(STYLES_FILE, `${key} - ${desc}\n`);
    knownStyleKeys.add(key);
  }
}

function parseStyleString(str) {
  const meta = {};
  if (!str) return meta;
  str.split(";").forEach((pair) => {
    const [k, v] = pair.split(/[:=]/).map((s) => s.trim());
    if (k) {
      const key = k.toLowerCase();
      meta[key] = v;
      ensureStyleKey(key);
    }
  });
  return meta;
}

function mapColors(str) {
  if (!str) return str;
  return str
    .split(",")
    .map((c) => COLOR_MAP[c.trim().toLowerCase()] || c.trim())
    .join(",");
}

function normalizeType(rawType) {
  if (!rawType) return "bar";
  const t = rawType.toLowerCase();
  if (t.includes("box")) return "box-and-whisker";
  return "bar";
}

function queryToSaql(queryObj, datasetId) {
  // Convert compact JSON query to SAQL using saqlMapping
  let saql = saqlMapping.load.replace("<datasetId>", datasetId);

  // Filters
  if (queryObj.sourceFilters && Object.keys(queryObj.sourceFilters).length) {
    const filters = Object.entries(queryObj.sourceFilters)
      .map(([dim, cond]) => `${dim} == ${cond}`)
      .join(" and ");
    saql += "\n" + saqlMapping.where.replace("<filters>", filters);
  }

  // Group dimensions
  const groups = (queryObj.sources[0].groups || []).join(", ");
  saql += "\n" + saqlMapping.group.replace("<dimension>", groups);

  // Aggregations
  const aggs = (queryObj.sources[0].columns || [])
    .map((col) => {
      if (col.field) {
        return `${col.field[0]}(${col.field[1]}) as ${col.name}`;
      } else if (col.formula) {
        return `${col.formula} as ${col.name}`;
      }
    })
    .join(", ");
  saql += "\n" + saqlMapping.foreach.replace("<aggregates>", aggs);

  // Ordering
  if (queryObj.orders && queryObj.orders[0]) {
    const ord = queryObj.orders[0];
    const dir = ord.ascending ? "asc" : "desc";
    saql +=
      "\n" +
      saqlMapping.order
        .replace("<orderField>", ord.name)
        .replace("<orderDirection>", dir);
  }

  // Limit
  if (queryObj.limit) {
    saql += "\n" + saqlMapping.limit.replace("<limit>", String(queryObj.limit));
  }

  return saql;
}

function readDashboard({
  dashboardApiName,
  inputDir = "tmp",
  chartsFile = "charts.json",
  silent = false
}) {
  if (!dashboardApiName) {
    throw new Error("dashboardApiName is required");
  }

  const filePath = path.resolve(inputDir, `${dashboardApiName}.json`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Dashboard JSON not found: ${filePath}`);
  }

  const dashboard = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const state = dashboard.state || {};
  const steps = state.steps || {};
  const widgetsByName = state.widgets || {};
  const layoutWidgets =
    (state.gridLayouts &&
      state.gridLayouts[0] &&
      state.gridLayouts[0].pages &&
      state.gridLayouts[0].pages[0].widgets) ||
    [];

  // Sort by row then column to keep charts left and text widgets right
  layoutWidgets.sort((a, b) => a.row - b.row || a.column - b.column);

  // Default datasetId
  const defaultDatasetId =
    (dashboard.datasets && dashboard.datasets[0] && dashboard.datasets[0].id) ||
    "";

  const charts = [];

  for (let i = 0; i < layoutWidgets.length; i++) {
    const { name: widgetName, row, column } = layoutWidgets[i];
    const w = widgetsByName[widgetName];
    if (!w) continue;
    if (w.type === "text") continue;

    const title =
      w.title ||
      (w.parameters && w.parameters.title && w.parameters.title.label) ||
      (w.properties && w.properties.title);

    let textMeta = {};
    const next = layoutWidgets[i + 1];
    if (next && next.row === row) {
      const tw = widgetsByName[next.name];
      if (tw && tw.type === "text") {
        const content =
          (tw.parameters &&
            tw.parameters.content &&
            (tw.parameters.content.plainText ||
              (Array.isArray(tw.parameters.content.richTextContent)
                ? tw.parameters.content.richTextContent
                    .map((r) => r.insert)
                    .join("")
                : ""))) || "";
        textMeta = parseStyleString(content);
        i++; // skip paired text widget
      }
    }

    const subtitle =
      w.subtitle ||
      (w.parameters && w.parameters.title && w.parameters.title.subtitleLabel);
    const meta = Object.assign({}, parseStyleString(subtitle), textMeta);

    const stepName =
      (typeof w.step === "string" && w.step) ||
      (w.parameters && w.parameters.step);
    let rawQuery = null;
    if (w.saql) {
      rawQuery = w.saql;
    } else if (w.step && typeof w.step === "object" && w.step.query) {
      rawQuery = queryToSaql(w.step.query, defaultDatasetId);
    } else if (steps[stepName] && steps[stepName].query) {
      rawQuery = queryToSaql(steps[stepName].query, defaultDatasetId);
    }
    if (!title || !rawQuery) return;

    const type = normalizeType(
      meta.type || w.type || (w.parameters && w.parameters.visualizationType)
    );

    // Build fieldMappings from columnMap
    const fieldMappings = {};
    const cm = (w.parameters && w.parameters.columnMap) || {};
    (cm.plots || []).forEach((f) => (fieldMappings[f] = f));
    (cm.dimensionAxis || []).forEach((f) => (fieldMappings[f] = f));

    // Build style
    const style = {};
    if (meta.colors) style.seriesColors = mapColors(meta.colors);
    if (meta.font) style.font = meta.font;
    if (meta["font-color"]) style.fontColor = meta["font-color"];
    if (meta["x-axis-font-size"])
      style.xAxisFontSize = meta["x-axis-font-size"];
    if (meta["y-axis-font-size"])
      style.yAxisFontSize = meta["y-axis-font-size"];
    if (
      meta.shadow === "true" ||
      meta.effects === "shadow" ||
      meta.dropshadow === "true"
    ) {
      style.effects = ["shadow"];
    }

    charts.push({
      dashboard: dashboardApiName,
      id: toKebab(title),
      type,
      title: meta.title || title,
      fieldMappings,
      saql: rawQuery,
      style
    });
  }

  const output = { charts };
  fs.writeFileSync(chartsFile, JSON.stringify(output, null, 2));
  if (!silent) console.log(`Wrote ${charts.length} charts to ${chartsFile}`);

  return output;
}

if (require.main === module) {
  const opts = {};
  process.argv.slice(2).forEach((arg) => {
    if (arg.startsWith("--dashboard-api-name=")) {
      opts.dashboardApiName = arg.split("=")[1];
    } else if (arg.startsWith("--input-dir=")) {
      opts.inputDir = arg.split("=")[1];
    } else if (arg.startsWith("--charts-file=")) {
      opts.chartsFile = arg.split("=")[1];
    } else if (arg === "--silent") {
      opts.silent = true;
    } else if (arg === "--help" || arg === "-h") {
      console.log(
        "Usage: node dashboardReader.js --dashboard-api-name <name> [--input-dir dir] [--charts-file file] [--silent]"
      );
      process.exit(0);
    }
  });
  readDashboard(opts);
}

module.exports = readDashboard;
