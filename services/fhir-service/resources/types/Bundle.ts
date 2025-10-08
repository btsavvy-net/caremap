import { BackboneElement } from '@/services/fhir-service/resources/types/BackboneElement';
import { Identifier } from '@/services/fhir-service/resources/types/Identifier';
import { Resource } from '@/services/fhir-service/resources/types/Resource';
import { Signature } from '@/services/fhir-service/resources/types/Signature';


export interface BundleEntry extends BackboneElement {
    fullUrl?: string;
    link?: BundleLink[];
    request?: BundleEntryRequest;
    resource?: Resource;
    response?: BundleEntryResponse;
    search?: BundleEntrySearch;
}

export interface BundleEntryRequest extends BackboneElement {
    ifMatch?: string;
    ifModifiedSince?: string;
    ifNoneExist?: string;
    ifNoneMatch?: string;
    method: 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    url: string;
}

export interface BundleEntryResponse extends BackboneElement {
    etag?: string;
    lastModified?: string;
    location?: string;
    outcome?: Resource;
    status: string;
}

export interface BundleEntrySearch extends BackboneElement {
    mode?: 'match' | 'include' | 'outcome';
    score?: number;
}

export interface BundleLink extends BackboneElement {
    relation: string;
    url: string;
}

export interface Bundle extends Resource {
    entry?: BundleEntry[];
    identifier?: Identifier;
    link?: BundleLink[];
    signature?: Signature;
    timestamp?: string;
    _timestamp?: Element;
    total?: number;
    _total?: Element;
    type: 'document' | 'message' | 'transaction' | 'transaction-response' | 'batch' | 'batch-response' | 'history' | 'searchset' | 'collection';
    _type?: Element;
}

