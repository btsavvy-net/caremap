import { QuestionCondition, TrackingFrequency } from '@/constants/trackTypes';
import { QuestionWithOptions, TrackCategoryWithItems, TrackCategoryWithSelectableItems, TrackItemWithProgress } from '@/services/common/types';
import { getCurrentTimestamp } from '@/services/core/utils';
import { useModel } from '@/services/database/BaseModel';
import { Question, tables } from '@/services/database/migrations/v1/schema_v1';
import { PatientModel } from '@/services/database/models/PatientModel';
import { QuestionModel } from '@/services/database/models/QuestionModel';
import { ResponseOptionModel } from '@/services/database/models/ResponseOptionModel';
import { TrackCategoryModel } from '@/services/database/models/TrackCategoryModel';
import { TrackItemEntryModel } from '@/services/database/models/TrackItemEntryModel';
import { TrackItemModel } from '@/services/database/models/TrackItemModel';
import { TrackResponseModel } from '@/services/database/models/TrackResponseModel';
import { logger } from '@/services/logging/logger';

// Single shared instance of models
const trackCategoryModel = new TrackCategoryModel();
const trackItemModel = new TrackItemModel();
const questionModel = new QuestionModel();
const responseOptionModel = new ResponseOptionModel();
const trackResponseModel = new TrackResponseModel();
const trackItemEntryModel = new TrackItemEntryModel();
const patientModel = new PatientModel();

const now = getCurrentTimestamp();

// Date helpers (expects and returns MM-DD-YYYY as used in screens today)
function parseMMDDYYYY(dateStr: string): Date {
    if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return new Date(dateStr);
    const [mm, dd, yyyy] = dateStr.split('-').map((x) => parseInt(x, 10));
    return new Date(yyyy, (mm || 1) - 1, dd || 1);
}

function formatMMDDYYYY(d: Date): string {
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${mm}-${dd}-${yyyy}`;
}

function getMonday(d: Date): Date {
    const date = new Date(d);
    const day = date.getDay(); // 0 Sun, 1 Mon, ...
    const diff = (day === 0 ? -6 : 1 - day); // move to Monday
    date.setDate(date.getDate() + diff);
    return date;
}

export function normalizeDateByFrequency(dateStr: string, frequency: TrackingFrequency): string {
    const date = parseMMDDYYYY(dateStr);
    if (frequency === TrackingFrequency.DAILY) return formatMMDDYYYY(date);
    if (frequency === TrackingFrequency.WEEKLY) return formatMMDDYYYY(getMonday(date));
    // monthly
    const first = new Date(date.getFullYear(), date.getMonth(), 1);
    return formatMMDDYYYY(first);
}

function shouldCreateEntryForDate(dateStr: string, frequency: TrackingFrequency): boolean {
    const d = parseMMDDYYYY(dateStr);
    if (frequency === TrackingFrequency.DAILY) return true;
    if (frequency === TrackingFrequency.WEEKLY) {
        return d.getDay() === 1; // Monday
    }
    return d.getDate() === 1; // Monthly -> 1st
}

// Create entry for the selected date only for items the patient has "subscribed" to
// A patient is considered subscribed to an item if there exists any ACTIVE entry for that item
async function ensureSubscribedEntries(patientId: number, date: string): Promise<void> {
    // Get all active items the patient is subscribed to (has any active entry)
    const subscribedItems = await useModel(trackItemModel, async (itemModel: any) => {
        const rows = await itemModel.runQuery(`
            SELECT DISTINCT ti.id, ti.frequency
            FROM ${tables.TRACK_ITEM} ti
            INNER JOIN ${tables.TRACK_CATEGORY} tc ON tc.id = ti.category_id
            INNER JOIN ${tables.TRACK_ITEM_ENTRY} tie ON tie.track_item_id = ti.id
            WHERE tc.status = 'active'
              AND ti.status = 'active'
              AND tie.patient_id = ?
              AND tie.selected = 1
        `, [patientId]);
        return rows as { id: number; frequency: TrackingFrequency }[];
    });

    if (!subscribedItems.length) return;

    // Fetch user_id to create entries
    const patient = await useModel(patientModel, async (pm) => pm.getFirstByFields({ id: patientId }));
    if (!patient) return;

    for (const item of subscribedItems) {
        if (!shouldCreateEntryForDate(date, item.frequency)) continue;
        const normalizedDate = normalizeDateByFrequency(date, item.frequency);
        await useModel(trackItemEntryModel, async (model) => {
            const existing = await model.getFirstByFields({
                track_item_id: item.id,
                patient_id: patientId,
                date: normalizedDate,
            });
            if (!existing) {
                await model.insert({
                    user_id: (patient as any).user_id,
                    patient_id: patientId,
                    track_item_id: item.id,
                    date: normalizedDate,
                    selected: 1,
                    created_date: now,
                    updated_date: now,
                });
            } else if ((existing as any).selected !== 1) {
                // Reactivate if present but inactive
                await model.updateByFields(
                    {
                        selected: 1,
                        updated_date: now
                    },
                    { id: (existing as any).id }
                );
            }
        });
    }
}

export const getTrackCategoriesWithItemsAndProgress = async (
    patientId: number,
    date: string
): Promise<TrackCategoryWithItems[]> => {
    logger.debug('getTrackCategoriesWithItemsAndProgress called', { patientId, date });

    // Lazily ensure entries only for the selected date, for subscribed items
    try { await ensureSubscribedEntries(patientId, date); } catch (e) { logger.debug('ensureSubscribedEntries error', e as any); }

    const categories = await useModel(trackCategoryModel, async (categoryModel) => {
        // Only active categories
        const cats = await categoryModel.getByFields({ status: 'active' } as any);

        const items = await useModel(trackItemModel, async (itemModel: any) => {
            const rows = await itemModel.runQuery(`
        SELECT
          ti.id                     AS item_id,
          tie.id                    AS entry_id,
          ti.name,
          ti.code,
          ti.frequency,
          ti.status,
          ti.category_id,
          ti.created_date,
          ti.updated_date,
          COUNT(DISTINCT r.question_id) AS completed,
          COUNT(DISTINCT q.id)          AS total,
          tie.selected                  AS is_selected
        FROM ${tables.TRACK_ITEM} ti
        INNER JOIN ${tables.TRACK_CATEGORY} tc
          ON tc.id = ti.category_id AND tc.status = 'active'
        -- Only include items that have active questions
        INNER JOIN ${tables.QUESTION} q_check
          ON q_check.item_id = ti.id AND q_check.status = 'active'
        LEFT JOIN ${tables.TRACK_ITEM_ENTRY} tie
          ON tie.track_item_id = ti.id
         AND tie.patient_id = ?
         AND tie.date = ?
        LEFT JOIN ${tables.QUESTION} q
          ON q.item_id = ti.id AND q.status = 'active'
        LEFT JOIN ${tables.TRACK_RESPONSE} r
          ON r.track_item_entry_id = tie.id
          AND tie.date = ?
        WHERE ti.status = 'active'
          AND (
            (tie.selected = 1)
            OR (
              tie.id IS NOT NULL 
              AND EXISTS (
                SELECT 1 
                FROM ${tables.TRACK_RESPONSE} r2
                INNER JOIN ${tables.TRACK_ITEM_ENTRY} tie2
                  ON tie2.id = r2.track_item_entry_id
                  AND tie2.date = ? 
                WHERE r2.track_item_entry_id = tie.id
              )
            )
          )
        GROUP BY tie.id, ti.id, ti.name, ti.code, ti.frequency, ti.status, ti.category_id, ti.created_date, ti.updated_date, tie.selected
      `, [patientId, date, date, date]);
            return rows as any[];
        });

        // Build categories with items + summaries inline
        const result: TrackCategoryWithItems[] = [];

        for (const cat of cats) {
            const catItems: TrackItemWithProgress[] = [];

            for (const row of items.filter((r: any) => r.category_id === cat.id)) {
                const summaries = row.entry_id ? await getSummariesForItem(row.entry_id) : [];
                catItems.push({
                    item: {
                        id: row.item_id,
                        category_id: row.category_id,
                        code: row.code,
                        name: row.name,
                        frequency: row.frequency,
                        status: row.status,
                        created_date: row.created_date,
                        updated_date: row.updated_date,
                    },
                    entry_id: row.entry_id,
                    completed: row.completed,
                    total: row.total,
                    summaries,
                });
            }

            result.push({ ...cat, items: catItems });
        }

        return result;
    });

    logger.debug(
        'getTrackCategoriesWithItemsAndProgress completed',
        JSON.stringify(categories, null, 2)
    );
    return categories;
};

export const getAllCategoriesWithSelectableItems = async (
    patientId: number,
    date: string
): Promise<TrackCategoryWithSelectableItems[]> => {
    logger.debug('getAllCategoriesWithSelectableItems called', { patientId, date });

    return useModel(trackCategoryModel, async (categoryModel) => {
        // Get all ACTIVE categories
        const categories = await categoryModel.getByFields({ status: 'active' } as any);

        // Get all ACTIVE items with a flag if already linked for this patient (ignore date)
        const items = await useModel(trackItemModel, async (itemModel: any) => {
            const result = await itemModel.runQuery(`
                SELECT 
                    ti.id,
                    ti.name,
                    ti.code,
                    ti.frequency,
                    ti.status,
                    ti.created_date,
                    ti.updated_date,
                    ti.category_id,
                    CASE WHEN EXISTS (
                        SELECT 1 FROM ${tables.TRACK_ITEM_ENTRY} tie2
                        WHERE tie2.track_item_id = ti.id
                          AND tie2.patient_id = ?
                          AND tie2.selected = 1
                    ) THEN 1 ELSE 0 END AS selected
                FROM ${tables.TRACK_ITEM} ti
                INNER JOIN ${tables.TRACK_CATEGORY} tc ON tc.id = ti.category_id AND tc.status = 'active'
                WHERE ti.status = 'active'
            `, [patientId]);
            return result as { id: number; name: string; code: string; frequency: string; status: string; created_date: string; updated_date: string; category_id: number; selected: number }[];
        });

        // Group items under categories with "selected" mapped to boolean
        const result: TrackCategoryWithSelectableItems[] = categories.map((cat: any) => ({
            category: cat,
            items: items
                .filter((item) => item.category_id === cat.id)
                .map((item) => ({
                    item: {
                        id: item.id,
                        category_id: item.category_id,
                        code: item.code,
                        name: item.name,
                        frequency: item.frequency as any,
                        status: item.status as any,
                        created_date: item.created_date as any,
                        updated_date: item.updated_date as any,
                    },
                    selected: item.selected === 1
                }))
        }));

        logger.debug('getAllCategoriesWithSelectableItems completed', JSON.stringify(result, null, 2));
        return result;
    });
};

export const getQuestionsWithOptions = async (
    itemId: number,
    entryId: number
): Promise<QuestionWithOptions[]> => {
    logger.debug('getQuestionsWithOptions called', { itemId });

    const result = await useModel(questionModel, async (model) => {
        const questions = await model.getByFields({ item_id: itemId });

        const allOptions = await useModel(responseOptionModel, async (optModel: any) => {
            const result = await optModel.getAll();
            return result as any[];
        });

        // Get existing responses for the given entryId
        const existingResponses = await useModel(trackResponseModel, async (respModel: any) => {
            return await respModel.getByFields({ track_item_entry_id: entryId });
        });

        // Map responses by question_id for fast lookup
        const responseMap = new Map<number, any>();
        for (const resp of existingResponses) {
            responseMap.set(resp.question_id, resp);
        }

        return questions.map((q: any) => ({
            question: {
                ...q,
                parent_question_id: q.parent_question_id ?? null,
                display_condition: q.display_condition ?? null,
            },
            options: allOptions.filter((opt: any) => opt.question_id === q.id),
            existingResponse: responseMap.get(q.id) ?? undefined
        }));

    });

    logger.debug('getQuestionsWithOptions completed', { itemId, entryId }, `${JSON.stringify(result)}`);
    return result;
};

export const saveResponse = async (
    entryId: number,
    questionId: number,
    answer: string,
    userId: string,
    patientId: number
): Promise<void> => {
    logger.debug('saveResponse called', { entryId, questionId, answer });

    const result = await useModel(trackResponseModel, async (model) => {
        const existing = await model.getFirstByFields({
            track_item_entry_id: entryId,
            question_id: questionId,
            user_id: userId,
            patient_id: patientId
        });

        if (existing) {
            await model.updateByFields(
                {
                    answer: JSON.stringify(answer),
                    updated_date: getCurrentTimestamp(),
                },
                {
                    track_item_entry_id: entryId,
                    question_id: questionId,
                    user_id: userId,
                    patient_id: patientId
                }
            );
        } else {
            await model.insert({
                user_id: userId,
                patient_id: patientId,
                question_id: questionId,
                track_item_entry_id: entryId,
                answer: JSON.stringify(answer),
                created_date: getCurrentTimestamp(),
                updated_date: getCurrentTimestamp(),
            });
        }
    });

    logger.debug('saveResponse completed', { entryId, questionId, answer });
    return result;
};

export const addOptionToQuestion = async (
    questionId: number,
    label: string
): Promise<number> => {
    logger.debug('addOptionToQuestion called', { questionId, label });

    const result = await useModel(responseOptionModel, async (model) => {
        const insertResult = await model.insert({
            question_id: questionId,
            text: label,
            created_date: getCurrentTimestamp(),
            updated_date: getCurrentTimestamp(),
        });
        return insertResult.lastInsertRowId;
    });

    logger.debug('addOptionToQuestion completed', { questionId, label, result });
    return result;
};

// Link item to patient/date
export const addTrackItemOnDate = async (
    itemId: number,
    userId: string,
    patientId: number,
    date: string
): Promise<void> => {
    logger.debug('linkItemToPatientDate called', { itemId, patientId, date });

    // Determine item frequency and normalize date accordingly
    const item = await useModel(trackItemModel, async (model) => model.getFirstByFields({ id: itemId }));
    const frequency = item?.frequency || TrackingFrequency.DAILY;
    const normalizedDate = normalizeDateByFrequency(date, frequency);

    await useModel(trackItemEntryModel, async (model) => {
        const existing = await model.getFirstByFields({
            track_item_id: itemId,
            patient_id: patientId,
            date: normalizedDate
        });

        if (existing) {
            // Reactivate if previously inactive
            await model.updateByFields(
                {
                    selected: 1,
                    updated_date: now
                },
                { id: (existing as any).id }
            );
            logger.debug('linkItemToPatientDate: Item reactivated', { itemId, patientId, date: normalizedDate });
            return;
        }

        await model.insert({
            user_id: userId,
            patient_id: patientId,
            track_item_id: itemId,
            date: normalizedDate,
            selected: 1,
            created_date: now,
            updated_date: now,
        });
    });

    logger.debug('linkItemToPatientDate completed', { itemId, patientId, date: normalizedDate });
};

// Unlink item from patient/date
export const removeTrackItemFromDate = async (
    itemId: number,
    userId: string,
    patientId: number,
    date: string
): Promise<void> => {
    logger.debug('unlinkItemFromPatientDate called', { itemId, patientId, date });

    await useModel(trackItemEntryModel, async (model) => {
        // 1. Mark all entries as deselected for this item and patient
        await model.runQuery(`
            UPDATE ${tables.TRACK_ITEM_ENTRY}
            SET selected = 0, updated_date = ?
            WHERE track_item_id = ?
            AND patient_id = ?
        `, [now, itemId, patientId]);
    });

    logger.debug('unlinkItemFromPatientDate completed (deselected all future entries and past entries without responses)', { itemId, patientId });
};

export const generateSummary = (template: string, answer: string): string | null => {
    if (!template || !answer) return null;

    try {
        let parsed: any;
        try {
            parsed = JSON.parse(answer);
        } catch {
            parsed = answer;
        }

        if (Array.isArray(parsed)) {
            return template.replace('{{answer}}', parsed.join(', '));
        }
        logger.debug(`${template.replace('{{answer}}', String(parsed))}`);
        return template.replace('{{answer}}', String(parsed));
    } catch {
        return null;
    }
};

export const getSummariesForItem = async (entryId: number): Promise<string[]> => {
    return useModel(questionModel, async (qModel) => {
        const rows = await qModel.runQuery(
            `
      SELECT q.summary_template, r.answer
      FROM ${tables.QUESTION} q
      LEFT JOIN ${tables.TRACK_RESPONSE} r
        ON q.id = r.question_id AND r.track_item_entry_id = ?
      WHERE q.item_id = (SELECT item_id FROM ${tables.TRACK_ITEM_ENTRY} WHERE id = ?)
      `,
            [entryId, entryId]
        );

        return rows
            .map((row: { summary_template: string; answer: string; }) =>
                row.summary_template && row.answer
                    ? generateSummary(row.summary_template, row.answer)
                    : null
            )
            .filter((s: any): s is string => !!s);
    });
};

/**
 * ------------------------------------------------------------------------------------------------------------
 * NOTE: Conditional logic previously used value-based checks, e.g., {"equals": "yes"}.
 * Now updated to use option codes instead, e.g., {"equals": "o_yes"} for MSQ/MCQ types.
 * Service layer update is pending and will be handled in a follow-up PR.
 * ------------------------------------------------------------------------------------------------------------
 */

// Utility to check if a question is visible given current answers
export const isQuestionVisible = (
    q: Question,
    answers: Record<number, any>
): boolean => {
    if (!q.parent_question_id || !q.display_condition) return true;

    try {
        const cond = JSON.parse(q.display_condition);
        const parentAnswer = answers[q.parent_question_id];
        let parsedParentAnswer;
        
        try {
            parsedParentAnswer = JSON.parse(parentAnswer);
        } catch {
            parsedParentAnswer = parentAnswer;
        }

        // Handle parent_answered condition using enum
        if (cond[QuestionCondition.PARENT_RES_EXISTS] === true) {
            return (
                parsedParentAnswer !== undefined &&
                parsedParentAnswer !== null &&
                parsedParentAnswer !== ""
            );
        }

        const numericAnswer = Number(parsedParentAnswer);

        // Operator checks using enum - now supporting option codes
        const operators: [QuestionCondition, (value: any) => boolean][] = [
            [QuestionCondition.EQ, (v) => Array.isArray(parsedParentAnswer) ? parsedParentAnswer.includes(v) : parsedParentAnswer === v],
            [QuestionCondition.NOT_EQ, (v) => Array.isArray(parsedParentAnswer) ? !parsedParentAnswer.includes(v) : parsedParentAnswer !== v],
            [QuestionCondition.GT, (v) => !isNaN(numericAnswer) && numericAnswer > Number(v)],
            [QuestionCondition.GTE, (v) => !isNaN(numericAnswer) && numericAnswer >= Number(v)],
            [QuestionCondition.LT, (v) => !isNaN(numericAnswer) && numericAnswer < Number(v)],
            [QuestionCondition.LTE, (v) => !isNaN(numericAnswer) && numericAnswer <= Number(v)],
            [
                QuestionCondition.IN,
                (v) => Array.isArray(v) && (Array.isArray(parsedParentAnswer) ? 
                    v.some(val => parsedParentAnswer.includes(val)) : 
                    v.includes(parsedParentAnswer)),
            ],
            [
                QuestionCondition.NOT_IN,
                (v) => Array.isArray(v) && (Array.isArray(parsedParentAnswer) ? 
                    !v.some(val => parsedParentAnswer.includes(val)) : 
                    !v.includes(parsedParentAnswer)),
            ],
        ];

        for (const [key, check] of operators) {
            if (cond[key] !== undefined) {
                return check(cond[key]);
            }
        }

        // No known condition matched → default visible
        return true;
    } catch (err) {
        console.warn("Invalid display_condition JSON:", q.display_condition, err);
        return true;
    }
};
