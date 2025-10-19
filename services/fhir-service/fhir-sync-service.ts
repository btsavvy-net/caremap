import { Patient as DbPatient } from "@/services/database/migrations/v1/schema_v1";
import { logger } from "@/services/logging/logger";
import { FhirService } from "../core/FhirService";
import { deletePatientByFhirId, getPatientByFhirId, updatePatient } from "@/services/core/PatientService";

function getSyncAction<T>(fhirData: T | null, exists: boolean) {
    if (!fhirData && exists) return "delete";
    if (fhirData && !exists) return "create";
    if (fhirData && exists) return "update";
    return "skip";
}

export async function handleBackgroundFhirSync(patient: DbPatient) {
    logger.debug(`[FHIR SYNC] Starting background sync for patient ${patient.id}`);
    
    const fhirPatient = await FhirService.getPatient(patient.fhir_id);
    const existingPatient = await getPatientByFhirId(patient.fhir_id);
    const patientAction = getSyncAction(fhirPatient, !!existingPatient);

    logger.debug(`[FHIR SYNC][Patient] Action: ${patientAction}`);

    if (patientAction === "delete") {
        await deletePatientByFhirId(patient.fhir_id);
        logger.debug(`[FHIR SYNC][STOP] Patient deleted. Stopping sync.`);
        return;
    }

    if (patientAction === "update") {
        await updatePatient(fhirPatient!, { fhir_id: existingPatient?.fhir_id });
    }

    logger.debug(`[FHIR SYNC] Completed successfully for patient ${patient.id}`);
}
