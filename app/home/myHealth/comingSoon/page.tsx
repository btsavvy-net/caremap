import Header from "@/components/shared/Header";
import { router } from "expo-router";
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ComingSoonScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <Header title="Coming Soon" 
       right={
                <TouchableOpacity onPress={() => router.back()}>
                  <Text className="text-white font-medium">Cancel</Text>
                </TouchableOpacity>
              }
      showBackButton={true} />

    <View className="flex-1  justify-center items-center px-6">
      <View className="items-center">
        <Text className="text-6xl mb-4">🚧</Text>
        <Text className="text-2xl font-bold text-gray-800 mb-2">Coming Soon</Text>
        <Text className="text-center text-gray-500">
          We're working hard to bring this feature to you.{"\n"}Stay tuned for updates!
        </Text>
      </View>
    </View>
    </SafeAreaView>
  );
}
