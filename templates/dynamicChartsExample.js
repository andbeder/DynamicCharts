import { LightningElement, wire, api } from "lwc";
import { getDatasets, executeQuery } from "lightning/analyticsWaveApi";
import apexchartJs from "@salesforce/resourceUrl/ApexCharts";
import { loadScript } from "lightning/platformResourceLoader";

const MAX_CONCURRENT_QUERIES = 1;

let apexChartsPromise;

export default class SacCharts extends LightningElement {
  datasetIds;

  queryQueue = [];
  runningQueries = 0;
  nextQuery;
  currentCallback;

  hostSelections = [];
  nationSelections = [];
  seasonSelections = [];
  skiSelection = [];

  hostOptions;
  nationOptions;
  seasonOptions;
  skiOptions = [
    { label: "All", value: "in all" },
    { label: "Yes", value: '== "Yes"' },
    { label: "No", value: '== "No"' }
  ];

  chartObject = {};
  _chartsInitialized = false;

  activePage = "ClimbsByNation";

  get climbsPageClass() {
    return this.activePage === "ClimbsByNation" ? "slds-show" : "slds-hide";
  }
  get campsPageClass() {
    return this.activePage === "CampsByPeak" ? "slds-show" : "slds-hide";
  }
  get timePageClass() {
    return this.activePage === "TimeByPeak" ? "slds-show" : "slds-hide";
  }

  enqueueQuery(query, callback) {
    this.queryQueue.push({ query, callback });
    this.runQueuedQueries();
  }

  runQueuedQueries() {
    if (
      this.runningQueries < MAX_CONCURRENT_QUERIES &&
      this.queryQueue.length &&
      !this.nextQuery
    ) {
      const { query, callback } = this.queryQueue.shift();
      this.runningQueries++;
      this.currentCallback = callback;
      this.nextQuery = query;
    }
  }

  chartSettings = {
    ClimbsByNation: {
      dashboard: "CR_02",
      title: "Top 20 Climbs by Nation",
      fieldMappings: {
        nation: "Nation",
        Climbs: "Climbs"
      },
      colors: ["#002060"],
      effects: ["shadow"]
    },
    TimeByPeak: {
      dashboard: "CR_02",
      title: "Days per Peak by Top 20 Climbs",
      fieldMappings: {
        peakid: "Peak ID",
        A: "Min",
        B: "Q1",
        C: "Q3",
        D: "Max"
      },
      colors: ["#97C1DA", "#002060"],
      effects: ["shadow"]
    },
    CampsByPeak: {
      dashboard: "CR_02",
      title: "Average Number of Camps per Peak",
      fieldMappings: {
        peakid: "Peak ID",
        A: "Average Camps"
      },
      colors: ["#175F68"],
      effects: ["shadow"]
    },
    "climbs-by-nation": {
      fieldMappings: {
        A: "A",
        nation: "nation"
      },
      colors: ["#002060"],
      dashboard: "CR_02",
      title: "Top 20 Climbs by Nation"
    },
    "time-by-peak": {
      fieldMappings: {
        A: "A",
        B: "B",
        C: "C",
        D: "D",
        peakid: "peakid"
      },
      colors: ["#97C1DA", "#002060"],
      dashboard: "CR_02",
      title: "Days per Peak by Top 20 Climbs"
    },
    "camps-by-peak": {
      fieldMappings: {
        A: "A",
        peakid: "peakid"
      },
      dashboard: "CR_02",
      title: "Average Number of Camps per Peak"
    },
    "deaths-by-peak": {
      dashboard: "CR_02",
      title: "Total Number of Deaths per Peak",
      fieldMappings: {
        A: "A",
        peakid: "peakid"
      },
      effects: ["shadow"]
    }
  };

  @wire(executeQuery, { query: "$nextQuery" })
  wiredExecuteQuery(result) {
    if (!this.nextQuery) {
      return;
    }
    if (this.currentCallback) {
      this.currentCallback(result);
    }
    if (this.runningQueries > 0) {
      this.runningQueries--;
    }
    this.currentCallback = undefined;
    this.nextQuery = undefined;
    this.runQueuedQueries();
  }

  @api
  applySettings(options, chartId) {
    const settings = this.chartSettings[chartId] || {};
    const updated = { ...options };
    if (settings.title) {
      updated.title = { text: settings.title };
    }
    if (settings.colors) {
      updated.colors = settings.colors;
    }
    if (settings.effects?.includes("shadow")) {
      updated.chart = updated.chart || {};
      updated.chart.dropShadow = {
        enabled: true,
        blur: 4,
        opacity: 0.35
      };
    }
    return updated;
  }

  @wire(getDatasets, {
    datasetTypes: ["Default", "Live"],
    licenseType: "EinsteinAnalytics",
    pageSize: 200,
    q: "exped"
  })
  onGetDataset({ data, error }) {
    if (data) {
      this.datasetIds = {};
      data.datasets.forEach((ds) => {
        this.datasetIds[ds.name] = `${ds.id}/${ds.currentVersionId}`;
      });
      this.fetchFilterOptions();
    } else if (error) {
      console.error("getDatasets ERROR:", error);
    }
  }

  // ---- Filter option queries ----
  get hostQuery() {
    if (this.datasetIds) {
      const id = this.datasetIds.exped;
      let saql = `q = load "${id}";\n`;
      saql += this.getFilters({ exclude: ["host"] });
      saql += "q = group q by 'host';\n";
      saql += "q = foreach q generate q.'host' as host;";
      return { query: saql };
    }
    return undefined;
  }
  get nationQuery() {
    if (this.datasetIds) {
      const id = this.datasetIds.exped;
      let saql = `q = load "${id}";\n`;
      saql += this.getFilters({ exclude: ["nation"] });
      saql += "q = group q by 'nation';\n";
      saql += "q = foreach q generate q.'nation' as nation;";
      return { query: saql };
    }
    return undefined;
  }
  get seasonQuery() {
    if (this.datasetIds) {
      const id = this.datasetIds.exped;
      let saql = `q = load "${id}";\n`;
      saql += this.getFilters({ exclude: ["season"] });
      saql += "q = group q by 'season';\n";
      saql += "q = foreach q generate q.'season' as season;";
      return { query: saql };
    }
    return undefined;
  }

  onHostQuery({ data }) {
    if (data) {
      this.hostOptions = data.results.records.map((r) => ({
        label: r.host,
        value: r.host
      }));
    }
  }

  onNationQuery({ data }) {
    if (data) {
      this.nationOptions = data.results.records.map((r) => ({
        label: r.nation,
        value: r.nation
      }));
    }
  }

  onSeasonQuery({ data }) {
    if (data) {
      this.seasonOptions = data.results.records.map((r) => ({
        label: r.season,
        value: r.season
      }));
    }
  }

  // ---- Chart data queries ----
  get climbsByNationQuery() {
    if (!this.datasetIds) return undefined;
    const id = this.datasetIds.exped;
    let saql = `q = load "${id}";\n`;
    saql += this.getFilters();
    saql += "q = group q by 'nation';\n";
    saql +=
      "q = foreach q generate q.'nation' as nation, count(q) as Climbs;\n";
    saql += "q = order q by 'Climbs' desc;\nq = limit q 20;";
    return { query: saql };
  }
  get climbsByNationAOQuery() {
    if (!this.datasetIds) return undefined;
    const id = this.datasetIds.exped;
    let saql = `q = load "${id}";\n`;
    saql += this.getFilters({ inverseHosts: true, inverseNations: true });
    saql += "q = group q by 'nation';\n";
    saql +=
      "q = foreach q generate q.'nation' as nation, count(q) as Climbs;\n";
    saql += "q = order q by 'Climbs' desc;\nq = limit q 20;";
    return { query: saql };
  }
  get timeByPeakQuery() {
    if (!this.datasetIds) return undefined;
    const id = this.datasetIds.exped;
    let saql = `q = load "${id}";\n`;
    saql += this.getFilters();
    saql += "q = group q by 'peakid';\n";
    saql +=
      "q = foreach q generate q.'peakid' as peakid, min(q.'totdays') as A, percentile_disc(0.25) within group (order by q.'totdays') as B, percentile_disc(0.75) within group (order by q.'totdays') as C, max(q.'totdays') as D;\n";
    saql += "q = limit q 20;";
    return { query: saql };
  }
  get timeByPeakAOQuery() {
    if (!this.datasetIds) return undefined;
    const id = this.datasetIds.exped;
    let saql = `q = load "${id}";\n`;
    saql += this.getFilters({ inverseHosts: true, inverseNations: true });
    saql += "q = group q by 'peakid';\n";
    saql +=
      "q = foreach q generate q.'peakid' as peakid, min(q.'totdays') as A, percentile_disc(0.25) within group (order by q.'totdays') as B, percentile_disc(0.75) within group (order by q.'totdays') as C, max(q.'totdays') as D;\n";
    saql += "q = limit q 20;";
    return { query: saql };
  }
  get campsByPeakQuery() {
    if (!this.datasetIds) return undefined;
    const id = this.datasetIds.exped;
    let saql = `q = load "${id}";\n`;
    saql += this.getFilters();
    saql += "q = group q by 'peakid';\n";
    saql +=
      "q = foreach q generate q.'peakid' as peakid, avg(q.'camps') as A;\n";
    saql += "q = order q by A desc;\nq = limit q 20;";
    return { query: saql };
  }
  get campsByPeakAOQuery() {
    if (!this.datasetIds) return undefined;
    const id = this.datasetIds.exped;
    let saql = `q = load "${id}";\n`;
    saql += this.getFilters({ inverseHosts: true, inverseNations: true });
    saql += "q = group q by 'peakid';\n";
    saql +=
      "q = foreach q generate q.'peakid' as peakid, avg(q.'camps') as A;\n";
    saql += "q = order q by A desc;\nq = limit q 20;";
    return { query: saql };
  }

  onClimbsByNation({ data }) {
    if (data) {
      const labels = [],
        values = [];
      data.results.records.forEach((r) => {
        labels.push(r.nation);
        values.push(r.Climbs);
      });
      const opts = { ...this.chartAOptions };
      opts.xaxis.categories = labels;
      opts.series = [{ name: "Climbs", data: values }];
      this.chartObject.ClimbsByNation?.updateOptions(
        this.applySettings(opts, "ClimbsByNation")
      );
    }
  }

  onClimbsByNationAO({ data }) {
    if (data) {
      const labels = [],
        values = [];
      data.results.records.forEach((r) => {
        labels.push(r.nation);
        values.push(r.Climbs);
      });
      const opts = { ...this.chartAOptions };
      opts.xaxis.categories = labels;
      opts.series = [{ name: "Climbs", data: values }];
      this.chartObject.ClimbsByNationAO?.updateOptions(
        this.applySettings(opts, "ClimbsByNationAO")
      );
    }
  }

  onTimeByPeak({ data }) {
    if (data) {
      const records = data.results.records.map((r) => ({
        x: r.peakid,
        y: [r.A, r.B, (r.B + r.C) / 2, r.C, r.D]
      }));
      const opts = { ...this.chartBoxOptions };
      opts.series = [{ name: "Days", data: records }];
      this.chartObject.TimeByPeak?.updateOptions(
        this.applySettings(opts, "TimeByPeak")
      );
    }
  }

  onTimeByPeakAO({ data }) {
    if (data) {
      const records = data.results.records.map((r) => ({
        x: r.peakid,
        y: [r.A, r.B, (r.B + r.C) / 2, r.C, r.D]
      }));
      const opts = { ...this.chartBoxOptions };
      opts.series = [{ name: "Days", data: records }];
      this.chartObject.TimeByPeakAO?.updateOptions(
        this.applySettings(opts, "TimeByPeakAO")
      );
    }
  }

  onCampsByPeak({ data }) {
    if (data) {
      const labels = [],
        values = [];
      data.results.records.forEach((r) => {
        labels.push(r.peakid);
        values.push(r.A);
      });
      const opts = { ...this.chartAOptions };
      opts.xaxis.categories = labels;
      opts.series = [{ name: "Avg Camps", data: values }];
      this.chartObject.CampsByPeak?.updateOptions(
        this.applySettings(opts, "CampsByPeak")
      );
    }
  }

  onCampsByPeakAO({ data }) {
    if (data) {
      const labels = [],
        values = [];
      data.results.records.forEach((r) => {
        labels.push(r.peakid);
        values.push(r.A);
      });
      const opts = { ...this.chartAOptions };
      opts.xaxis.categories = labels;
      opts.series = [{ name: "Avg Camps", data: values }];
      this.chartObject.CampsByPeakAO?.updateOptions(
        this.applySettings(opts, "CampsByPeakAO")
      );
    }
  }

  renderedCallback() {
    if (this._chartsInitialized) {
      return;
    }
    this._chartsInitialized = true;

    if (!apexChartsPromise) {
      apexChartsPromise = loadScript(this, apexchartJs + "/dist/apexcharts.js");
    }

    apexChartsPromise
      .then(() => {
        // initialize all six charts once the script is loaded
        this.initChart(".ClimbsByNation", this.chartAOptions, "ClimbsByNation");
        this.initChart(
          ".ClimbsByNationAO",
          this.chartAOptions,
          "ClimbsByNationAO"
        );
        this.initChart(".CampsByPeak", this.chartAOptions, "CampsByPeak");
        this.initChart(".CampsByPeakAO", this.chartAOptions, "CampsByPeakAO");
        this.initChart(".TimeByPeak", this.chartBoxOptions, "TimeByPeak");
        this.initChart(".TimeByPeakAO", this.chartBoxOptions, "TimeByPeakAO");
      })
      .catch((error) => {
        console.error("Failed to load ApexCharts", error);
      });
  }

  initChart(selector, options, name) {
    const div = this.template.querySelector(selector);
    const settings = this.chartSettings[name] || {};
    const chartOptions = { ...options };
    if (settings.title) {
      chartOptions.title = { text: settings.title };
    }
    if (settings.colors) {
      chartOptions.colors = settings.colors;
    }
    if (settings.effects?.includes("shadow")) {
      chartOptions.chart = chartOptions.chart || {};
      chartOptions.chart.dropShadow = {
        enabled: true,
        blur: 4,
        opacity: 0.35
      };
    }
    // eslint-disable-next-line no-undef
    const chart = new ApexCharts(div, chartOptions);
    chart.render();
    this.chartObject[name] = chart;
  }

  fetchFilterOptions() {
    const queries = [
      [this.hostQuery, this.onHostQuery.bind(this)],
      [this.nationQuery, this.onNationQuery.bind(this)],
      [this.seasonQuery, this.onSeasonQuery.bind(this)]
    ];
    for (const [q, cb] of queries) {
      if (q) {
        this.enqueueQuery(q, cb);
      }
    }
  }

  // ---- UI event handlers ----
  handleHostChange(event) {
    this.hostSelections = event.detail.value;
    this.fetchFilterOptions();
  }
  handleNationChange(event) {
    this.nationSelections = event.detail.value;
    this.fetchFilterOptions();
  }
  handleSeasonChange(event) {
    this.seasonSelections = event.detail.value;
    this.fetchFilterOptions();
  }
  handleSkiChange(event) {
    this.skiSelection = event.detail.value;
    this.fetchFilterOptions();
  }
  handleNavClick(event) {
    event.preventDefault();
    const id = event.target.dataset.id;
    if (id) {
      this.activePage = id;
    }
  }
  filtersUpdated() {
    this.fetchFilterOptions();
    this.runChartQueries();
  }

  @api
  runChartQueries() {
    const pairs = [
      [this.climbsByNationQuery, this.onClimbsByNation.bind(this)],
      [this.climbsByNationAOQuery, this.onClimbsByNationAO.bind(this)],
      [this.timeByPeakQuery, this.onTimeByPeak.bind(this)],
      [this.timeByPeakAOQuery, this.onTimeByPeakAO.bind(this)],
      [this.campsByPeakQuery, this.onCampsByPeak.bind(this)],
      [this.campsByPeakAOQuery, this.onCampsByPeakAO.bind(this)]
    ];
    for (const [query, callback] of pairs) {
      if (query) {
        this.enqueueQuery(query, callback);
      }
    }
  }

  // ---- SAQL filter builder ----
  getFilters(options = {}) {
    const {
      inverseHosts = false,
      inverseNations = false,
      exclude = []
    } = options;
    let saql = "";
    if (this.hostSelections.length && !exclude.includes("host")) {
      const notStr = inverseHosts ? "not " : "";
      saql += `q = filter q by 'host' ${notStr}in ${JSON.stringify(this.hostSelections)};\n`;
    }
    if (this.nationSelections.length && !exclude.includes("nation")) {
      const notStr = inverseNations ? "not " : "";
      saql += `q = filter q by 'nation' ${notStr}in ${JSON.stringify(this.nationSelections)};\n`;
    }
    if (this.seasonSelections.length && !exclude.includes("season")) {
      saql += `q = filter q by 'season' in ${JSON.stringify(this.seasonSelections)};\n`;
    }
    if (this.skiSelection.length && !exclude.includes("ski")) {
      saql += `q = filter q by 'ski' ${this.skiSelection};\n`;
    }
    return saql;
  }

  chartAOptions = {
    chart: { type: "bar", height: 410 },
    series: [],
    xaxis: { categories: [] },
    noData: { text: "Loading..." }
  };

  chartBoxOptions = {
    chart: { type: "boxPlot", height: 410 },
    series: [],
    xaxis: { type: "category" },
    noData: { text: "Loading..." }
  };
}
