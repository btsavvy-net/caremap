import { Element } from '@/services/fhir-service/resources/types/Element';
import { Period } from '@/services/fhir-service/resources/types/Period';

export interface HumanName extends Element {
    family?: string;
    _family?: Element;
    given?: string[];
    _given?: Element;
    period?: Period;
    prefix?: string[];
    _prefix?: Element;
    suffix?: string[];
    _suffix?: Element;
    text?: string;
    _text?: Element;
    use?: 'usual' | 'official' | 'temp' | 'nickname' | 'anonymous' | 'old' | 'maiden';
    _use?: Element;
}

