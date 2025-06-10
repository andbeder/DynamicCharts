import { LightningElement, wire } from 'lwc';
import { getDatasets, executeQuery } from 'lightning/analyticsWaveApi';
import apexchartJs from '@salesforce/resourceUrl/ApexCharts';
import { loadScript } from 'lightning/platformResourceLoader';

export default class SacCharts extends LightningElement {
    datasetIds;

    hostSelections = [];
    nationSelections = [];
    seasonSelections = [];
    skiSelection = [];

    hostOptions;
    nationOptions;
    seasonOptions;
    skiOptions = [
        { label: 'All', value: 'in all' },
        { label: 'Yes', value: '== "Yes"' },
        { label: 'No', value: '== "No"' }
    ];

    chartObject = {};

    @wire(getDatasets, {
        datasetTypes: ['Default', 'Live'],
        licenseType: 'EinsteinAnalytics',
        pageSize: 200,
        q: 'exped'
    })
    onGetDataset({ data, error }) {
        if (error) {
            // eslint-disable-next-line no-console
            console.log('getDatasets ERROR:', error);
        } else if (data) {
            this.datasetIds = {};
            data.datasets.forEach(ds => {
                this.datasetIds[ds.name] = `${ds.id}/${ds.currentVersionId}`;
            });
        }
    }

    // Option queries with cross-filtering
    get hostQuery() {
        if (this.datasetIds) {
            const id = this.datasetIds.exped;
            let saql = `q = load "${id}";\n`;
            saql += this.getFilters({ exclude: ['host'] });
            saql += "q = group q by 'host';\n";
            saql += "q = foreach q generate q.'host' as host;";
            return { query: saql };
        }
        return undefined;
    }

    get nationQuery() {
        if (this.datasetIds) {
            const id = this.datasetIds.exped;
            let saql = `q = load \"${id}\";\n`;
            saql += this.getFilters({ exclude: ['nation'] });
            saql += "q = group q by 'nation';\n";
            saql += "q = foreach q generate q.'nation' as nation;";
            return { query: saql };
        }
        return undefined;
    }

    get seasonQuery() {
        if (this.datasetIds) {
            const id = this.datasetIds.exped;
            let saql = `q = load \"${id}\";\n`;
            saql += this.getFilters({ exclude: ['season'] });
            saql += "q = group q by 'season';\n";
            saql += "q = foreach q generate q.'season' as season;";
            return { query: saql };
        }
        return undefined;
    }

    @wire(executeQuery, { query: '$hostQuery' })
    onHostQuery({ data, error }) {
        if (data) {
            this.hostOptions = data.results.records.map(r => ({ label: r.host, value: r.host }));
        }
    }

    @wire(executeQuery, { query: '$nationQuery' })
    onNationQuery({ data, error }) {
        if (data) {
            this.nationOptions = data.results.records.map(r => ({ label: r.nation, value: r.nation }));
        }
    }

    @wire(executeQuery, { query: '$seasonQuery' })
    onSeasonQuery({ data, error }) {
        if (data) {
            this.seasonOptions = data.results.records.map(r => ({ label: r.season, value: r.season }));
        }
    }

    // Chart query
    get chartAQuery() {
        if (!this.datasetIds) {
            return undefined;
        }
        const id = this.datasetIds.exped;
        let saql = `q = load "${id}";\n`;
        saql += this.getFilters();
        saql += "q = group q by 'nation';\n";
        saql += "q = foreach q generate q.'nation' as nation, count(q) as Climbs;\n";
        saql += "q = order q by 'Climbs' desc;\n";
        saql += 'q = limit q 20;';
        return { query: saql };
    }

    get chartBQuery() {
        if (!this.datasetIds) {
            return undefined;
        }
        const id = this.datasetIds.exped;
        let saql = `q = load "${id}";\n`;
        saql += this.getFilters({ inverseHosts: true, inverseNations: true });
        saql += "q = group q by 'nation';\n";
        saql += "q = foreach q generate q.'nation' as nation, count(q) as Climbs;\n";
        saql += "q = order q by 'Climbs' desc;\n";
        saql += 'q = limit q 20;';
        return { query: saql };
    }

    get chartCQuery() {
        if (!this.datasetIds) {
            return undefined;
        }
        const id = this.datasetIds.exped;
        let saql = `q = load \"${id}\";\n`;
        saql += this.getFilters();
        saql += "q = group q by 'peakid';\n";
        saql += "q = foreach q generate q.'peakid' as peakid, min(q.'totdays') as A, percentile_disc(0.25) within group (order by q.'totdays') as B, percentile_disc(0.75) within group (order by q.'totdays') as C, max(q.'totdays') as D;\n";
        saql += 'q = limit q 20;';
        return { query: saql };
    }

    get chartDQuery() {
        if (!this.datasetIds) {
            return undefined;
        }
        const id = this.datasetIds.exped;
        let saql = `q = load \"${id}\";\n`;
        saql += this.getFilters({ inverseHosts: true, inverseNations: true });
        saql += "q = group q by 'peakid';\n";
        saql += "q = foreach q generate q.'peakid' as peakid, min(q.'totdays') as A, percentile_disc(0.25) within group (order by q.'totdays') as B, percentile_disc(0.75) within group (order by q.'totdays') as C, max(q.'totdays') as D;\n";
        saql += 'q = limit q 20;';
        return { query: saql };
    }

    @wire(executeQuery, { query: '$chartAQuery' })
    onChartA({ data, error }) {
        if (data) {
            const labels = [];
            const values = [];
            data.results.records.forEach(r => {
                labels.push(r.nation);
                values.push(r.Climbs);
            });
            const options = { ...this.chartAOptions };
            options.xaxis.categories = labels;
            options.series = [{ name: 'Climbs', data: values }];
            if (this.chartObject.chartA) {
                this.chartObject.chartA.updateOptions(options);
            }
        }
    }

    @wire(executeQuery, { query: '$chartBQuery' })
    onChartB({ data, error }) {
        if (data) {
            const labels = [];
            const values = [];
            data.results.records.forEach(r => {
                labels.push(r.nation);
                values.push(r.Climbs);
            });
            const options = { ...this.chartAOptions };
            options.xaxis.categories = labels;
            options.series = [{ name: 'Climbs', data: values }];
            if (this.chartObject.chartB) {
                this.chartObject.chartB.updateOptions(options);
            }
        }
    }

    @wire(executeQuery, { query: '$chartCQuery' })
    onChartC({ data, error }) {
        if (data) {
            const records = data.results.records.map(r => ({
                x: r.peakid,
                y: [
                    r.A,
                    r.B,
                    (r.B + r.C) / 2,
                    r.C,
                    r.D
                ]
            }));
            const options = { ...this.chartBoxOptions };
            options.series = [{ name: 'Days', data: records }];
            if (this.chartObject.chartC) {
                this.chartObject.chartC.updateOptions(options);
            }
        }
    }

    @wire(executeQuery, { query: '$chartDQuery' })
    onChartD({ data, error }) {
        if (data) {
            const records = data.results.records.map(r => ({
                x: r.peakid,
                y: [
                    r.A,
                    r.B,
                    (r.B + r.C) / 2,
                    r.C,
                    r.D
                ]
            }));
            const options = { ...this.chartBoxOptions };
            options.series = [{ name: 'Days', data: records }];
            if (this.chartObject.chartD) {
                this.chartObject.chartD.updateOptions(options);
            }
        }
    }

    renderedCallback() {
        if (!this.chartObject.chartA) {
            this.initChart('.chart1', this.chartAOptions, 'chartA');
        }
        if (!this.chartObject.chartB) {
            this.initChart('.chart2', this.chartAOptions, 'chartB');
        }
        if (!this.chartObject.chartC) {
            this.initChart('.chart3', this.chartBoxOptions, 'chartC');
        }
        if (!this.chartObject.chartD) {
            this.initChart('.chart4', this.chartBoxOptions, 'chartD');
        }
    }

    initChart(selector, options, name) {
        loadScript(this, apexchartJs + '/dist/apexcharts.js')
            .then(() => {
                const div = this.template.querySelector(selector);
                const chart = new ApexCharts(div, options);
                chart.render();
                this.chartObject[name] = chart;
            })
            .catch(error => {
                // eslint-disable-next-line no-console
                console.error('Chart load failed', error);
            });
    }

    handleHostChange(event) {
        this.hostSelections = event.detail.value;
    }
    handleNationChange(event) {
        this.nationSelections = event.detail.value;
    }
    handleSeasonChange(event) {
        this.seasonSelections = event.detail.value;
    }
    handleSkiChange(event) {
        this.skiSelection = event.detail.value;
    }

    filtersUpdated() {
        // trigger refresh of charts
        this.onChartA({ data: undefined, error: undefined });
        this.onChartB({ data: undefined, error: undefined });
        this.onChartC({ data: undefined, error: undefined });
        this.onChartD({ data: undefined, error: undefined });
    }

    getFilters(options = {}) {
        const { inverseHosts = false, inverseNations = false, exclude = [] } = options;
        let saql = '';
        if (this.hostSelections.length > 0 && !exclude.includes('host')) {
            const notStr = inverseHosts ? 'not ' : '';
            saql += `q = filter q by 'host' ${notStr}in ${JSON.stringify(this.hostSelections)};\n`;
        }
        if (this.nationSelections.length > 0 && !exclude.includes('nation')) {
            const notStr = inverseNations ? 'not ' : '';
            saql += `q = filter q by 'nation' ${notStr}in ${JSON.stringify(this.nationSelections)};\n`;
        }
        if (this.seasonSelections.length > 0 && !exclude.includes('season')) {
            saql += `q = filter q by 'season' in ${JSON.stringify(this.seasonSelections)};\n`;
        }
        if (this.skiSelection.length > 0 && !exclude.includes('ski')) {
            saql += `q = filter q by 'ski' ${this.skiSelection};\n`;
        }
        return saql;
    }

    chartAOptions = {
        chart: { type: 'bar', height: 410 },
        series: [],
        xaxis: { categories: [] },
        noData: { text: 'Loading...' }
    };

    chartBoxOptions = {
        chart: { type: 'boxPlot', height: 410 },
        series: [],
        xaxis: { type: 'category' },
        noData: { text: 'Loading...' }
    };
}
