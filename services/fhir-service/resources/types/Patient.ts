import { Address } from '@/services/fhir-service/resources/types/Address';
import { Attachment } from '@/services/fhir-service/resources/types/Attachment';
import { BackboneElement } from '@/services/fhir-service/resources/types/BackboneElement';
import { CodeableConcept } from '@/services/fhir-service/resources/types/CodeableConcept';
import { ContactPoint } from '@/services/fhir-service/resources/types/ContactPoint';
import { DomainResource } from '@/services/fhir-service/resources/types/DomainResource';
import { HumanName } from '@/services/fhir-service/resources/types/HumanName';
import { Identifier } from '@/services/fhir-service/resources/types/Identifier';
import { Period } from '@/services/fhir-service/resources/types/Period';
import { Reference } from '@/services/fhir-service/resources/types/Reference';


export interface PatientCommunication extends BackboneElement {
    language: CodeableConcept;
    preferred?: boolean;
}

export interface PatientContact extends BackboneElement {
    address?: Address;
    gender?: 'male' | 'female' | 'other' | 'unknown';
    name?: HumanName;
    organization?: Reference<'Organization'>;
    period?: Period;
    relationship?: CodeableConcept[];
    telecom?: ContactPoint[];
}

export interface PatientLink extends BackboneElement {
    other: Reference<'Patient' | 'RelatedPerson'>;
    type: 'replaced-by' | 'replaces' | 'refer' | 'seealso';
}

export interface Patient extends DomainResource {
    active?: boolean;
    _active?: Element;
    address?: Address[];
    birthDate?: string;
    _birthDate?: Element;
    communication?: PatientCommunication[];
    contact?: PatientContact[];
    deceasedBoolean?: boolean;
    _deceasedBoolean?: Element;
    deceasedDateTime?: string;
    _deceasedDateTime?: Element;
    gender?: 'male' | 'female' | 'other' | 'unknown';
    _gender?: Element;
    generalPractitioner?: Reference<'Organization' | 'Practitioner' | 'PractitionerRole'>[];
    identifier?: Identifier[];
    link?: PatientLink[];
    managingOrganization?: Reference<'Organization'>;
    maritalStatus?: CodeableConcept;
    multipleBirthBoolean?: boolean;
    _multipleBirthBoolean?: Element;
    multipleBirthInteger?: number;
    _multipleBirthInteger?: Element;
    name?: HumanName[];
    photo?: Attachment[];
    telecom?: ContactPoint[];
}

