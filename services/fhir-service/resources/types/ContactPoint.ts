import { Element } from '@/services/fhir-service/resources/types/Element';
import { Period } from '@/services/fhir-service/resources/types/Period';

export interface ContactPoint extends Element {
    period?: Period;
    rank?: number;
    _rank?: Element;
    system?: 'phone' | 'fax' | 'email' | 'pager' | 'url' | 'sms' | 'other';
    _system?: Element;
    use?: 'home' | 'work' | 'temp' | 'old' | 'mobile';
    _use?: Element;
    value?: string;
    _value?: Element;
}

