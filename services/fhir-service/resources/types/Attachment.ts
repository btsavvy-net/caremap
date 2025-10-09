import { Element } from '@/services/fhir-service/resources/types/Element';

export interface Attachment extends Element {
    contentType?: string;
    _contentType?: Element;
    creation?: string;
    _creation?: Element;
    data?: string;
    _data?: Element;
    hash?: string;
    _hash?: Element;
    language?: string;
    _language?: Element;
    size?: number;
    _size?: Element;
    title?: string;
    _title?: Element;
    url?: string;
    _url?: Element;
}

