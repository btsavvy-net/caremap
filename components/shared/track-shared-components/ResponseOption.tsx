import React from "react";
import { TouchableOpacity, Text, View } from "react-native";
import { Icon } from "@/components/ui/icon";
import { CheckIcon } from "@/components/ui/icon";
import palette from "@/utils/theme/color";

export default function ResponseOption({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-row items-center justify-between border rounded-xl py-3 px-4 mb-2
        ${
          selected
            ? "bg-cyan-100 border-cyan-400"
            : "bg-gray-100 border-gray-300"
        }`}
    >
      <View className="w-3/4">
        <Text
          className={`text-[15px] ${
            selected ? "text-cyan-700 " : "text-gray-800"
          }`}
        >
          {label}
        </Text>
      </View>

      {selected && (
        <Icon as={CheckIcon} size="xl" style={{ color: palette.primary }} />
      )}
    </TouchableOpacity>
  );
}
