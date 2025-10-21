import React, { useContext } from "react";
import {
  TouchableOpacity,
  Text,
  View,
  Alert,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import Header from "@/components/shared/Header";
import { UserContext } from "@/context/UserContext";
import { signOut as clearTokens } from "@/services/auth-service/google-auth";
import { ROUTES } from "@/utils/route";
import palette from "@/utils/theme/color";

type MenuItem = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

export default function More() {
  const router = useRouter();
  const { setUserData } = useContext(UserContext);

  const handleSignOut = async () => {
    try {
      await clearTokens(); 
      await setUserData(null);
      router.replace(ROUTES.LOGIN);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // 🔹 Menu list
  const menuItems: MenuItem[] = [
    {
      key: "profile",
      label: "Profile",
      icon: "person-circle-outline",
      onPress: () => router.push(ROUTES.EDIT_PROFILE),
    },
    {
      key: "passcode",
      label: "Update Passcode",
      icon: "lock-closed-outline",
      onPress: () => Alert.alert("Update Passcode", "Wire to Passcode screen."),
    },
    {
      key: "consent",
      label: "View Consent",
      icon: "book-outline",
      onPress: () => Alert.alert("View Consent", "Wire to Consent screen."),
    },
    {
      key: "resources",
      label: "Resources",
      icon: "information-circle-outline",
      onPress: () => Alert.alert("Resources", "Wire to Resources screen."),
    },
    {
      key: "feedback",
      label: "Feedback",
      icon: "chatbubble-ellipses-outline",
      onPress: () => Alert.alert("Feedback", "Wire to Feedback screen."),
    },
    {
      key: "support",
      label: "Support",
      icon: "help-circle-outline",
      onPress: () => Alert.alert("Support", "Wire to Support screen."),
    },
    {
      key: "signout",
      label: "Sign Out",
      icon: "log-out-outline",
      onPress: handleSignOut,
    },
  ];

  const renderMenuItem = (item: MenuItem, index: number) => (
    <TouchableOpacity
      key={item.key}
      onPress={item.onPress}
      activeOpacity={0.7}
      className={`flex-row items-center px-4 py-4 ${
        index !== menuItems.length - 1 ? "border-b border-gray-200" : ""
      }`}
    >
      <Ionicons name={item.icon} size={22} color={palette.primary} />
      <Text className="ml-3 text-lg text-gray-800">{item.label}</Text>
      <View className="ml-auto">
        <Ionicons name="chevron-forward" size={18} color={palette.primary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Header
        title="More"
        right={
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-white font-medium">Cancel</Text>
          </TouchableOpacity>
        }
      />

      <View className="flex-1">
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="bg-white rounded-xl overflow-hidden border border-gray-200">
            {menuItems.map((item, index) => renderMenuItem(item, index))}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
