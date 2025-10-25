import { BaseModel } from '@/services/database/BaseModel';
import { SyncPatientData, tables } from '@/services/database/migrations/v1/schema_v1';

export class SyncPatientDataModel extends BaseModel<SyncPatientData> {
    constructor() {
        super(tables.SYNC_PATIENT_DATA);
    }
}