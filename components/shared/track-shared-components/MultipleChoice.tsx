import React from "react";
import { View, Text } from "react-native";
import ResponseOption from "./ResponseOption";

import palette from "@/utils/theme/color";
import {
  Question,
  ResponseOption as _ResponseOption,
} from "@/services/database/migrations/v1/schema_v1";

export default function MCQQuestion({
  question,
  value,
  onChange,
  responses,
}: {
  question: Question;
  value: string;
  onChange: (val: string) => void;
  responses: _ResponseOption[];
}) {
  const handleOptionPress = (option: string) => {
    if (question.required) {
      onChange(option); // can't deselect if required
    } else {
      if (value === option) {
        onChange(""); // deselect
      } else {
        onChange(option);
      }
    }
  };
  return (
    <View className="mb-4">
      <Text
        style={{ color: palette.secondary }}
        className="font-bold text-xl mb-2"
      >
        {question.text}
      </Text>

      {responses.map((opt) => (
        <ResponseOption
          key={opt.id}
          label={String(opt.text)}
          selected={
            String(value).replace(/"/g, "") ===
            String(opt.text).replace(/"/g, "")
          }
          onPress={() => handleOptionPress(String(opt.text))}
        />
      ))}
    </View>
  );
}
