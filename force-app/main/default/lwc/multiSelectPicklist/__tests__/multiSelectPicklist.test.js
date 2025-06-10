import { createElement } from 'lwc';
import MultiSelectPicklist from 'c/multiSelectPicklist';

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
});
