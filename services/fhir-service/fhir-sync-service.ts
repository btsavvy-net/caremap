import { Patient as DbPatient } from "@/services/database/migrations/v1/schema_v1";
import { logger } from "@/services/logging/logger";
import { FhirService } from "../core/FhirService";

export const handleBackgroundFhirSync = async (patient: DbPatient) => {
    if (!patient) {
        throw new Error("Patient not found");
    }
    logger.debug(`Syncing FHIR Data`);
};