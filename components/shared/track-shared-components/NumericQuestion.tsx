import React, { useMemo, useState } from "react";
import { View, Text, TouchableOpacity, TextInput } from "react-native";
import {
  Question,
  ResponseOption as _ResponseOption,
} from "@/services/database/migrations/v1/schema_v1";

export default function NumericQuestion({
  question,
  value,
  onChange,
  responses, 
}: {
  question: Question;
  value: number;
  onChange: (val: number) => void;
  responses: _ResponseOption[];
}) {
  const subtype = question.subtype ?? "decimal";
  const units = question.units ?? "";
  const min = question.min ?? 0;
  const max = question.max ?? Infinity;
  const precision = question.precision ?? 2;

  const [inputValue, setInputValue] = useState(value?.toString() || "");

  const handleInputChange = (text: string) => {
    setInputValue(text);

 
    const numericValue =
      subtype === "integer" ? parseInt(text, 10) : parseFloat(text);

    if (!isNaN(numericValue)) {
      onChange(numericValue);
    }
  };

  // When input loses focus, validate and clamp the value
  const handleInputBlur = () => {
    let numericValue =
      subtype === "integer" ? parseInt(inputValue, 10) : parseFloat(inputValue);

    if (isNaN(numericValue)) {
      numericValue = 0;
    }

    // Clamp value so number stays within min/max range
    const clampedValue = Math.max(min, Math.min(numericValue, max));

    let finalValue = clampedValue;
    let finalValueString = clampedValue.toString();

    if (subtype === "decimal") {
      finalValue = parseFloat(clampedValue.toFixed(precision));
      finalValueString = finalValue.toString();
      // finalValueString = clampedValue.toFixed(precision);
    } else {
      finalValue = Math.round(clampedValue);
      finalValueString = finalValue.toString();
    }

    setInputValue(finalValueString);
    onChange(finalValue);
  };

  const decrementValue = () => {
    const currentValue = value || 0;
    const newValue = Math.max(min, currentValue - 1);
    onChange(newValue);
    setInputValue(newValue.toString());
  };

  const incrementValue = () => {
    const currentValue = value || 0;
    const newValue = Math.min(max, currentValue + 1);
    onChange(newValue);
    setInputValue(newValue.toString());
  };

  return (
    <View className="mb-4">
      <Text className="font-bold text-xl mb-2">{question.text}</Text>

      <View className="flex-row items-center">
        <TouchableOpacity
          onPress={decrementValue}
          className="bg-gray-300 px-4 py-2 rounded-lg mr-4"
        >
          <Text className="text-lg font-semibold">-</Text>
        </TouchableOpacity>

        <TextInput
          value={inputValue}
          onChangeText={handleInputChange}
          keyboardType={subtype === "integer" ? "number-pad" : "decimal-pad"}
          className="border border-gray-400 px-3 py-2 rounded-lg text-center text-lg min-w-[80px] mx-2"
          onBlur={handleInputBlur}
        />
        {units && <Text className="text-lg font-medium">{units}</Text>}
        <TouchableOpacity
          onPress={incrementValue}
          className="bg-gray-300 px-4 py-2 rounded-lg ml-4"
        >
          <Text className="text-lg font-semibold">+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
