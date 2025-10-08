import { Element } from '@/services/fhir-service/resources/types/Element';

export interface Period extends Element {
    end?: string;
    _end?: Element;
    start?: string;
    _start?: Element;
}

