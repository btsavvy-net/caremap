import React from "react";
import { Image, ImageSourcePropType, StyleProp, ImageStyle } from "react-native";

interface IconProps {
  source: ImageSourcePropType;  // 👈 your image (require or {uri})
  size?: number;                // 👈 default: 32
  style?: StyleProp<ImageStyle>; // 👈 allow extra styles
}

const AppIcon: React.FC<IconProps> = ({ source, size , style }) => {
  return (
    <Image
      source={source}
      style={[{ width: size, height: size, marginRight: 6 }, style]}
      resizeMode="contain"
    />
  );
};

export default AppIcon;
