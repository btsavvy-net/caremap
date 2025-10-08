import { Extension } from '@/services/fhir-service/resources/types/Extension';
import { Narrative } from '@/services/fhir-service/resources/types/Narrative';
import { Resource } from '@/services/fhir-service/resources/types/Resource';

export interface DomainResource extends Resource {
    contained?: Resource[];
    extension?: Extension[];
    modifierExtension?: Extension[];
    text?: Narrative;
}

