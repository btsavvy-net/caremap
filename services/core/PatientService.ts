import { getCurrentTimestamp } from '@/services/core/utils';
import { useModel } from '@/services/database/BaseModel';
import { Patient } from '@/services/database/migrations/v1/schema_v1';
import { PatientModel } from '@/services/database/models/PatientModel';
import { logger } from '@/services/logging/logger';

// Single shared instance of model
const patientModel = new PatientModel();

export const isExistingPatientById = async (id: number): Promise<boolean> => {
    const existingPatient = await getPatient(id);
    return !!existingPatient;
}

export const isExistingPatientByUserId = async (userId: string): Promise<boolean> => {
    const existingPatient = await getPatientByUserId(userId);
    return !!existingPatient;
}

export const createPatient = async (patient: Partial<Patient>): Promise<Patient | null> => {
    return useModel(patientModel, async (model) => {
        if (!patient.user_id) {
            logger.debug("Cannot create patient: Missing user_id");
            return null;
        }

        // Check if patient already exists first
        const existingPatient = await getPatientByUserId(patient.user_id);
        if (existingPatient) {
            logger.debug("Patient already exists for user: ", patient.user_id);
            return existingPatient;
        }

        if (!patient.first_name || !patient.last_name) {
            logger.debug("Cannot create patient: First name and last name are required");
            return null;
        }

        const now = getCurrentTimestamp();
        const newPatient = {
            ...patient,
            created_date: now,
            updated_date: now
        };

        const created = await model.insert(newPatient);
        logger.debugTrunc("Patient created: ", created);

        // If we got a raw SQLite result instead of a patient object, fetch the patient
        if (created && !created.id && created.lastInsertRowId) {
            return getPatient(created.lastInsertRowId);
        }

        return created;
    });
}

export const getPatient = async (id: number): Promise<Patient | null> => {
    return useModel(patientModel, async (model) => {
        const result = await model.getFirstByFields({ id });
        logger.debugTrunc("DB Patient data: ", result);
        return result;
    });
}

export const getPatientByUserId = async (userId: string): Promise<Patient | null> => {
    return useModel(patientModel, async (model) => {
        const result = await model.getFirstByFields({ user_id: userId });
        logger.debugTrunc("DB Patient data by user ID: ", result);
        return result;
    });
}

export const getPatientByFhirId = async (fhirId: string): Promise<Patient | null> => {
    return useModel(patientModel, async (model) => {
        const result = await model.getFirstByFields({ fhir_id: fhirId });
        logger.debugTrunc("DB Patient data by user ID: ", result);
        return result;
    });
}

export const updatePatient = async (patientUpdate: Partial<Patient>, whereMap: Partial<Patient>): Promise<Patient | null> => {
    return useModel(patientModel, async (model) => {
        const existingPatient = await model.getFirstByFields(whereMap);
        if (!existingPatient) {
            logger.debug("Patient not found for update: ", whereMap);
            return null;
        }

        const updateData = {
            ...patientUpdate,
            updated_date: getCurrentTimestamp()
        };
        const updatedPatient = await model.updateByFields(updateData, whereMap);
        logger.debugTrunc("Updated Patient: ", updatedPatient);
        return updatedPatient;
    });
}

export const deletePatient = async (id: number): Promise<boolean> => {
    return useModel(patientModel, async (model) => {
        if (!(await isExistingPatientById(id))) {
            logger.debug("Patient not found for deletion: ", id);
            return false;
        }

        await model.deleteByFields({ id });
        logger.debug("Deleted Patient: ", id);
        return true;
    });
}

export const deletePatientByFhirId = async (fhirId: string): Promise<boolean> => {
    return useModel(patientModel, async (model) => {
        if (!(await getPatientByFhirId(fhirId))) {
            logger.debug("Patient not found for deletion: ", fhirId);
            return false;
        }

        await model.deleteByFields({ fhir_id: fhirId });
        logger.debug("Deleted Patient: ", fhirId);
        return true;
    });
}


export const getAllPatients = async (): Promise<Patient[]> => {
    return useModel(patientModel, async (model) => {
        return model.getAll();
    });
}

