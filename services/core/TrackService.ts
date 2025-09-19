import { QuestionWithOptions, TrackCategoryWithItems, TrackCategoryWithSelectableItems, TrackItemWithProgress } from '@/services/common/types';
import { getCurrentTimestamp } from '@/services/core/utils';
import { useModel } from '@/services/database/BaseModel';
import { tables } from '@/services/database/migrations/v1/schema_v1';
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

const now = getCurrentTimestamp();


export const getTrackCategoriesWithItemsAndProgress = async (
    patientId: number,
    date: string
): Promise<TrackCategoryWithItems[]> => {
    logger.debug('getTrackCategoriesWithItemsAndProgress called', { patientId, date });

    const categories = await useModel(trackCategoryModel, async (categoryModel) => {
        const cats = await categoryModel.getAll();

        const items = await useModel(trackItemModel, async (itemModel: any) => {
            const rows = await itemModel.runQuery(`
        SELECT
          ti.id                     AS item_id,
          tie.id                    AS entry_id,
          ti.name,
          ti.category_id,
          ti.created_date,
          ti.updated_date,
          COUNT(DISTINCT r.question_id) AS completed,
          COUNT(DISTINCT q.id)          AS total
        FROM ${tables.TRACK_ITEM} ti
        INNER JOIN ${tables.TRACK_ITEM_ENTRY} tie
          ON tie.track_item_id = ti.id
         AND tie.patient_id = ?
         AND tie.date = ?
        LEFT JOIN ${tables.QUESTION} q
          ON q.item_id = ti.id
        LEFT JOIN ${tables.TRACK_RESPONSE} r
          ON r.track_item_entry_id = tie.id
        GROUP BY tie.id, ti.id, ti.name, ti.category_id, ti.created_date, ti.updated_date
      `, [patientId, date]);
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
                        name: row.name,
                        created_date: row.created_date,
                        updated_date: row.updated_date,
                        code: row.code,
                        frequency: row.frequency,
                        status: row.status
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
        // Get all categories
        const categories = await categoryModel.getAll();

        // Get all items with a flag if already linked for this patient/date
        const items = await useModel(trackItemModel, async (itemModel: any) => {
            const result = await itemModel.runQuery(`
                SELECT 
                    ti.id,
                    ti.name,
                    ti.category_id,
                    CASE WHEN tie.id IS NULL THEN 0 ELSE 1 END AS selected
                FROM ${tables.TRACK_ITEM} ti
                LEFT JOIN ${tables.TRACK_ITEM_ENTRY} tie
                    ON tie.track_item_id = ti.id
                    AND tie.patient_id = ?
                    AND tie.date = ?
            `, [patientId, date]);
            return result as { id: number; name: string; category_id: number; selected: number }[];
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
                        name: item.name,
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

    await useModel(trackItemEntryModel, async (model) => {
        const existing = await model.getFirstByFields({
            track_item_id: itemId,
            patient_id: patientId,
            date
        });

        if (existing) {
            logger.debug('linkItemToPatientDate: Item already linked', { itemId, patientId, date });
            return;
        }

        await model.insert({
            user_id: userId,
            patient_id: patientId,
            track_item_id: itemId,
            date,
            created_date: now,
            updated_date: now,
        });
    });

    logger.debug('linkItemToPatientDate completed', { itemId, patientId, date });
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
        const existing = await model.getFirstByFields({
            track_item_id: itemId,
            patient_id: patientId,
            date
        });

        if (!existing) {
            logger.debug('unlinkItemFromPatientDate: Item not linked', { itemId, patientId, date });
            return;
        }

        await model.deleteByFields({
            track_item_id: itemId,
            user_id: userId,
            patient_id: patientId,
            date
        });
    });

    logger.debug('unlinkItemFromPatientDate completed', { itemId, patientId, date });
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


// ------------------------------------------------------------------------------------------------------------
// NOTE: Conditional logic previously used value-based checks, e.g., {"equals": "yes"}.
// Now updated to use option codes instead, e.g., {"equals": "o_yes"} for MCQ/MSQ types.
// These changes will be included in Service layer update in a follow-up PR.
// ------------------------------------------------------------------------------------------------------------

export const shouldDisplayQuestion = (
    question: { parent_question_id?: number | null; display_condition?: string | null },
    answers: Record<number, any>
): boolean => {
    // If no parent, always show
    if (!question.parent_question_id) return true;

    // If no condition, assume show
    if (!question.display_condition) return true;

    try {
        const parentAnswer = answers[question.parent_question_id];
        if (parentAnswer === undefined) return false; // parent unanswered → hide

        const condition = JSON.parse(question.display_condition);

        switch (condition.operator) {
            case "equals":
                return parentAnswer === condition.value;

            case "not_equals":
                return parentAnswer !== condition.value;

            case "in":
                return Array.isArray(condition.value) && condition.value.includes(parentAnswer);

            case "not_in":
                return Array.isArray(condition.value) && !condition.value.includes(parentAnswer);

            case "gt":
                return Number(parentAnswer) > Number(condition.value);

            case "lt":
                return Number(parentAnswer) < Number(condition.value);

            case "gte":
                return Number(parentAnswer) >= Number(condition.value);

            case "lte":
                return Number(parentAnswer) <= Number(condition.value);

            default:
                return true; // unknown operator → fallback show
        }
    } catch (err) {
        console.warn("Invalid display_condition JSON:", question.display_condition, err);
        return true;
    }
};