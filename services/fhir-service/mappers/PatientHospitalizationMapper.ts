import { Hospitalization as DbPatientHospitalization } from "@/services/database/migrations/v1/schema_v1";
import { Fhir } from "@/services/fhir-service/Fhir";

export const PatientHospitalizationMapper = {
    // Converts a single FHIR Encounter resource → DbPatientHospitalization object
    toDb: (fhir: Fhir.Encounter, patientId: number): Partial<DbPatientHospitalization> => ({
        patient_id: patientId,
        linked_health_system: true,
        fhir_id: fhir.id,
        admission_date: fhir.period?.start ? new Date(fhir.period?.start) : undefined,
        discharge_date: fhir.period?.end ? new Date(fhir.period?.end) : undefined,
        details: fhir.reasonCode?.[0].text,
    }),
};
