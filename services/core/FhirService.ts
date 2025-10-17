import { createApiService, retry } from "@/services/api/ApiService";
import { Patient as DbPatient } from '@/services/database/migrations/v1/schema_v1';
import { Fhir } from "@/services/fhir-service/Fhir";
import { FHIR_CONFIG } from "@/services/fhir-service/fhir-config";
import { PatientMapper } from "@/services/fhir-service/mappers/PatientMapper";
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

      // Hard failure if any issue has severity 'error' or 'fatal'
      const hasFatal = outcome.issue?.some(i => ["error", "fatal"].includes(i.severity ?? ""));
      if (hasFatal) return null;

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
    logger.debug("FHIR fetch failed after retries for", mapper.name);
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
  getPatient: async (patientId: string): Promise<Partial<DbPatient> | null> => {
    return fetchAndMap(
      () => api.get(`/Patient/${patientId}?_format=json`) as Promise<Fhir.Patient>,
      PatientMapper.toDb
    );
  },

  // All resource records for FHIR Patient
  getEverything: async (patientId: string): Promise<Fhir.Bundle | null> => {
    return fetchAndMap(
      () => api.get(`/Patient/${patientId}/$everything?_format=json`) as Promise<Fhir.Bundle>,
      (x) => x
    );
  },
};