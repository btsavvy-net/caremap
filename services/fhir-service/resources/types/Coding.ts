import { Element } from '@/services/fhir-service/resources/types/Element';

export interface Coding extends Element {
    code?: string;
    _code?: Element;
    display?: string;
    _display?: Element;
    system?: string;
    _system?: Element;
    userSelected?: boolean;
    _userSelected?: Element;
    version?: string;
    _version?: Element;
}

