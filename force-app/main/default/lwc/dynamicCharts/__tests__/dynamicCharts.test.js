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

        const chartDiv = element.shadowRoot.querySelector('div.ClimbsByNation');
        expect(chartDiv).not.toBeNull();
    });

    it('renders second chart container', () => {
        const element = createElement('c-dynamic-charts', {
            is: DynamicCharts
        });
        document.body.appendChild(element);

        const chartDiv = element.shadowRoot.querySelector('div.ClimbsByNationAO');
        expect(chartDiv).not.toBeNull();
    });

    it('renders box plot containers', () => {
        const element = createElement('c-dynamic-charts', {
            is: DynamicCharts
        });
        document.body.appendChild(element);

        const chart3 = element.shadowRoot.querySelector('div.TimeByPeak');
        const chart4 = element.shadowRoot.querySelector('div.TimeByPeakAO');
        const chart5 = element.shadowRoot.querySelector('div.DaysPerPeak');
        expect(chart3).not.toBeNull();
        expect(chart4).not.toBeNull();
        expect(chart5).not.toBeNull();
    });
});