import { createElement } from 'lwc';
import DynamicCharts from 'c/dynamicCharts';

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
});