import { FhirService } from "@/services/core/FhirService";
import { deletePatientByFhirId, getPatientByFhirId, updatePatient } from "@/services/core/PatientService";
import { BaseModel, useModel } from "@/services/database/BaseModel";
import { Patient as DbPatient } from "@/services/database/migrations/v1/schema_v1";
import { DischargeInstructionModel } from "@/services/database/models/DischargeInstructionModel";
import { HospitalizationModel } from "@/services/database/models/HospitalizationModel";
import { PatientAllergyModel } from "@/services/database/models/PatientAllergyModel";
import { PatientConditionModel } from "@/services/database/models/PatientConditionModel";
import { PatientMedicationModel } from "@/services/database/models/PatientMedicationModel";
import { SurgeryProcedureModel } from "@/services/database/models/SurgeryProcedureModel";
import { logger } from "@/services/logging/logger";

function getSyncAction<T>(fhirData: T | null, exists: boolean) {
    if (!fhirData && exists) return "delete";
    if (fhirData && !exists) return "create";
    if (fhirData && exists) return "update";
    return "skip";
}

function createFhirLinkedService<T>(model: BaseModel<T>) {
    return {
        getByFhirId: async (patientId: number, fhirId: string) =>
            useModel(model, (m) => m.getFirstByFields({ patient_id: patientId, fhir_id: fhirId })),

        create: async (data: Partial<T>) =>
            useModel(model, (m) => m.insert(data)),

        updateByFhirId: async (data: Partial<T>, where: Partial<T>) =>
            useModel(model, (m) => m.updateByFields(data, where)),

        deleteByFhirId: async (where: Partial<T>) =>
            useModel(model, (m) => m.deleteByFields(where)),
    };
}

const PatientAllergyService = createFhirLinkedService(new PatientAllergyModel());
const PatientConditionService = createFhirLinkedService(new PatientConditionModel());
const PatientMedicationService = createFhirLinkedService(new PatientMedicationModel());
const PatientHospitalizationService = createFhirLinkedService(new HospitalizationModel());
const PatientDischargeInstructionService = createFhirLinkedService(new DischargeInstructionModel());
const PatientSurgeryProcedureService = createFhirLinkedService(new SurgeryProcedureModel());

export async function handleBackgroundFhirSync(patient: DbPatient) {

    logger.debug(`[FHIR SYNC] Starting background sync for patient ${patient.id}`);

    // Patient record sync

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


    // Patient Health records sync

    const resourcesToSync = [
        { name: "Medical Condition", fetch: FhirService.getPatientConditions, service: PatientConditionService },
        { name: "Patient Allergy", fetch: FhirService.getPatientAllergies, service: PatientAllergyService },
        { name: "Patient Medication", fetch: FhirService.getPatientMedications, service: PatientMedicationService },
        { name: "Patient Hospitalization", fetch: FhirService.getPatientHospitalizations, service: PatientHospitalizationService },
        { name: "Patient Surgery Procedure", fetch: FhirService.getPatientSurgeryProcedures, service: PatientSurgeryProcedureService }
        // add more here in same pattern
    ];

    for (const { name, fetch, service } of resourcesToSync) {
        try {
            const fhirItems = await fetch(patient.fhir_id, patient.id); // returns DbEntity[] | null
            if (!fhirItems) {
                logger.debug(`[FHIR SYNC][${name}] No FHIR data returned.`);
                continue;
            }

            for (const fhirItem of fhirItems) {
                if (!fhirItem || !fhirItem.fhir_id) {
                    logger.debug(`[FHIR SYNC][${name}] Skipping item without fhir_id`);
                    continue;
                }
                const existing = await service.getByFhirId(patient.id, fhirItem.fhir_id);
                const action = getSyncAction(fhirItem, !!existing);

                logger.debug(`[FHIR SYNC][${name}] Action: ${action}`);

                if (action === "delete") {
                    await service.deleteByFhirId({ patient_id: patient.id, fhir_id: fhirItem.fhir_id });
                } else if (action === "create") {
                    logger.debug('[FHIR SYNC][Allergy]', JSON.stringify({ ...fhirItem }));
                    await service.create(fhirItem);
                } else if (action === "update") {
                    await service.updateByFhirId(fhirItem, { patient_id: patient.id, fhir_id: fhirItem.fhir_id });
                }
            }
        } catch (err: any) {
            logger.debug(`[FHIR SYNC][${name}] Error: ${err.message}`);
        }
    }


    logger.debug(`[FHIR SYNC] Completed successfully for patient ${patient.id}`);
}
