
import React from "react";
import {
  View,
  Text,
  StyleProp,
  TextStyle,
  ImageSourcePropType,
} from "react-native";
import AppIcon from "./AppIcon"; 
import palette from "@/utils/theme/color";

interface IconLabelHeadingProps {
  icon: ImageSourcePropType;
  label: string;
  size?: number;
  labelStyle?: StyleProp<TextStyle>;
  subtitle?: string;
  count?: number; // number of items
}

const IconLabelHeading: React.FC<IconLabelHeadingProps> = ({
  icon,
  label,
  size = 20,
  labelStyle,
  subtitle,
  count,
}) => {
  return (
    <View className="mb-2">
      {/* Main row: icon + label */}
      <View className="flex-row items-center">
        <AppIcon source={icon} size={size} />
        <Text
          style={[{ color: palette.heading }, labelStyle]}
          className="text-xl font-semibold "
        >
          {label}
        </Text>
      </View>

      {/* Subtitle + count row */}
      {subtitle || count !== undefined ? (
        <View className="flex-row justify-between  ml-[28px]">
          <Text
            className="text-sm text-gray-600 flex-1"
            style={{ flexWrap: "wrap" }}
          >
            {subtitle}
          </Text>
          {count !== undefined && (
            <Text className="text-sm text-gray-600 ">
              {count} {count === 1 ? "item" : "items"}
            </Text>
          )}
        </View>
      ) : null}
    </View>
  );
};

export default IconLabelHeading;
