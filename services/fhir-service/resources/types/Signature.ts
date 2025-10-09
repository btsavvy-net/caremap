import { Coding } from '@/services/fhir-service/resources/types/Coding';
import { Element } from '@/services/fhir-service/resources/types/Element';
import { Reference } from '@/services/fhir-service/resources/types/Reference';

export interface Signature extends Element {
    data?: string;
    _data?: Element;
    onBehalfOf?: Reference<'Device' | 'Organization' | 'Patient' | 'Practitioner' | 'PractitionerRole' | 'RelatedPerson'>;
    sigFormat?: string;
    _sigFormat?: Element;
    targetFormat?: string;
    _targetFormat?: Element;
    type: Coding[];
    when: string;
    _when?: Element;
    who: Reference<'Device' | 'Organization' | 'Patient' | 'Practitioner' | 'PractitionerRole' | 'RelatedPerson'>;
}

