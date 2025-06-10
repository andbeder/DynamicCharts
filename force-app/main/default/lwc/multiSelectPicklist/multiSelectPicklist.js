import { LightningElement, api, track, wire } from 'lwc';
import { executeQuery } from 'lightning/analyticsWaveApi';

export default class MultiSelectPicklist extends LightningElement {
    @api label;
    @api maxSelections = 50;
    @api placeholder = 'Search...';
    @api query; // SAQL query to retrieve options if no options passed
    @api defaultOptions = [];

    @track options = [];
    @track filteredOptions = [];
    @track selectedItems = [];
    @track searchTerm = '';
    isOpen = false;

    @api
    get value() {
        return this.selectedItems.map(item => item.id);
    }

    set value(val) {
        if (Array.isArray(val)) {
            this.selectedItems = this.options
                .filter(opt => val.includes(opt.id))
                .map(opt => ({ id: opt.id, label: opt.label }));
            this.options.forEach(opt => {
                opt.isChecked = val.includes(opt.id);
            });
            this.filterOptions();
        }
    }

    connectedCallback() {
        if (this.query) {
            this.loadOptions();
        } else {
            this.options = this.defaultOptions.map(o => ({ ...o, isChecked: false }));
            this.filteredOptions = [...this.options];
        }
    }

    @wire(executeQuery, { query: '$builtQuery' })
    wiredOptions({ data }) {
        if (data && data.results) {
            this.options = data.results.records.map(r => ({ id: r.id || r.label, label: r.label || r.value, isChecked: false }));
            this.filterOptions();
        }
    }

    get builtQuery() {
        if (!this.query) {
            return undefined;
        }
        return { query: this.query };
    }

    loadOptions() {
        // Trigger wire service by referencing builtQuery getter
        this.builtQuery;
    }

    handleSearch(event) {
        this.searchTerm = event.target.value;
        this.filterOptions();
    }

    handleBlur() {
        this.isOpen = false;
    }

    toggleDropdown() {
        this.isOpen = !this.isOpen;
    }

    filterOptions() {
        const term = this.searchTerm.toLowerCase();
        this.filteredOptions = this.options
            .filter(opt => opt.label.toLowerCase().includes(term))
            .slice(0, 100);
    }

    handleSelect(event) {
        const id = event.target.dataset.id;
        const option = this.options.find(o => o.id === id);
        if (!option) return;
        option.isChecked = event.target.checked;
        if (option.isChecked) {
            if (this.selectedItems.length >= this.maxSelections) {
                option.isChecked = false;
                this.showError();
                return;
            }
            this.selectedItems.push({ id: option.id, label: option.label });
        } else {
            this.selectedItems = this.selectedItems.filter(item => item.id !== id);
            this.clearError();
        }
        this.dispatchChange();
    }

    removePill(event) {
        const id = event.target.name;
        const option = this.options.find(o => o.id === id);
        if (option) {
            option.isChecked = false;
        }
        this.selectedItems = this.selectedItems.filter(item => item.id !== id);
        this.dispatchChange();
    }

    selectAll() {
        for (let opt of this.filteredOptions) {
            if (!opt.isChecked) {
                if (this.selectedItems.length >= this.maxSelections) {
                    this.showError();
                    break;
                }
                opt.isChecked = true;
                this.selectedItems.push({ id: opt.id, label: opt.label });
            }
        }
        this.dispatchChange();
    }

    clearAll() {
        this.options.forEach(opt => opt.isChecked = false);
        this.selectedItems = [];
        this.clearError();
        this.dispatchChange();
    }

    showError() {
        const input = this.template.querySelector('lightning-input');
        input.setCustomValidity(`Maximum of ${this.maxSelections} items can be selected.`);
        input.reportValidity();
    }

    clearError() {
        const input = this.template.querySelector('lightning-input');
        input.setCustomValidity('');
        input.reportValidity();
    }

    dispatchChange() {
        this.placeholder = `${this.selectedItems.length} option(s) selected`;
        this.filterOptions();
        this.dispatchEvent(new CustomEvent('change', { detail: { value: this.value } }));
    }
}
