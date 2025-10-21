import { Patient as DbPatient } from "@/services/database/migrations/v1/schema_v1";
import { Fhir } from "@/services/fhir-service/Fhir";
import { Mapper } from "@/services/fhir-service/mappers/BaseMapper";

export const PatientMapper: Mapper<Fhir.Patient, DbPatient> = {

    toDb: (fhir: Fhir.Patient): Partial<DbPatient> => {
        if (!fhir) return {};

        const nameObj = fhir.name?.[0] || {};

        return {
            first_name: nameObj.given?.[0] || "",
            middle_name: nameObj.given?.[1],
            last_name: nameObj.family || "",
            gender: fhir.gender || undefined,
            date_of_birth: fhir.birthDate ? new Date(fhir.birthDate) : undefined,
        };
    },

    toFhir: (db: DbPatient): Partial<Fhir.Patient> => {
        return {
            resourceType: "Patient",
            id: String(db.id),
            name: [
                {
                    given: db.middle_name
                        ? [db.first_name, db.middle_name]
                        : [db.first_name],
                    family: db.last_name,
                },
            ],
            gender: db.gender as Fhir.Patient["gender"],
            birthDate: db.date_of_birth?.toISOString().split("T")[0],
        };
    },
};
