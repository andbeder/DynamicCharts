import { createElement } from 'lwc';
import DynamicCharts from 'c/dynamicCharts';
import { loadScript } from 'lightning/platformResourceLoader';

jest.mock('lightning/platformResourceLoader', () => {
    return {
        loadScript: jest.fn(() => Promise.resolve())
    };
});

beforeAll(() => {
    global.ApexCharts = jest.fn(() => ({ render: jest.fn(), updateOptions: jest.fn() }));
});

beforeEach(() => {
    global.fetch = jest.fn(() => Promise.resolve({ json: () => Promise.resolve({}) }));
});

describe('c-dynamic-charts', () => {
    afterEach(() => {
        // The jsdom instance is shared across test cases in a single file so reset the DOM
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });

    it('renders chart container', () => {
        const element = createElement('c-dynamic-charts', {
            is: DynamicCharts
        });
        document.body.appendChild(element);

        const chartDiv = element.shadowRoot.querySelector('div.chart1');
        expect(chartDiv).not.toBeNull();
    });

    it('renders second chart container', () => {
        const element = createElement('c-dynamic-charts', {
            is: DynamicCharts
        });
        document.body.appendChild(element);

        const chartDiv = element.shadowRoot.querySelector('div.chart2');
        expect(chartDiv).not.toBeNull();
    });

    it('renders box plot containers', () => {
        const element = createElement('c-dynamic-charts', {
            is: DynamicCharts
        });
        document.body.appendChild(element);

        const chart3 = element.shadowRoot.querySelector('div.chart3');
        const chart4 = element.shadowRoot.querySelector('div.chart4');
        expect(chart3).not.toBeNull();
        expect(chart4).not.toBeNull();
    });

    it('contains SAQL limit of 20 for each chart query', () => {
        const fs = require('fs');
        const file = fs.readFileSync(require.resolve('c/dynamicCharts'), 'utf8');
        const matches = file.match(/limit q 20/g) || [];
        expect(matches.length).toBe(4);
    });

    it('loads ApexCharts script only once', () => {
        const element1 = createElement('c-dynamic-charts', {
            is: DynamicCharts
        });
        const element2 = createElement('c-dynamic-charts', {
            is: DynamicCharts
        });
        document.body.appendChild(element1);
        document.body.appendChild(element2);
        return Promise.resolve().then(() => {
            expect(loadScript.mock.calls.length).toBe(1);
        });
    });

    it('skips update when no results returned', () => {
        const element = createElement('c-dynamic-charts', {
            is: DynamicCharts
        });
        document.body.appendChild(element);

        const chart = element.chartObject;
        element.chartObject.ClimbsByCountry = {
            updateOptions: jest.fn()
        };

        element.onClimbsByCountry({ data: { results: { records: [] } }, error: undefined });

        expect(element.chartObject.ClimbsByCountry.updateOptions).not.toHaveBeenCalled();
    });

    it('uses metadata titles when updating charts', () => {
        global.fetch = jest.fn(() => Promise.resolve({ json: () => Promise.resolve({
            ClimbsByCountry: { title: 'Meta Title' }
        }) }));

        const element = createElement('c-dynamic-charts', {
            is: DynamicCharts
        });
        document.body.appendChild(element);

        element.chartObject.ClimbsByCountry = {
            updateOptions: jest.fn()
        };

        return Promise.resolve()
            .then(() => Promise.resolve())
            .then(() => {
                element.onClimbsByCountry({ data: { results: { records: [{ nation: 'A', Climbs: 1 }] } }, error: undefined });
                expect(element.chartObject.ClimbsByCountry.updateOptions.mock.calls[0][0].title.text).toBe('Meta Title');
            });
    });
});
