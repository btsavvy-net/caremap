import { TouchableOpacity, Text, View, Alert, ScrollView } from "react-native";
import { useContext } from "react";
import { useRouter } from "expo-router";
import ComingSoonScreen from "@/components/shared/ComingSoonScreen";
import { UserContext } from "@/context/UserContext";
import { PatientContext } from "@/context/PatientContext";
import { signOut as clearTokens } from "@/services/auth-service/google-auth";
import { CustomButton } from "@/components/shared/CustomButton";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/components/shared/Header";
import { Ionicons } from "@expo/vector-icons";
import { ROUTES } from "@/utils/route";

type MenuItem = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap; // temporary placeholder icon
  onPress?: () => void;
};

export default function More() {
  const router = useRouter();
  const { setUserData } = useContext(UserContext);
  // const { setPatientData } = useContext(PatientContext);

  const handleSignOut = async () => {
    try {
      // 1️⃣ Clear tokens
      await clearTokens();

      // 2️⃣ Reset contexts
      await setUserData(null);
      // setPatientData(null);
      // ???

      // 3️⃣ Navigate to login
      router.replace(ROUTES.LOGIN);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const onProfile = () => {
   router.push(ROUTES.EDIT_PROFILE)
  };
  const onPasscode = () => {
    Alert.alert("Update Passcode", "Wire to Passcode screen.");
  };
  const onConsent = () => {
    Alert.alert("View Consent", "Wire to Consent screen.");
  };
  const onResources = () => {
    Alert.alert("Resources", "Wire to Resources screen.");
  };
  const onFeedback = () => {
    Alert.alert("Feedback", "Wire to Feedback screen.");
  };
  const onSupport = () => {
    Alert.alert("Support", "Wire to Support screen.");
  };

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
      {/* Main content */}

      <View className="flex-1">
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16 }}
        >
          <View className="bg-white rounded-xl overflow-hidden border border-gray-200">
            {/* Profile */}
            <TouchableOpacity
              onPress={onProfile}
              activeOpacity={0.7}
              className="flex-row items-center px-4 py-4 border-b border-gray-200"
            >
              <Ionicons
                name="person-circle-outline"
                size={22}
                color="#2C7A7B"
              />
              <Text className="ml-3 text-lg text-gray-800">Profile</Text>
              <View className="ml-auto">
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </View>
            </TouchableOpacity>

            {/* Update Passcode */}
            <TouchableOpacity
              onPress={onPasscode}
              activeOpacity={0.7}
              className="flex-row items-center px-4 py-4 border-b border-gray-200"
            >
              <Ionicons name="lock-closed-outline" size={22} color="#2C7A7B" />
              <Text className="ml-3 text-lg text-gray-800">
                Update Passcode
              </Text>
              <View className="ml-auto">
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </View>
            </TouchableOpacity>

            {/* View Consent */}
            <TouchableOpacity
              onPress={onConsent}
              activeOpacity={0.7}
              className="flex-row items-center px-4 py-4 border-b border-gray-200"
            >
              <Ionicons name="book-outline" size={22} color="#2C7A7B" />
              <Text className="ml-3 text-lg text-gray-800">View Consent</Text>
              <View className="ml-auto">
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </View>
            </TouchableOpacity>

            {/* Resources */}
            <TouchableOpacity
              onPress={onResources}
              activeOpacity={0.7}
              className="flex-row items-center px-4 py-4 border-b border-gray-200"
            >
              <Ionicons
                name="information-circle-outline"
                size={22}
                color="#2C7A7B"
              />
              <Text className="ml-3 text-lg text-gray-800">Resources</Text>
              <View className="ml-auto">
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </View>
            </TouchableOpacity>

            {/* Feedback */}
            <TouchableOpacity
              onPress={onFeedback}
              activeOpacity={0.7}
              className="flex-row items-center px-4 py-4 border-b border-gray-200"
            >
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={22}
                color="#2C7A7B"
              />
              <Text className="ml-3 text-lg text-gray-800">Feedback</Text>
              <View className="ml-auto">
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </View>
            </TouchableOpacity>

            {/* Support */}
            <TouchableOpacity
              onPress={onSupport}
              activeOpacity={0.7}
              className="flex-row items-center px-4 py-4"
            >
              <Ionicons name="help-circle-outline" size={22} color="#2C7A7B" />
              <Text className="ml-3 text-lg text-gray-800">Support</Text>
              <View className="ml-auto">
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Sign Out button pinned at bottom */}
        <View className="px-4">
          <CustomButton title="Sign Out" onPress={handleSignOut} />
        </View>
      </View>
    </SafeAreaView>
  );
}
