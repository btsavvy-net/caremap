import { useModel } from "@/services/database/BaseModel";
import { Patient } from "@/services/database/migrations/v1/schema_v1";
import { SyncPatientDataModel } from "@/services/database/models/SyncPatientDataModel";
import { logger } from "@/services/logging/logger";
import { FHIR_SYNC_FREQ } from "@/utils/config";

export const shouldSync = async (patientFhirId: string): Promise<boolean> => {

    let lastSyncedAt: any;

    if (!FHIR_SYNC_FREQ) return false; // manual-only mode

    const syncPatientDataModel = new SyncPatientDataModel();
    useModel(syncPatientDataModel, async (model) => {
        lastSyncedAt = await model.getFirstByFields({ patient_fhir_id: patientFhirId }).then((data: { last_synced_at: any; }) => data?.last_synced_at);
    });

    if (!lastSyncedAt) return true; // never synced before

    const diffSec = (Date.now() - new Date(lastSyncedAt).getTime()) / 1000;
    return diffSec >= FHIR_SYNC_FREQ;
};

export const updateSyncStatus = async (
    patientFhirId: string,
    status: boolean
): Promise<void> => {
    const syncPatientDataModel = new SyncPatientDataModel();
    await useModel(syncPatientDataModel, async (model) => {
        const existing = await model.getFirstByFields({ patient_fhir_id: patientFhirId });
        if (existing) {
            await model.updateByFields({
                last_synced_at: new Date().toISOString(),
                status: status ? 1 : 0,
                updated_date: new Date().toISOString(),
            }, {
                id: existing.id,
            });
        } else {
            await model.insert({
                patient_fhir_id: patientFhirId,
                last_synced_at: new Date().toISOString(),
                status: status ? 1 : 0,
                created_date: new Date().toISOString(),
                updated_date: new Date().toISOString()
            });
        }
    });
};


export const startFhirSync = (patient: Patient) => {
    const scheduleSync = async () => {
        try {
            const should = await shouldSync(patient.fhir_id);
            if (should) {
                await handleBackgroundFhirSync(patient);
                await updateSyncStatus(patient.fhir_id, true);
            }
        } catch (err) {
            logger.debug("FHIR sync error:", err);
        } finally {
            // Schedule the next run
            setTimeout(scheduleSync, FHIR_SYNC_FREQ! * 1000);
        }
    };

    // Start the first sync
    scheduleSync();
};


export const handleBackgroundFhirSync = async (patient: Patient) => {
    if (!patient) {
        throw new Error("Patient not found");
    }
    logger.debug(`Syncing FHIR Data`);
};
