import { createElement } from 'lwc';
import MultiSelectPicklist from 'c/multiSelectPicklist';
import { registerTestWireAdapter } from '@salesforce/sfdx-lwc-jest';
import { executeQuery } from 'lightning/analyticsWaveApi';

const executeQueryAdapter = registerTestWireAdapter(executeQuery);

describe('c-multi-select-picklist', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });

    it('tracks selected values via the value property', () => {
        const element = createElement('c-multi-select-picklist', {
            is: MultiSelectPicklist
        });
        element.defaultOptions = [
            { id: '1', label: 'One' },
            { id: '2', label: 'Two' }
        ];
        document.body.appendChild(element);

        element.value = ['1'];
        return Promise.resolve().then(() => {
            expect(element.value).toEqual(['1']);
        });
    });

    it('maps wire results with custom keys to option labels', () => {
        const element = createElement('c-multi-select-picklist', {
            is: MultiSelectPicklist
        });
        element.query = 'dummy';
        document.body.appendChild(element);

        executeQueryAdapter.emit({ results: { records: [{ season: '2021' }] } });

        return Promise.resolve()
            .then(() => Promise.resolve())
            .then(() => {
                expect(element.options[0].label).toBe('2021');
                expect(element.options[0].id).toBe('2021');
            });
    });
});
