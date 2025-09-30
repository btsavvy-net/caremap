import { Text, TextInput, TouchableOpacity, View } from "react-native";
  
  
  export function LabeledTextInput({
  label,
  value,
  editable = true,
  onChangeText,
  keyboardType = "default",
}: {
  label: string;
  value: string;
  editable?: boolean;
  onChangeText: (text: string) => void;
  keyboardType?: "default" | "numeric";
}) {
  return (
    <View className="mb-3">
      <Text className="text-black text-sm mb-1">{label}</Text>
       <TextInput
        className={`border rounded-lg p-3 ${
          editable
            ? "border-gray-300 bg-white text-gray-700"
            : "border-gray-200 bg-gray-100 text-gray-400"
        }`}
        value={value}
        editable={editable}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
      />
    </View>
  );
}