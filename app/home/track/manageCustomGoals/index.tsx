import React, { useEffect, useState, useContext } from "react";
import { View, Text, FlatList, TouchableOpacity, KeyboardAvoidingView, ScrollView,Platform } from "react-native";
import { useRouter } from "expo-router";
import { CustomButton } from "@/components/shared/CustomButton";
import { Divider } from "@/components/ui/divider";
import ActionPopover from "@/components/shared/ActionPopover";
import {
  getAllCategoriesWithSelectableItems,
  removeCustomGoal,
} from "@/services/core/TrackService";
import { PatientContext } from "@/context/PatientContext";
import { CustomAlertDialog } from "@/components/shared/CustomAlertDialog";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/components/shared/Header";
import { Question } from "@/services/database/migrations/v1/schema_v1";

// ✅ no `details`
interface CustomGoal {
  id: number;
  name: string;
  created_date: string; // store as string (ISO)
  frequency?: string; // optional
  questions?: Question[]; // optional, can be array of any structure
}

export default function ManageCustomGoals() {
  const router = useRouter();
  const { patient } = useContext(PatientContext);

  const [customGoals, setCustomGoals] = useState<CustomGoal[]>([]);
  const [goalToDelete, setGoalToDelete] = useState<CustomGoal | null>(null);
  const [showAlertDialog, setShowAlertDialog] = useState(false);

  const fetchCustomGoals = async () => {
    if (!patient?.id) return;

    const res = await getAllCategoriesWithSelectableItems(
      patient.id,
      new Date().toISOString()
    );

    const customCategory = res.find((cat) => cat.category.name === "Custom");

    if (customCategory) {
      setCustomGoals(
        customCategory.items.map((it) => ({
          id: it.item.id,
          name: it.item.name,
          created_date: new Date(it.item.created_date).toISOString(), // ✅ always string
        }))
      );
    } else {
      setCustomGoals([]);
    }
  };

  useEffect(() => {
    fetchCustomGoals();
  }, [patient?.id]);

  const handleEditGoal = (goal: CustomGoal) => {
  router.push({
    pathname: "/home/track/customGoals",
    params: {
      goalId: goal.id.toString(),
      goalName: goal.name,
      frequency: goal.frequency,
      questions: JSON.stringify(goal.questions ?? []),
    },
  });
};


  const handleDeleteGoal = async () => {
    if (!goalToDelete || !patient?.id) return;
    await removeCustomGoal(goalToDelete.id, patient.id);
    await fetchCustomGoals();
    setShowAlertDialog(false);
    setGoalToDelete(null);
  };

  return (
  <SafeAreaView edges={["right", "top", "left"]} className="flex-1 bg-white">
  <Header
    title="Add Custom Goal"
    right={
      <TouchableOpacity onPress={() => router.back()}>
        <Text className="text-white font-medium">Cancel</Text>
      </TouchableOpacity>
    }
  />

  <KeyboardAvoidingView
    behavior={Platform.OS === "ios" ? "padding" : "height"}
    className="flex-1"
  >
    <FlatList
      data={customGoals}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 100,
      }}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <Text className="text-xl font-bold mb-4">Manage Custom Goals</Text>
      }
      renderItem={({ item }) => {
        const formattedDate = new Date(item.created_date).toLocaleDateString();

        return (
          <View className="border border-gray-300 rounded-lg mb-3 px-3 py-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center space-x-2">
                <Text className="text-lg ml-3 max-w-[220px] font-medium">
                  {item.name}
                </Text>
              </View>
              <View className="flex-row items-center">
                <Text className="text-lg text-gray-700 mr-3">
                  {formattedDate}
                </Text>
                <ActionPopover
                  onEdit={() => handleEditGoal(item)}
                  onDelete={() => {
                    setGoalToDelete(item);
                    setShowAlertDialog(true);
                  }}
                />
              </View>
            </View>
          </View>
        );
      }}
      ListEmptyComponent={
        <Text className="text-gray-500">No Custom Goals found.</Text>
      }
    />
  </KeyboardAvoidingView>

  <Divider className="bg-gray-300 mb-3" />

  <CustomButton
    title="Add More Goals"
    onPress={() => router.push("/home/track/customGoals")}
  />

  <CustomAlertDialog
    isOpen={showAlertDialog}
    onClose={() => setShowAlertDialog(false)}
    description={goalToDelete?.name ?? ""}
    onConfirm={handleDeleteGoal}
  />
</SafeAreaView>

  );
}
