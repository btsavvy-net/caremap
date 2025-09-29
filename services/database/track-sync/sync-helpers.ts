const skippedQuestions = new Set<string>();

export function markQuestionAsSkipped(code: string) {
    skippedQuestions.add(code);
}

export function isQuestionSkipped(code: string) {
    return skippedQuestions.has(code);
}

export function resetSkippedRegistry() {
    skippedQuestions.clear();
}
