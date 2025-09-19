import * as v1 from '@/services/database/migrations/v1/migration_v1';
import * as seed_v1 from '@/services/database/seeds/v1/seed_v1';
import { syncTrackConfig } from '@/services/database/seeds/v1/track_data_sync';
import { logger } from "@/services/logging/logger";
import { SQLITE_DB_NAME } from "@/utils/config";
import { SQLiteDatabase } from "expo-sqlite";

export const DB_NAME = SQLITE_DB_NAME;
export const DB_VERSION = 1;

let _db: SQLiteDatabase | null = null;
let dbReadyResolver: ((db: SQLiteDatabase) => void) | null = null;

const dbReadyPromise = new Promise<SQLiteDatabase>((resolve) => {
    dbReadyResolver = resolve;
});

export const initializeDatabase = async (db: SQLiteDatabase): Promise<void> => {
    _db = db;
    dbReadyResolver?.(db);
    logger.debug(`DB Path: "${_db.databasePath}"`);
    await runMigrations(_db);
};

export const getDBinstance = async (): Promise<SQLiteDatabase> => {
    if (_db)
        return _db;
    return dbReadyPromise;
};


// Helper to get DB instance and run async function with it
export async function useDB<T>(fn: (db: SQLiteDatabase) => Promise<T>): Promise<T> {
    const db = await getDBinstance();
    return fn(db);
}

export const runMigrations = async (db: SQLiteDatabase): Promise<void> => {

    const result = await db.getAllAsync<{ user_version: number }>(
        `PRAGMA user_version;`
    );
    const currentVersion = result[0]?.user_version ?? 0;

    logger.debug("DB version: ", currentVersion);

    if (currentVersion < DB_VERSION) {
        await db.withTransactionAsync(async () => {
            if (currentVersion < 1) {
                await v1.up(db);
                await seed_v1.seedDatabase(db);
            }
            await db.execAsync(`PRAGMA user_version = ${DB_VERSION}`);
        });
    }

    await db.execAsync("PRAGMA foreign_keys = ON;");

    await syncTrackConfig();
};
