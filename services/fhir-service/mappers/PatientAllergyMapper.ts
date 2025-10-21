import { SeverityType } from "@/constants/fhirTypes";
import { PatientAllergy as DbPatientAllergy } from "@/services/database/migrations/v1/schema_v1";
import { Fhir } from "@/services/fhir-service/Fhir";

export const PatientAllergyMapper = {
    // Converts a single FHIR AllergyIntolerance resource → DbPatientAllergy object
    toDb: (fhir: Fhir.AllergyIntolerance, patientId: number): Partial<DbPatientAllergy> => ({
        patient_id: patientId,
        linked_health_system: true,
        fhir_id: fhir.id,
        topic: fhir.code?.text ?? fhir.code?.coding?.[0].display,
        details: fhir.reaction?.[0].manifestation?.[0].text,
        onset_date: fhir.onsetPeriod?.start ? new Date(fhir.onsetPeriod?.start) : undefined,
        severity: fhir.reaction?.[0].severity as SeverityType,
    }),
};
