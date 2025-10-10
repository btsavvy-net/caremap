import React from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ComingSoonScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white justify-center items-center px-6">
      <View className="items-center">
        <Text className="text-6xl mb-4">🚧</Text>
        <Text className="text-2xl font-bold text-gray-800 mb-2">Coming Soon</Text>
        <Text className="text-center text-gray-500">
          We're working hard to bring this feature to you.{"\n"}Stay tuned for updates!
        </Text>
      </View>
    </SafeAreaView>
  );
}
