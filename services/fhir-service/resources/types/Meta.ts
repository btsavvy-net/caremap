import { Coding } from '@/services/fhir-service/resources/types/Coding';
import { Element } from '@/services/fhir-service/resources/types/Element';

export interface Meta extends Element {
    lastUpdated?: string;
    _lastUpdated?: Element;
    profile?: string[];
    _profile?: Element;
    security?: Coding[];
    source?: string;
    _source?: Element;
    tag?: Coding[];
    versionId?: string;
    _versionId?: Element;
}

