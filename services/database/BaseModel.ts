import { useDB } from '@/services/database/db';
import { SQLiteBindParams, SQLiteDatabase } from 'expo-sqlite';

export abstract class BaseModel<T> {
    protected db!: SQLiteDatabase;
    protected tableName: string;

    constructor(tableName: string) {
        this.tableName = tableName;
    }

    setDB(db: SQLiteDatabase) {
        this.db = db;
    }

    // Simple ISO date string pattern matcher
    private isISODateString(value: any): boolean {
        if (typeof value !== 'string') return false;
        return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value);
    }

    // Automatically handle date conversions
    // toDatabase: true -> convert Date to ISO string (while inserting into the database)
    // toDatabase: false -> convert ISO string to Date (while retrieving from the database)
    private convertDates(data: any, toDatabase: boolean): any {
        if (!data) return data;

        if (data instanceof Date) {
            return toDatabase ? data.toISOString() : data;
        }

        if (typeof data !== 'object') {
            if (!toDatabase && this.isISODateString(data)) {
                return new Date(data);
            }
            return data;
        }

        const result: Record<string, any> = Array.isArray(data) ? [] : {};
        for (const key in data) {
            const value = data[key];
            if (value instanceof Date) {
                result[key] = toDatabase ? value.toISOString() : value;
            } else if (!toDatabase && this.isISODateString(value)) {
                result[key] = new Date(value);
            } else if (typeof value === 'object' && value !== null) {
                result[key] = this.convertDates(value, toDatabase);
            } else {
                result[key] = value;
            }
        }
        return result;
    }

    // Wrapper method to run any SQL query safely inside a transaction using prepared statements
    protected async run(sql: string, params: any[] = []) {
        let result: any;
        await this.db.withTransactionAsync(async () => {
            const stmt = await this.db.prepareAsync(sql);
            try {
                result = await stmt.executeAsync(...this.convertDates(params, true));
            }
            finally {
                await stmt.finalizeAsync();
            }
        });
        return result;
    }

    async getAll(): Promise<T[]> {
        const sql = `SELECT * FROM ${this.tableName};`;
        const result = await this.db.getAllAsync<T>(sql);
        return this.convertDates(result, false);
    }

    async getFirstByFields(fields: Partial<T>): Promise<T | null> {
        if (!this.db) throw new Error('DB instance not set in BaseModel');

        // Filter out undefined fields to prevent SQLite errors
        const entries = Object.entries(fields).filter(([_, value]) => value !== undefined);
        const keys = entries.map(([key]) => key);
        const values = entries.map(([_, value]) => value) as SQLiteBindParams;

        if (keys.length === 0) return null;

        const conditions = keys.map((key) => `${key} = ?`).join(' AND ');
        const sql = `SELECT * FROM ${this.tableName} WHERE ${conditions} LIMIT 1`;

        const result = await this.db.getFirstAsync<T>(sql, this.convertDates(values, true));
        return result ? this.convertDates(result, false) : null;
    }

    async getByFields(fields: Partial<T>): Promise<T[]> {
        const keys = Object.keys(fields);
        const values = Object.values(fields) as SQLiteBindParams;
        if (keys.length === 0) return [];
        const conditions = keys.map((key) => `${key} = ?`).join(' AND ');
        const sql = `SELECT * FROM ${this.tableName} WHERE ${conditions}`;
        const result = await this.db.getAllAsync<T>(sql, this.convertDates(values, true));
        return this.convertDates(result, false);
    }

    async insert(data: Partial<T>): Promise<any> {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const placeholders = keys.map(() => '?').join(',');

        const sql = `INSERT INTO ${this.tableName} (${keys.join(',')}) VALUES (${placeholders})`;
        let result = await this.run(sql, values);
        return result;
    }

    async insertAll(data: Partial<T>[]): Promise<any> {
        if (data.length === 0) return;

        const keys = Object.keys(data[0]);
        const placeholders = `(${keys.map(() => '?').join(',')})`;
        const allPlaceholders = data.map(() => placeholders).join(', ');
        const values = data.flatMap(row => keys.map(key => row[key as keyof T]));

        const sql = `INSERT INTO ${this.tableName} (${keys.join(',')}) VALUES ${allPlaceholders};`;
        let result = await this.run(sql, values);
        return result;
    }

    async updateByFields(
        data: Partial<T>,
        conditions: Partial<T>
    ): Promise<any> {
        const setKeys = Object.keys(data);
        const setValues = Object.values(data);
        const setClause = setKeys.map(key => `${key} = ?`).join(', ');

        const whereKeys = Object.keys(conditions);
        const whereValues = Object.values(conditions);
        const whereClause = whereKeys.map(key => `${key} = ?`).join(' AND ');

        if (!setKeys.length || !whereKeys.length) {
            throw new Error("Update failed: missing update fields or conditions.");
        }

        const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE ${whereClause}`;
        const values = [...setValues, ...whereValues];

        let result = await this.run(sql, values);
        return result;
    }

    async upsertByFields(
        data: Partial<T>,
        conditions: Partial<T>
    ): Promise<any> {
        const dataKeys = Object.keys(data);
        const dataValues = Object.values(data);

        const whereKeys = Object.keys(conditions);
        const whereValues = Object.values(conditions);

        if (!dataKeys.length || !whereKeys.length) {
            throw new Error("Upsert failed: missing fields or conditions.");
        }

        // First try update
        const setClause = dataKeys.map(key => `${key} = ?`).join(", ");
        const whereClause = whereKeys.map(key => `${key} = ?`).join(" AND ");
        const updateSql = `UPDATE ${this.tableName} SET ${setClause} WHERE ${whereClause}`;
        const updateValues = [...dataValues, ...whereValues];

        const result = await this.run(updateSql, updateValues);

        // If no rows affected → insert instead
        if (result.changes === 0) {
            const allKeys = [...dataKeys, ...whereKeys];
            const allValues = [...dataValues, ...whereValues];
            const placeholders = allKeys.map(() => "?").join(", ");

            const insertSql = `INSERT INTO ${this.tableName} (${allKeys.join(
                ", "
            )}) VALUES (${placeholders})`;

            return this.run(insertSql, allValues);
        }

        return result;
    }

    async deleteByFields(where: Partial<T>): Promise<void> {
        const keys = Object.keys(where);
        const values = Object.values(where);

        if (keys.length === 0) return;

        const whereClause = keys.map((key) => `${key} = ?`).join(' AND ');
        const sql = `DELETE FROM ${this.tableName} WHERE ${whereClause}`;

        await this.run(sql, values);
    }

    async runQuery<T = any>(sql: string, params: any[] = []): Promise<T[]> {
        const result = await this.db.getAllAsync<T>(sql, params);
        return result;
    }
}

// Helper function to lazily initialize a model with the DB instance.
export async function useModel<T>(model: any, fn: (model: any) => Promise<T>): Promise<T> {
    return useDB(async (db) => {
        model.setDB(db);
        return fn(model);
    });
}