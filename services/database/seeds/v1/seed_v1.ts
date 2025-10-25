import { tables } from "@/services/database/migrations/v1/schema_v1";
import {
  sampleContacts,
  samplePatientEmergencyCare,
  samplePatientEquipment,
  samplePatientNotes,
  samplePatientSnapshots
} from "@/services/database/seeds/v1/sample_data";
import { logger } from "@/services/logging/logger";
import { SQLiteDatabase } from "expo-sqlite";

// To escape single quotes in SQL strings to prevent SQL injection
const escapeSQL = (str: string | undefined) => (str || "").replace(/'/g, "''");

export async function seedDatabase(db: SQLiteDatabase) {
  try {
    // Insert patient snapshots
    for (const snapshot of samplePatientSnapshots) {
      if (!snapshot.patient_id) continue;
      await db.execAsync(
        `INSERT INTO ${tables.PATIENT_SNAPSHOT} (
                    patient_id, 
                    patient_overview, 
                    health_issues,
                    created_date,
                    updated_date
                ) VALUES (
                    ${snapshot.patient_id},
                    '${escapeSQL(snapshot.patient_overview)}',
                    '${escapeSQL(snapshot.health_issues)}',
                    '${snapshot.created_date?.toISOString() ||
        new Date().toISOString()
        }',
                    '${snapshot.updated_date?.toISOString() ||
        new Date().toISOString()
        }'
                )`
      );
    }

    // Insert patient equipment
    for (const equipment of samplePatientEquipment) {
      if (!equipment.patient_id || !equipment.equipment_name) continue;
      await db.execAsync(
        `INSERT INTO ${tables.PATIENT_EQUIPMENT} (
                    patient_id,
                    equipment_name,
                    equipment_description,
                    linked_health_system,
                    created_date,
                    updated_date
                ) VALUES (
                    ${equipment.patient_id},
                    '${escapeSQL(equipment.equipment_name)}',
                    '${escapeSQL(equipment.equipment_description)}',
                    ${equipment.linked_health_system ? 1 : 0},
                    '${equipment.created_date?.toISOString() ||
        new Date().toISOString()
        }',
                    '${equipment.updated_date?.toISOString() ||
        new Date().toISOString()
        }'
                )`
      );
    }

    // Insert patient emergency care
    for (const emergency of samplePatientEmergencyCare) {
      if (!emergency.patient_id || !emergency.topic) continue;
      await db.execAsync(
        `INSERT INTO ${tables.PATIENT_EMERGENCY_CARE} (
                    patient_id,
                    topic,
                    details,
                    linked_health_system,
                    created_date,
                    updated_date
                ) VALUES (
                    ${emergency.patient_id},
                    '${escapeSQL(emergency.topic)}',
                    '${escapeSQL(emergency.details)}',
                    ${emergency.linked_health_system ? 1 : 0},
                    '${emergency.created_date?.toISOString() ||
        new Date().toISOString()
        }',
                    '${emergency.updated_date?.toISOString() ||
        new Date().toISOString()
        }'
                )`
      );
    }

    for (const note of samplePatientNotes) {
      if (!note.patient_id || !note.topic) continue;
      await db.execAsync(
        `INSERT INTO ${tables.PATIENT_NOTE} (
                    patient_id,
                    topic,
                    details,
                    reminder_date,
                    created_date,
                    updated_date
                ) VALUES (
                    ${note.patient_id},
                    '${escapeSQL(note.topic)}',
                    '${escapeSQL(note.details || "")}',
                    '${note.reminder_date
          ? note.reminder_date.toISOString()
          : new Date().toISOString()
        }',
                    '${note.created_date
          ? note.created_date.toISOString()
          : new Date().toISOString()
        }',
                    '${note.updated_date
          ? note.updated_date.toISOString()
          : new Date().toISOString()
        }'
                )`
      );
    }

    // Insert contacts
    for (const contact of sampleContacts) {
      if (!contact.patient_id || !contact.first_name || !contact.phone_number)
        continue;
      await db.execAsync(
        `INSERT INTO ${tables.CONTACT} (
                    patient_id,
                    first_name,
                    last_name,
                    relationship,
                    phone_number,
                    description,
                    email,
                    created_date,
                    updated_date
                ) VALUES (
                    ${contact.patient_id},
                    '${escapeSQL(contact.first_name)}',
                    '${escapeSQL(contact.last_name)}',
                    '${escapeSQL(contact.relationship)}',
                    '${escapeSQL(contact.phone_number)}',
                    '${escapeSQL(contact.description || "")}',
                    '${escapeSQL(contact.email || "")}',
                    '${contact.created_date
          ? contact.created_date.toISOString()
          : new Date().toISOString()
        }',
                    '${contact.updated_date
          ? contact.updated_date.toISOString()
          : new Date().toISOString()
        }'
                )`
      );
    }

    logger.debug("Sample data seeded successfully.");
  } catch (error) {
    logger.debug("Error seeding data:", error);
  }
}
