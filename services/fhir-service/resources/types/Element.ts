import { Extension } from '@/services/fhir-service/resources/types/Extension';

export interface Element {
    extension?: Extension[];
    id?: string;
    _id?: Element;
}

