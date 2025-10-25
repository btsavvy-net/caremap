import { SurgeryProcedure as DbPatientSurgeryProcedure } from "@/services/database/migrations/v1/schema_v1";
import { Fhir } from "@/services/fhir-service/Fhir";

export const PatientProcedureMapper = {
    // Converts a single FHIR Procedure resource → DbPatientSurgeryProcedure object
    toDb: (fhir: Fhir.Procedure, patientId: number): Partial<DbPatientSurgeryProcedure> => {

        let procedureDate;

        if(fhir.performedDateTime){
            procedureDate = new Date(fhir.performedDateTime)
        }
        else if(fhir.performedPeriod?.start){
            procedureDate = new Date(fhir.performedPeriod.start)
        }

        return {
            patient_id: patientId,
            linked_health_system: true,
            fhir_id: fhir.id,
            procedure_name: fhir.code?.text ?? fhir.code?.coding?.[0].display,
            facility: fhir.location?.display,
            complications: fhir.complication?.[0].text,
            surgeon_name: fhir.performer?.[0].actor.display,
            procedure_date: procedureDate,
            details: fhir.note?.[0].text,
        };
    }
};
