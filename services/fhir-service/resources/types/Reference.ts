import { Element } from '@/services/fhir-service/resources/types/Element';
import { Identifier } from '@/services/fhir-service/resources/types/Identifier';

export interface Reference<T extends string = string> extends Element {
    display?: string;
    _display?: Element;
    identifier?: Identifier;
    reference?: `${T}/${string}`;
    _reference?: Element;
    type?: string;
    _type?: Element;
}

