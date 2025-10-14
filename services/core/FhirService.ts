import { createApiService } from "@/services/api/ApiService";
import { Patient as DbPatient } from '@/services/database/migrations/v1/schema_v1';
import { Fhir } from "@/services/fhir-service/Fhir";
import { FHIR_CONFIG } from "@/services/fhir-service/fhir-config";
import { PatientMapper } from "@/services/fhir-service/mappers/PatientMapper";

const api = createApiService({
    baseURL: FHIR_CONFIG.BASE_URL,
    timeout: FHIR_CONFIG.TIMEOUT,
});

export const FhirService = {
    getPatient: async (patientId: string): Promise<Partial<DbPatient>> => {
        const response = await api.get(`/Patient/${patientId}?_format=json`);
        const dbPatient = PatientMapper.toDb(response as unknown as Fhir.Patient);
        return dbPatient;
    },

    getEverything: async (patientId: string) => {
        return api.get(`/Patient/${patientId}/$everything?_format=json`);
    },
};