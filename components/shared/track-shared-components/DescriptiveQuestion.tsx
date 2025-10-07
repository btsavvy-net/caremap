import React, { useEffect } from "react";
import { View, Text, TextInput } from "react-native";

import palette from "@/utils/theme/color";
import {
  Question,
  ResponseOption as _ResponseOption,
} from "@/services/database/migrations/v1/schema_v1";

export default function DescriptiveQuestion({
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
  // Pre-fill with existing response (if available)
  useEffect(() => {
    if (!value && responses?.length > 0) {
      onChange(responses[0].text); // take the first saved text response
    }
  }, [responses]);

  return (
    <View className="mb-4">
      <Text
        style={{ color: palette.secondary }}
        className="font-bold text-xl mb-2"
      >
        {question.text}
      </Text>

      <TextInput
        placeholder="Enter your answer"
        className="border border-gray-300 rounded-lg p-3 h-32 text-base text-gray-900"
        multiline
        value={value}
        onChangeText={onChange}
      />
    </View>
  );
}
