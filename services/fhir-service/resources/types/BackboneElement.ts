import { Element } from '@/services/fhir-service/resources/types/Element';
import { Extension } from '@/services/fhir-service/resources/types/Extension';

export interface BackboneElement extends Element {
    modifierExtension?: Extension[];
}

