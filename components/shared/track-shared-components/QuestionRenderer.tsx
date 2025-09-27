import {
  Question,
  ResponseOption as _ResponseOption,
} from "@/services/database/migrations/v1/schema_v1";
import React from "react";
import BooleanQuestion from "./BooleanQuestion";
import DescriptiveQuestion from "./DescriptiveQuestion";
import MCQQuestion from "./MultipleChoice";
import MSQQuestion from "./MultipleSelect";
import NumericQuestion from "./NumericQuestion";
import { QuestionType } from "@/constants/trackTypes";

export default function QuestionRenderer({
  question,
  responses,
  answer,
  setAnswer,
  setCustomOption,
}: {
  question: Question;
  responses: _ResponseOption[]; // Filtered responses for this question
  answer: any;
  setAnswer: (val: any) => void;
  setCustomOption: (ques_id: number, val: string) => void;
}) {
  switch (question.type) {
    case QuestionType.MCQ:
      return (
        <MCQQuestion
          question={question}
          responses={responses}
          value={answer}
          onChange={setAnswer}
        />
      );
    case QuestionType.MSQ:
      return (
        <MSQQuestion
          question={question}
          responses={responses}
          value={answer}
          onChange={setAnswer}
          handleAddOption={setCustomOption}
        />
      );
    case QuestionType.BOOLEAN:
      return (
        <BooleanQuestion
          question={question}
          responses={responses}
          value={answer}
          onChange={setAnswer}
        />
      );
    case QuestionType.NUMERIC:
      return (
        <NumericQuestion
          question={question}
          responses={responses}
          value={answer}
          onChange={setAnswer}
        />
      );
    case QuestionType.TEXT:
      return (
        <DescriptiveQuestion
          question={question}
          responses={responses}
          value={answer}
          onChange={setAnswer}
        />
      );
    default:
      return null;
  }
}
