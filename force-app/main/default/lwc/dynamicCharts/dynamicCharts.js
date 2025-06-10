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
    get climbsByCountryQuery() {
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

    get climbsByCountryAoQuery() {
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

    get totalTimeByPeakQuery() {
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

    get totalTimeByPeakAoQuery() {
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

    @wire(executeQuery, { query: '$climbsByCountryQuery' })
    onClimbsByCountry({ data, error }) {
        if (data) {
            const labels = [];
            const values = [];
            data.results.records.forEach(r => {
                labels.push(r.nation);
                values.push(r.Climbs);
            });
            const options = { ...this.barChartOptions };
            options.title = { text: 'Climbs By Country' };
            options.xaxis.categories = labels;
            options.series = [{ name: 'Climbs', data: values }];
            if (this.chartObject.ClimbsByCountry) {
                this.chartObject.ClimbsByCountry.updateOptions(options);
            }
        }
    }

    @wire(executeQuery, { query: '$climbsByCountryAoQuery' })
    onClimbsByCountryAo({ data, error }) {
        if (data) {
            const labels = [];
            const values = [];
            data.results.records.forEach(r => {
                labels.push(r.nation);
                values.push(r.Climbs);
            });
            const options = { ...this.barChartOptions };
            options.title = { text: 'Climbs By Country (All Other)' };
            options.xaxis.categories = labels;
            options.series = [{ name: 'Climbs', data: values }];
            if (this.chartObject.ClimbsByCountryAO) {
                this.chartObject.ClimbsByCountryAO.updateOptions(options);
            }
        }
    }

    @wire(executeQuery, { query: '$totalTimeByPeakQuery' })
    onTotalTimeByPeak({ data, error }) {
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
            const options = { ...this.boxPlotOptions };
            options.series = [{ name: 'Days', data: records }];
            options.title = { text: 'Total Time By Peak' };
            if (this.chartObject.TotalTimeByPeak) {
                this.chartObject.TotalTimeByPeak.updateOptions(options);
            }
        }
    }

    @wire(executeQuery, { query: '$totalTimeByPeakAoQuery' })
    onTotalTimeByPeakAo({ data, error }) {
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
            const options = { ...this.boxPlotOptions };
            options.series = [{ name: 'Days', data: records }];
            options.title = { text: 'Total Time By Peak (All Other)' };
            if (this.chartObject.TotalTimeByPeakAO) {
                this.chartObject.TotalTimeByPeakAO.updateOptions(options);
            }
        }
    }

    renderedCallback() {
        if (!this.chartObject.ClimbsByCountry) {
            this.initChart('#ClimbsByCountry', this.barChartOptions, 'ClimbsByCountry');
        }
        if (!this.chartObject.ClimbsByCountryAO) {
            this.initChart('#ClimbsByCountryAO', this.barChartOptions, 'ClimbsByCountryAO');
        }
        if (!this.chartObject.TotalTimeByPeak) {
            this.initChart('#TotalTimeByPeak', this.boxPlotOptions, 'TotalTimeByPeak');
        }
        if (!this.chartObject.TotalTimeByPeakAO) {
            this.initChart('#TotalTimeByPeakAO', this.boxPlotOptions, 'TotalTimeByPeakAO');
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
        this.onClimbsByCountry({ data: undefined, error: undefined });
        this.onClimbsByCountryAo({ data: undefined, error: undefined });
        this.onTotalTimeByPeak({ data: undefined, error: undefined });
        this.onTotalTimeByPeakAo({ data: undefined, error: undefined });
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

    barChartOptions = {
        chart: {
            type: 'bar',
            height: 410,
            dropShadow: { enabled: true, top: 2, left: 2, blur: 4, opacity: 0.3 }
        },
        series: [],
        xaxis: { categories: [] },
        noData: { text: 'Loading...' }
    };

    boxPlotOptions = {
        chart: {
            type: 'boxPlot',
            height: 410,
            dropShadow: { enabled: true, top: 2, left: 2, blur: 4, opacity: 0.3 }
        },
        series: [],
        xaxis: { type: 'category' },
        noData: { text: 'Loading...' }
    };
}
