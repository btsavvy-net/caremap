import { Meta } from '@/services/fhir-service/resources/types/Meta';

export interface Resource {
    id?: string;
    _id?: Element;
    implicitRules?: string;
    _implicitRules?: Element;
    language?: string;
    _language?: Element;
    meta?: Meta;
}

