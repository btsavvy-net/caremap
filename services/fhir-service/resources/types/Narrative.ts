import { Element } from '@/services/fhir-service/resources/types/Element';

export interface Narrative extends Element {
    div: string;
    _div?: Element;
    status: 'generated' | 'extensions' | 'additional' | 'empty';
    _status?: Element;
}

