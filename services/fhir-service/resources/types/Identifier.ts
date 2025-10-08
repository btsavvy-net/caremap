import { CodeableConcept } from '@/services/fhir-service/resources/types/CodeableConcept';
import { Element } from '@/services/fhir-service/resources/types/Element';
import { Period } from '@/services/fhir-service/resources/types/Period';
import { Reference } from '@/services/fhir-service/resources/types/Reference';

export interface Identifier extends Element {
    assigner?: Reference<'Organization'>;
    period?: Period;
    system?: string;
    _system?: Element;
    type?: CodeableConcept;
    use?: 'usual' | 'official' | 'temp' | 'secondary' | 'old';
    _use?: Element;
    value?: string;
    _value?: Element;
}

