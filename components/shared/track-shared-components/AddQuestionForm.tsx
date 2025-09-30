import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import palette from "@/utils/theme/color";
import { LabeledTextInput } from "../labeledTextInput";
import { Textarea, TextareaInput } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

export interface Question {
  text: string;
  type: string;
  required: boolean;
  options: string[];
}

interface Props {
  onSave: (q: Question) => void;
  editing?: Question | null;
}

export default function AddQuestionForm({ onSave, editing }: Props) {
  const [text, setText] = useState(editing?.text || "");
  const [type, setType] = useState(editing?.type || "boolean");
  const [required, setRequired] = useState(editing?.required ?? true);
  const [options, setOptions] = useState<string[]>(editing?.options || []);

  const questionTypes = [
    { key: "boolean", label: "Yes/No" },
    { key: "mcq", label: "Single Choice" },
    { key: "msq", label: "Multiple Select" },
    { key: "numeric", label: "Number" },
    { key: "text", label: "Text" },
  ];

  const handleSave = () => {
    if (!text.trim()) return;
    onSave({
      text,
      type,
      required,
      options: type === "mcq" || type === "msq" ? options : [],
    });
    if (!editing) {
      // reset only for new
      setText("");
      setType("boolean");
      setRequired(true);
      setOptions([]);
    }
  };

  return (
    <View className="mb-4">
      <Text
        style={{ color: palette.heading }}
        className="text-xl font-semibold mb-4"
      >
        Type your Question here ..
      </Text>

      {/* Question text */}

      <Textarea
        size="md"
        isDisabled={false}
        isInvalid={false}
        isReadOnly={false}
        className="mb-6 border border-gray-300 h-40"
      >
        <TextareaInput
          value={text}
          onChangeText={setText}
          placeholder="Type here..."
          textAlignVertical="top"
        />
      </Textarea>

      {/* Type selector */}
      {/* Question Type */}
      {/* Question Type */}
      <Text
        style={{ color: palette.heading }}
        className="mb-2 mt-4  text-lg font-semibold"
      >
        Select Question Type:
      </Text>

      <View
        className="flex-row rounded-xl overflow-hidden mb-4"
        style={{
          borderWidth: 1,
          borderColor: palette.primary,
          backgroundColor: palette.whiteColor, // light background for contrast
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 2, // Android shadow
        }}
      >
        {questionTypes.map((qt, idx, arr) => {
          const isActive = type === qt.key;
          return (
            <TouchableOpacity
              key={qt.key}
              style={{
                flex: 1,
                height: 40, // ✅ consistent height across all buttons
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isActive ? palette.primary : "transparent",
                borderRightWidth: idx < arr.length - 1 ? 1 : 0,
                borderColor: palette.primary,
              }}
              onPress={() => setType(qt.key)}
              activeOpacity={0.8}
            >
              <Text
                style={{
                  color: isActive ? "white" : palette.primary,
                  fontWeight: isActive ? "700" : "500",
                  fontSize: 14,
                  textAlign: "center", // ✅ keep label centered
                  includeFontPadding: false, // ✅ Android fix for vertical alignment
                  textAlignVertical: "center", // ✅ Android fix
                }}
                numberOfLines={2} // ✅ prevent wrapping
                ellipsizeMode="tail" // ✅ truncate if too long
              >
                {qt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Options */}
      {(type === "mcq" || type === "msq") && (
        <View className="p-3 border border-gray-200 rounded-lg mb-4 bg-gray-50">
          <Text
            style={{ color: palette.heading }}
            className="text-sm font-medium mb-2"
          >
            Type Your Options..
          </Text>
          {options.map((opt, i) => (
            <LabeledTextInput
              key={i}
              label={`Option ${i + 1}`}
              value={opt}
              onChangeText={(t) => {
                const updated = [...options];
                updated[i] = t;
                setOptions(updated);
              }}
            />
          ))}
          <TouchableOpacity
            onPress={() => setOptions([...options, ""])}
            className="mt-2 border border-cyan-500 items-center rounded-lg py-2 "
          >
            <Text className="text-cyan-600 font-semibold ">+ Add Option</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Required toggle */}
      <View className="flex-row items-center mb-3">
        <Switch
          size="sm"
          value={required}
          onValueChange={setRequired}
          trackColor={{ false: "#d4d4d4", true: "#378793" }}
          thumbColor="#fafafa"
          // activeThumbColor="#fafafa"
          ios_backgroundColor="#d4d4d4"
        />
        <Text>Required</Text>
      </View>

      {/* Save */}

      <TouchableOpacity
        onPress={handleSave}
        style={{ backgroundColor: palette.primary }}
        className="rounded-lg py-3 items-center"
      >
        {/* <Text className="text-white font-bold">Save Question</Text> */}
        <Text className="text-white font-bold">
          {editing ? "Update Question" : "Save Question"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
