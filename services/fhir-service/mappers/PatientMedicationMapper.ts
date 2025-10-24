import { PatientMedication as DbPatientMedication } from "@/services/database/migrations/v1/schema_v1";
import { Fhir } from "@/services/fhir-service/Fhir";

export const PatientMedicationMapper = {
    // Converts a single FHIR MedicationStatement resource → DbPatientMedication object
    toDb: (fhir: Fhir.MedicationStatement, patientId: number): Partial<DbPatientMedication> => {

        let dosage = "";


        if (fhir.dosage && fhir.dosage.length > 0) {
            const firstDosage = fhir.dosage[0];

            const text = firstDosage.text ?? "";
            const quantityValue = firstDosage.doseAndRate?.[0].doseQuantity?.value;
            const quantityUnit = firstDosage.doseAndRate?.[0].doseQuantity?.unit;
            const timing = firstDosage.timing?.code?.text ?? "";
            const route = firstDosage.route?.text ?? "";

            dosage = ["Dosage: ", text, quantityValue, quantityUnit, timing, route]
                .filter(Boolean) // removes empty values
                .join(" ")
                .trim();
        }

        return {
            patient_id: patientId,
            linked_health_system: true,
            fhir_id: fhir.id,
            name: fhir.medicationCodeableConcept?.text ?? fhir.medicationCodeableConcept?.coding?.[0].display,
            details: dosage
        };
    }
};
