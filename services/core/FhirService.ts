import { createApiService, retry } from "@/services/api/ApiService";
import { Patient as DbPatient, DischargeInstruction, Hospitalization, PatientAllergy, PatientCondition, PatientMedication } from '@/services/database/migrations/v1/schema_v1';
import { Fhir } from "@/services/fhir-service/Fhir";
import { FHIR_CONFIG } from "@/services/fhir-service/fhir-config";
import { PatientAllergyMapper } from "@/services/fhir-service/mappers/PatientAllergyMapper";
import { PatientConditionMapper } from "@/services/fhir-service/mappers/PatientConditionMapper";
import { PatientDischargeMapper } from "@/services/fhir-service/mappers/PatientDischargeMapper";
import { PatientHospitalizationMapper } from "@/services/fhir-service/mappers/PatientHospitalizationMapper";
import { PatientMapper } from "@/services/fhir-service/mappers/PatientMapper";
import { PatientMedicationMapper } from "@/services/fhir-service/mappers/PatientMedicationMapper";
import { logger } from "@/services/logging/logger";

export async function safeFetch<T>(
  fn: () => Promise<T>,
  resourceType: T
): Promise<T | null> {

  try {
    const result = await retry(fn, { retries: FHIR_CONFIG.RETRY, delay: FHIR_CONFIG.RETRY_DELAY });
    return result; // normal success
  } catch (err: any) {

    // Check if FHIR OperationOutcome exists
    const outcome = err.data as Fhir.OperationOutcome | undefined;
    if (outcome?.resourceType === "OperationOutcome") {

      logger.debug("Error Response : ",
        JSON.stringify({
          resourceType: outcome.resourceType,
          status: err.status,
          code: outcome.issue?.[0].code,
          severity: outcome.issue?.[0].severity,
          diagnostics: outcome.issue?.[0].diagnostics?.split(' - Server ')[0]
        }));

      // Hard failure if any issue has severity 'fatal'
      const hasFatal = outcome.issue?.some(i => ["fatal"].includes(i.severity ?? ""));
      if (hasFatal) {
        err.isHardFailure = true; // Mark as hard failure for retry logic
        return null; // immediately fail
      }

      return outcome as T; // allow mapping for warnings/info
    }

    // Fallback for network or HTTP errors
    const status = err.status;
    if (status) {
      logger.debug(`[FHIR][${resourceType}] HTTP ${status} - ${err.message}`);
    } else {
      logger.debug(`[FHIR][${resourceType}] Network/Unknown error - ${err.message}`);
    }

    return null;
  }
}


async function fetchAndMap<T, U>(
  apiCall: () => Promise<T>,
  mapper: (fhir: T) => U
): Promise<U | null> {
  const response = await safeFetch(apiCall, {} as T);

  if (!response) {
    logger.debug("FHIR fetch failed !! ");
    return null; // fallback handled here
  }

  return mapper(response);
}

// ----------------------------------------------------------------------------------------------------------------

const api = createApiService({
  baseURL: FHIR_CONFIG.BASE_URL,
  timeout: FHIR_CONFIG.TIMEOUT,
});

export const FhirService = {
  // Maps FHIR Patient to DB Patient
  getPatient: async (patientFhirId: string): Promise<Partial<DbPatient> | null> => {
    return fetchAndMap(
      () => api.get(`/Patient/${patientFhirId}?_format=json`) as Promise<Fhir.Patient>,
      PatientMapper.toDb
    );
  },

  // All resource records for FHIR Patient
  getEverything: async (patientFhirId: string): Promise<Fhir.Bundle | null> => {
    return fetchAndMap(
      () => api.get(`/Patient/${patientFhirId}/$everything?_format=json`) as Promise<Fhir.Bundle>,
      (x) => x
    );
  },

  getPatientConditions: async (patientFhirId: string, dbPatientId: number): Promise<Partial<PatientCondition>[] | null> => {
    return fetchAndMap(
      async () => {
        const bundle = await api.get(`/Condition?patient=${patientFhirId}&_format=json`) as unknown as Promise<Fhir.Bundle<Fhir.Condition>>;
        const conditionResources = (await bundle).entry?.map(e => e.resource).filter(
          (r): r is Fhir.Condition => r?.resourceType === "Condition"
        ) ?? [];
        return conditionResources;
      },
      (fhirConditions) => fhirConditions.map((fhirCondition) => PatientConditionMapper.toDb(fhirCondition, dbPatientId))
    );
  },

  getPatientAllergies: async (patientFhirId: string, dbPatientId: number): Promise<Partial<PatientAllergy>[] | null> => {
    return fetchAndMap(
      async () => {
        const bundle = await api.get(`/AllergyIntolerance?patient=${patientFhirId}&_format=json`) as unknown as Promise<Fhir.Bundle<Fhir.AllergyIntolerance>>;
        const allergyResources = (await bundle).entry?.map(e => e.resource).filter(
          (r): r is Fhir.AllergyIntolerance => r?.resourceType === "AllergyIntolerance"
        ) ?? [];
        return allergyResources;
      },
      (fhirAllergies) => fhirAllergies.map((fhirAllergy) => PatientAllergyMapper.toDb(fhirAllergy, dbPatientId))
    );
  },

  getPatientMedications: async (patientFhirId: string, dbPatientId: number): Promise<Partial<PatientMedication>[] | null> => {
    return fetchAndMap(
      async () => {
        const bundle = await api.get(`/MedicationStatement?patient=${patientFhirId}&_format=json`) as unknown as Promise<Fhir.Bundle<Fhir.MedicationStatement>>;
        const medicationResources = (await bundle).entry?.map(e => e.resource).filter(
          (r): r is Fhir.MedicationStatement => r?.resourceType === "MedicationStatement"
        ) ?? [];
        return medicationResources;
      },
      (fhirMedications) => fhirMedications.map((fhirMedication) => PatientMedicationMapper.toDb(fhirMedication, dbPatientId))
    );
  },

  getPatientHospitalizations: async (patientFhirId: string, dbPatientId: number): Promise<Partial<Hospitalization>[] | null> => {
    return fetchAndMap(
      async () => {
        const bundle = await api.get(`/Encounter?patient=${patientFhirId}&_format=json`) as unknown as Promise<Fhir.Bundle<Fhir.Encounter>>;
        const hospitalizationResources = (await bundle).entry?.map(e => e.resource).filter(
          (r): r is Fhir.Encounter => r?.resourceType === "Encounter"
        ) ?? [];
        return hospitalizationResources;
      },
      (fhirHospitalizations) => fhirHospitalizations.map((fhirHospitalization) => PatientHospitalizationMapper.toDb(fhirHospitalization, dbPatientId))
    );
  },

  getPatientDischargeInstructions: async (patientFhirId: string, dbPatientId: number): Promise<Partial<DischargeInstruction>[] | null> => {
    return fetchAndMap(
      async () => {
        const bundle = await api.get(`/ClinicalImpression?patient=${patientFhirId}&_format=json`) as unknown as Promise<Fhir.Bundle<Fhir.ClinicalImpression>>;
        const dischargeInstructionResources = (await bundle).entry?.map(e => e.resource).filter(
          (r): r is Fhir.ClinicalImpression => r?.resourceType === "ClinicalImpression"
        ) ?? [];
        return dischargeInstructionResources;
      },
      (fhirDischargeInstructions) => fhirDischargeInstructions.map((fhirDischargeInstruction) => PatientDischargeMapper.toDb(fhirDischargeInstruction, dbPatientId))
    );
  },

};