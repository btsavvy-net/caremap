//Track Item enums
export enum TrackingFrequency{
  DAILY = "daily",
  WEEKLY = "weekly",
  MONTHLY = "monthly"
}

// Question type enum
export enum QuestionType {
  BOOLEAN = "boolean",
  MCQ = "multi-choice",
  MSQ = "multi-select",
  NUMERIC = "numeric",
  TEXT = "text",
}

// Numeric subtype enum (only applies if type = NUMERIC)
export enum NumericSubtype {
  INTEGER = "integer",
  DECIMAL = "decimal",
}

// Conditional Questioning - Conditions enum
export enum QuestionCondition {
  EQ = "equals",
  NOT_EQ = "not_equals",
  GT = "gt",
  GTE = "gte",
  LT = "lt",
  LTE = "lte",
  IN = "in",
  NOT_IN = "not_in",
  PARENT_RES_EXISTS = "parent_response_exists"
}