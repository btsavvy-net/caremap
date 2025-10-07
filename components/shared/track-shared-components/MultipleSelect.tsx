import React from "react";
import { Text, View } from "react-native";
import {
  Question,
  ResponseOption as ResponseOptionType,
} from "@/services/database/migrations/v1/schema_v1";
import palette from "@/utils/theme/color";
import ResponseOption from "./ResponseOption";
export default function MSQQuestion({
  question,
  value,
  onChange,
  responses = [],
}: {
  question: Question;
  value?: string[];
  onChange: (val: string[]) => void;
  responses?: ResponseOptionType[];
}) {
  const safeValue = Array.isArray(value) ? value : [];

  const toggleOption = (opt: string) => {
    const normalizedOpt = opt.trim().toLowerCase();
    const normalizedValues = safeValue.map((v) => v.trim().toLowerCase());

    if (normalizedValues.includes(normalizedOpt)) {
      onChange(
        safeValue.filter((v) => v.trim().toLowerCase() !== normalizedOpt)
      );
    } else {
      onChange([...safeValue, opt]);
    }
  };

  return (
    <View className="mb-6">
      <Text
        style={{ color: palette.secondary }}
        className="font-bold text-lg mb-3"
      >
        {question.text}
      </Text>

      {responses.map((opt) => (
        <ResponseOption
          key={opt.id}
          label={opt.text}
          selected={safeValue.some(
            (v) => v.trim().toLowerCase() === opt.text.trim().toLowerCase()
          )}
          onPress={() => toggleOption(opt.text)}
        />
      ))}
    </View>
  );
}
