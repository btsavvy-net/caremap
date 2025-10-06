import { BaseModel } from '@/services/database/BaseModel';
import { tables, TrackConfigVersion } from '@/services/database/migrations/v1/schema_v1';

export class TrackConfigVersionModel extends BaseModel<TrackConfigVersion> {
    constructor() {
        super(tables.TRACK_CONFIG_VERSION);
    }
}