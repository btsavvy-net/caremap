// components/shared/CommonConditions.tsx
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Icon } from "@/components/ui/icon";
import { Lightbulb } from "lucide-react-native";
import palette from "@/utils/theme/color";

interface CommonConditionsProps {
  conditions: string[];
  onSelect: (condition: string) => void;
}

const CommonConditions: React.FC<CommonConditionsProps> = ({
  conditions,
  onSelect,
}) => {
  return (
    <View className="mb-6">
      {/* Heading */}
      <View className="flex-row items-center mb-4">
        <Icon as={Lightbulb} size="md" style={{ color: palette.heading }} className=" mr-2" />
        <Text className="text-lg font-semibold">Common Conditions</Text>
      </View>

      {/* Grid */}
      <View className="flex-row flex-wrap -mx-1">
        {conditions.map((condition, index) => (
          <View key={index} className="w-1/2 px-1 mb-3">
            <TouchableOpacity
              onPress={() => onSelect(condition)}
              className="bg-gray-100 border border-gray-200 rounded-lg px-3 py-3 w-full"
              activeOpacity={0.7}
            >
              <Text className="text-base font-medium text-center">
                {condition}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );
};

export default CommonConditions;
