import { DischargeInstruction as DbPatientDischargeInstruction } from "@/services/database/migrations/v1/schema_v1";
import { Fhir } from "@/services/fhir-service/Fhir";

export const PatientDischargeMapper = {
    // Converts a single FHIR ClinicalImpression resource → DbPatientDischargeInstruction object
    toDb: (fhir: Fhir.ClinicalImpression, patientId: number): Partial<DbPatientDischargeInstruction> => ({
        patient_id: patientId,
        linked_health_system: true,
        fhir_id: fhir.id,
        summary: fhir.summary,
        discharge_date: fhir.date ? new Date(fhir.date) : undefined,
        details: fhir.description,
    }),
};
