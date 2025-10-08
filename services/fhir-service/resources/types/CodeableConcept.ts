import { Coding } from '@/services/fhir-service/resources/types/Coding';
import { Element } from '@/services/fhir-service/resources/types/Element';

export interface CodeableConcept extends Element {
    coding?: Coding[];
    text?: string;
    _text?: Element;
}

