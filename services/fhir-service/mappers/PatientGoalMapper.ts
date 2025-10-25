import { PatientGoal as DbPatientGoal } from "@/services/database/migrations/v1/schema_v1";
import { Fhir } from "@/services/fhir-service/Fhir";

export const PatientGoalMapper = {
    // Converts a single FHIR Goal resource → DbPatientGoal object
    toDb: (fhir: Fhir.Goal, patientId: number): Partial<DbPatientGoal> => {

        return {
            patient_id: patientId,
            linked_health_system: true,
            fhir_id: fhir.id,
            goal_description: fhir.description.text,
            target_date: fhir.target?.[0].dueDate ? new Date(fhir.target?.[0].dueDate) : undefined,
        };
    }
};
