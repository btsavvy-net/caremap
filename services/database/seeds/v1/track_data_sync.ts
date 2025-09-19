import { NumericSubtype, QuestionType } from "@/constants/questionTypes";
import { Units } from "@/constants/units";
import predefinedConfig from "@/services/config/track-config.json";
import { shouldSync, updateStoredVersion } from "@/services/config/track-version-manager";
import { useModel } from "@/services/database/BaseModel";
import { QuestionModel } from "@/services/database/models/QuestionModel";
import { ResponseOptionModel } from "@/services/database/models/ResponseOptionModel";
import { TrackCategoryModel } from "@/services/database/models/TrackCategoryModel";
import { TrackItemModel } from "@/services/database/models/TrackItemModel";
import { logger } from "@/services/logging/logger";

// ---- Declare reusable models ----
const categoryModel = new TrackCategoryModel();
const itemModel = new TrackItemModel();
const questionModel = new QuestionModel();
const optionModel = new ResponseOptionModel();

// ---- Wrapper to simplify useModel usage ----
async function withModel<M, R>(model: M, fn: (m: M) => Promise<R>): Promise<R> {
    return useModel(model, fn);
}

// ---- Cascade & other helpers ----
async function cascadeDeactivateCategory(categoryCode: string) {
    const categoryId = await resolveCategoryId(categoryCode);
    if (!categoryId) return;

    // deactivate all items first
    await withModel(itemModel, async (im) => {
        const items = await im.getByFields({ category_id: categoryId });
        for (const item of items) {
            await cascadeDeactivateItem(item.code); // still use item.code here
        }
    });

    // finally deactivate category
    await withModel(categoryModel, async (cm) => {
        await cm.updateByFields({ status: "inactive" }, { id: categoryId });
        logger.debug(`Deactivated category: ${categoryCode}`);
    });
}


async function cascadeDeactivateItem(itemCode: string) {
    const itemId = await resolveItemId(itemCode);
    if (!itemId) return;

    // deactivate questions under item
    await withModel(questionModel, async (qm) => {
        const questions = await qm.getByFields({ item_id: itemId });
        for (const q of questions) {
            await cascadeDeactivateQuestion(q.code);
        }
    });

    // finally deactivate item
    await withModel(itemModel, async (im) => {
        await im.updateByFields({ status: "inactive" }, { id: itemId });
        logger.debug(`Deactivated item: ${itemCode}`);
    });
}


async function cascadeDeactivateQuestion(questionCode: string) {
    const questionId = await resolveQuestionId(questionCode);
    if (!questionId) return;

    // deactivate question
    await withModel(questionModel, async (qm) => {
        await qm.updateByFields({ status: "inactive" }, { id: questionId });
        logger.debug(`Deactivated question: ${questionCode}`);
    });

    // deactivate options
    await withModel(optionModel, async (om) => {
        await om.updateByFields({ status: "inactive" }, { question_id: questionId });
    });

    // deactivate child questions recursively
    await withModel(questionModel, async (qm) => {
        const children = await qm.getByFields({ parent_question_id: questionId });
        for (const child of children) {
            await cascadeDeactivateQuestion(child.code);
        }
    });
}


async function deactivateQuestionsWithInvalidDisplayConditions(validOptionCodes: string[]) {
    const allQuestions = await withModel(questionModel, (qm) => qm.getAll());

    for (const question of allQuestions) {
        if (!question.display_condition) continue;

        let parsedCondition: any;
        try {
            parsedCondition = typeof question.display_condition === "string"
                ? JSON.parse(question.display_condition)
                : question.display_condition;
        } catch (e) {
            logger.debug(`Skipping invalid display_condition on ${question.code}`);
            continue;
        }

        // Extract option codes from condition (flat object assumption)
        const referencedOptionCodes = Object.values(parsedCondition)
            .filter(v => typeof v === "string");

        const anyInvalid = referencedOptionCodes.some(code => !validOptionCodes.includes(code));

        if (anyInvalid) {
            logger.debug(`Deactivating ${question.code} — display_condition references removed option(s): ${referencedOptionCodes}`);
            await cascadeDeactivateQuestion(question.code);
        }
    }
}


async function cascadeDeactivateOption(optionCode: string) {
    // 1. Deactivate the option itself
    await withModel(optionModel, async (om) => {
        await om.updateByFields({ status: "inactive" }, { code: optionCode });
    });

    // 2. Find all questions with a display_condition that references this option
    const allQuestions = await withModel(questionModel, async (qm) =>
        qm.getByFields({}) // get all questions
    );

    const dependentQuestions = allQuestions.filter((q) => {
        if (!q.display_condition) return false;

        let parsed: any;

        try {
            parsed = typeof q.display_condition === 'string'
                ? JSON.parse(q.display_condition)
                : q.display_condition;
        } catch {
            // If it's malformed, skip
            return false;
        }

        // Now look for any value in the condition that matches the option code
        return Object.values(parsed).includes(optionCode);
    });

    for (const dq of dependentQuestions) {
        await cascadeDeactivateQuestion(dq.code);
        logger.debug(`Deactivated question ${dq.code} because it depended on removed option ${optionCode}`);
    }
}

// --- Helpers to resolve ids ---
async function resolveCategoryId(code: string): Promise<number | null> {
    return withModel(categoryModel, async (cm) => {
        const cat = await cm.getFirstByFields({ code });
        return cat ? cat.id : null;
    });
}

async function resolveItemId(code: string): Promise<number | null> {
    return withModel(itemModel, async (im) => {
        const item = await im.getFirstByFields({ code });
        return item ? item.id : null;
    });
}

async function resolveQuestionId(code: string): Promise<number | null> {
    return withModel(questionModel, async (qm) => {
        const q = await qm.getFirstByFields({ code });
        return q ? q.id : null;
    });
}


// ---- Upserts ----
async function upsertCategory(category: any) {
    await withModel(categoryModel, async (cm) => {
        await cm.upsertByFields(
            {
                name: category.name,
                status: "active",
            },
            { code: category.code }
        );
    });
}

async function upsertItem(item: any) {
    const categoryId = await resolveCategoryId(item.category_code);
    if (!categoryId) {
        console.warn(`Skipping Item ${item.code} → parent category not found`);
        return;
    }

    await withModel(itemModel, async (im) => {
        await im.upsertByFields(
            {
                category_id: categoryId,
                name: item.name,
                frequency: item.frequency,
                status: "active",
            },
            { code: item.code }
        );
    });
}


/**
 * Upsert single question (safe).
 * - If DB row exists and structural fields changed -> log violation, cascade-deactivate DB row and return (skip re-activation).
 * - Otherwise update non-structural fields or insert new row.
 * - If parent_question_code is provided but parent is not active, skip and log.
 */
async function upsertQuestion(itemCode: string, question: any): Promise<void> {
    // Resolve item id first
    const itemId = await resolveItemId(itemCode);
    if (!itemId) {
        console.warn(`Skipping Question ${question.code} → parent item not found`);
        return;
    }

    // Resolve parent question id if provided — but only treat parent as valid if it exists and is active.
    let parentQuestionId: number | null = null;
    if (question.parent_question_code) {
        // Use the questionModel directly to fetch parent and check status
        const parentRow = await withModel(questionModel, (qm) =>
            qm.getFirstByFields({ code: question.parent_question_code })
        );

        if (!parentRow) {
            // Parent not found in DB yet — skip insertion (will be retried if parent processed earlier by dependency ordering).
            console.warn(
                `Skipping Question ${question.code} → parent question ${question.parent_question_code} not found`
            );
            return;
        }

        // If parent exists but is inactive, treat parent as missing (do not attach to an inactive parent).
        if (parentRow.status !== "active") {
            console.warn(
                `Skipping Question ${question.code} → parent question ${question.parent_question_code} is inactive`
            );
            return;
        }

        parentQuestionId = parentRow.id;
    }

    // Now do safe upsert by checking existing DB row first (by code)
    await withModel(questionModel, async (qm) => {
        const existing = await qm.getFirstByFields({ code: question.code });

        if (existing) {
            // === structural fields (breaking) ===
            // Consider text, type, parent_question_id, display_condition as structural
            const structuralViolation =
                existing.type !== (question.type as QuestionType) ||
                existing.text !== question.text ||
                // existing.parent_question_id may be a number or null
                (existing.parent_question_id || null) !== (parentQuestionId || null) ||
                (existing.display_condition || null) !== (question.display_condition || null);

            if (structuralViolation) {
                // Deactivate the existing DB row and cascade-deactivate children/options
                console.error(
                    `Violation: Question ${question.code} structural fields changed. Deactivating with cascade.`
                );
                // Use your cascade helper (which expects a question code)
                await cascadeDeactivateQuestion(question.code);
                // Skip updating/re-activating this DB row. Caller should use new code in config if intended.
                return;
            }

            // === Non-structural updates allowed: update only those fields ===
            const nonStructuralUpdates: any = {};
            // Allowed to update: subtype, units, min, max, precision, instructions, required, summary_template, etc.
            if (existing.subtype !== (question.subtype as NumericSubtype)) nonStructuralUpdates.subtype = question.subtype as NumericSubtype;
            if (existing.units !== question.units as Units) nonStructuralUpdates.units = question.units as Units;
            if ((existing.min ?? null) !== (question.min ?? null)) nonStructuralUpdates.min = question.min;
            if ((existing.max ?? null) !== (question.max ?? null)) nonStructuralUpdates.max = question.max;
            if ((existing.precision ?? null) !== (question.precision ?? null)) nonStructuralUpdates.precision = question.precision;
            if ((existing.instructions ?? null) !== (question.instructions ?? null)) nonStructuralUpdates.instructions = question.instructions;
            if (existing.required !== question.required) nonStructuralUpdates.required = question.required;
            if ((existing.summary_template ?? null) !== (question.summary_template ?? null)) nonStructuralUpdates.summary_template = question.summary_template;

            // If parent_question_id is different but not considered structural above (should have been structural),
            // we've already checked parent in structuralViolation so it's safe.
            // If there are updates, apply them and ensure status is active.
            if (Object.keys(nonStructuralUpdates).length > 0 || existing.status !== "active") {
                await qm.updateByFields(
                    { ...nonStructuralUpdates, status: "active" },
                    { id: existing.id }
                );
                logger.debug(`Updated question (non-breaking) or reactivated: ${question.code}`);
            }

            // Also reconcile options: but only if question is active
            if (question.responseOptions?.length) {
                // Only reconcile options if existing row remains active
                const refreshed = await qm.getFirstByFields({ code: question.code });
                if (refreshed && refreshed.status === "active") {
                    for (const option of question.responseOptions) {
                        await upsertOption(question.code, option);
                    }
                }
            }
        } else {
            // No existing question row — insert new
            await qm.insert({
                code: question.code,
                text: question.text,
                type: question.type as QuestionType,
                subtype: question.subtype as NumericSubtype ?? null,
                units: question.units as Units ?? null,
                min: question.min ?? null,
                max: question.max ?? null,
                precision: question.precision ?? null,
                instructions: question.instructions,
                required: question.required,
                summary_template: question.summary_template,
                parent_question_id: parentQuestionId,
                display_condition: question.display_condition,
                item_id: itemId,
                status: "active"
            });
            logger.debug(`Inserted question: ${question.code}`);

            // Insert its response options (if any)
            if (question.responseOptions?.length) {
                for (const option of question.responseOptions) {
                    await upsertOption(question.code, option);
                }
            }
        }
    });
}


async function upsertOption(questionCode: string, option: any) {
    const questionRow = await withModel(questionModel, (qm) =>
        qm.getFirstByFields({ code: questionCode })
    );

    if (!questionRow || questionRow.status !== "active") {
        console.warn(
            `Skipping Option ${option.code} → parent question ${questionCode} is missing or inactive`
        );
        return;
    }

    await withModel(optionModel, async (om) => {
        await om.upsertByFields(
            {
                text: option.text,
                status: "active",
            },
            { question_id: questionRow.id, code: option.code }
        );
    });
}




// ---- Inactivation of missing entities ----
async function deactivateMissingCategories(configCategoryCodes: string[]) {
    const categories = await withModel(categoryModel, (cm) => cm.getAll());
    for (const c of categories) {
        if (!configCategoryCodes.includes(c.code)) {
            await cascadeDeactivateCategory(c.code);
        }
    }
}

async function deactivateMissingItems(configItemCodes: string[]) {
    const items = await withModel(itemModel, (im) => im.getAll());
    for (const i of items) {
        if (!configItemCodes.includes(i.code)) {
            await cascadeDeactivateItem(i.code);
        }
    }
}

async function deactivateMissingQuestions(configQuestionCodes: string[]) {
    const questions = await withModel(questionModel, (qm) => qm.getAll());
    for (const q of questions) {
        if (!configQuestionCodes.includes(q.code)) {
            await cascadeDeactivateQuestion(q.code);
        }
    }
}

async function deactivateMissingOptions(configOptionCodes: string[]) {
    const options = await withModel(optionModel, (om) => om.getAll());
    for (const o of options) {
        if (!configOptionCodes.includes(o.code)) {
            await cascadeDeactivateOption(o.code);
        }
    }
}

// ---- Main sync entrypoint ----
export async function syncTrackConfig() {
    const { version } = predefinedConfig;

    const needSync = await shouldSync("track", version);
    if (!needSync) return;

    // Step 1: Upsert categories, items, questions, options
    for (const category of predefinedConfig.predefinedTrackCategories) {
        await upsertCategory(category);

        const items = predefinedConfig.predefinedTrackItems.filter(
            (i: any) => i.category_code === category.code
        );

        for (const item of (items as any[])) {
            await upsertItem(item);

            for (const question of item.questions || []) {
                await upsertQuestion(item.code, {
                    ...question,
                    type: question.type as QuestionType,
                    subtype: question.subtype as NumericSubtype,
                });

                // ✅ NEW: seed options if present
                for (const option of question.responseOptions || []) {
                    await upsertOption(question.code, option);
                }
            }
        }
    }

    // Step 2: Deactivate missing entities
    const configCategoryCodes = predefinedConfig.predefinedTrackCategories.map(
        (c: any) => c.code
    );
    const configItemCodes = predefinedConfig.predefinedTrackItems.map(
        (i: any) => i.code
    );
    const configQuestionCodes = predefinedConfig.predefinedTrackItems.flatMap(
        (i: any) => (i.questions || []).map((q: any) => q.code)
    );
    const configOptionCodes = predefinedConfig.predefinedTrackItems.flatMap((i: any) =>
        (i.questions || []).flatMap(
            (q: any) => (q.responseOptions || []).map((o: any) => o.code)
        )
    );

    await deactivateQuestionsWithInvalidDisplayConditions(configOptionCodes);

    await deactivateMissingCategories(configCategoryCodes);
    await deactivateMissingItems(configItemCodes);
    await deactivateMissingQuestions(configQuestionCodes);
    await deactivateMissingOptions(configOptionCodes);

    // Step 3: Update version after successful sync
    await updateStoredVersion("track", version);
}
