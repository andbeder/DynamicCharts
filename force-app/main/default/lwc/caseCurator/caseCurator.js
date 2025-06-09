import { LightningElement } from 'lwc';

export default class CaseCurator extends LightningElement {
    value = [];
    
    get optionsFields(){
        return [
            { label: "Clinical Summary", value: "Clinical_Summary"},
            { label: "Description of Loss", value: "Loss_Description"},
            { label: "Claim History Summary", value: "History_Summary"}
        ]
    };

    get optionsAMC(){
        return [
            { label: "Johns Hopkins Medicine", value: "Johns Hopkins Medicine" },
            { label: "NYP/Columbia", value: "NYP/Columbia" },
            { label: "NYP/Cornell", value: "NYP/Cornell" },
            { label: "University of Rochester", value: "University of Rochester" },
            { label: "YNHHS-YSM", value: "YNHHS-YSM" }
        ]        
    }
}