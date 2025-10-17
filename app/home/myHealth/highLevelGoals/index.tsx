import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Progress, ProgressFilledTrack } from "@/components/ui/progress";
import { CalendarDaysIcon, Icon } from "@/components/ui/icon";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import Header from "@/components/shared/Header";
import { PatientContext } from "@/context/PatientContext";
import { PatientGoal } from "@/services/database/migrations/v1/schema_v1";
import {
  createPatientGoal,
  getPatientGoalsByPatientId,
  updatePatientGoal,
  deletePatientGoal,
} from "@/services/core/PatientGoalService";
import ActionPopover from "@/components/shared/ActionPopover";
import { CustomAlertDialog } from "@/components/shared/CustomAlertDialog";
import palette from "@/utils/theme/color";
import { useCustomToast } from "@/components/shared/useCustomToast";
import { logger } from "@/services/logging/logger";
import { router } from "expo-router";
import { Divider } from "@/components/ui/divider";
import { CustomButton } from "@/components/shared/CustomButton";
import { Calendar, Target, Clock } from "lucide-react-native";
import { CustomFormInput } from "@/components/shared/CustomFormInput";
import IconLabelHeading from "@/components/shared/IconLabelHeading";
import CommonConditions from "@/components/shared/CommonConditions";

const linkedGoals = [
  "Establish a consistent sleep schedule for better energy and recovery.",
  "Improve cardiovascular fitness by engaging in regular aerobic activity.",
];

export default function HighLevelGoals() {
  const [showAddForm, setShowAddForm] = useState(false);
  const { patient } = useContext(PatientContext);
  const [userGoals, setUserGoals] = useState<PatientGoal[]>([]);
  const [editingGoal, setEditingGoal] = useState<PatientGoal | undefined>(
    undefined
  );

  // for alert while delete
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<PatientGoal | null>(null);

  // Custom toast
  const showToast = useCustomToast();

  async function fetchGoals() {
    if (!patient?.id) {
      logger.debug("No patient id found");
      return;
    }
    try {
      const getUserGoals = await getPatientGoalsByPatientId(patient.id);
      setUserGoals(getUserGoals);
    } catch (error) {
      logger.debug(String(error));
    }
  }

  useEffect(() => {
    fetchGoals();
  }, [patient]);

  // Add/Update HighLevelsGoals
  const handleAddUpdateGoal = async (goal: {
    id?: number;
    goal_description: string;
    target_date?: Date;
  }) => {
    if (!patient?.id) return;
    if (goal.id) {
      //  edit exsiting goal
      await updatePatientGoal(
        {
          goal_description: goal.goal_description,
          target_date: goal.target_date,
        },
        { id: goal.id }
      );
      await fetchGoals();
      showToast({
        title: "Goal updated",
        description: "High level goal updated successfully!",
      });
    } else {
      // Add new Goal
      await createPatientGoal({
        patient_id: patient.id,
        goal_description: goal.goal_description,
        target_date: goal.target_date,
      });
      await fetchGoals();
      showToast({
        title: "Goal added",
        description: "High level goal added successfully!",
      });
    }
  };

  // Helper function to calculate days remaining:
  function getDaysRemaining(targetDate: string | Date): number {
    const now = new Date();
    const target =
      targetDate instanceof Date ? targetDate : new Date(targetDate);
    // Zero out the time part for both dates to get whole days
    now.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    const diff = target.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  // for progress bar
  function getDaysBetween(start: string | Date, end: string | Date): number {
    const s = start instanceof Date ? start : new Date(start);
    const e = end instanceof Date ? end : new Date(end);
    s.setHours(0, 0, 0, 0);
    e.setHours(0, 0, 0, 0);
    return Math.max(
      1,
      Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24))
    );
  }

  // Open edit form
  const handleEditGoal = (goal: PatientGoal) => {
    setEditingGoal(goal);
    setShowAddForm(true);
  };

  if (showAddForm) {
    return (
      <AddYourGoalsPage
        onClose={() => {
          setShowAddForm(false);
          setEditingGoal(undefined);
        }}
        handleAddUpdateGoal={handleAddUpdateGoal}
        editingGoal={editingGoal}
      />
    );
  }

  return (
    <SafeAreaView edges={["right", "top", "left"]} className="flex-1 bg-white">
      {/* Header */}
      <Header
        title="High level goals"
        right={
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-white font-medium">Cancel</Text>
          </TouchableOpacity>
        }
      />

      <View className="px-5 pt-5 flex-1">
        {/* Linked Health System */}

        <IconLabelHeading
          icon={require("@/assets/images/highLevelGoals.png")}
          label="High level goals (Linked health system)"
          subtitle="Imported from your healthcare provider"
          count={linkedGoals.length}
        />
        {/* <Divider className="bg-gray-300 my-3" /> */}

        <FlatList
          data={linkedGoals}
          renderItem={({ item }) => (
            <View className="border border-gray-300 p-3 rounded-xl mb-3 bg-gray-100">
              <Text className="text-lg">{item}</Text>
            </View>
          )}
          keyExtractor={(_, index) => index.toString()}
          ListEmptyComponent={
            <Text className="text-gray-500 text-lg">
              No user linked health system found.
            </Text>
          }
          showsVerticalScrollIndicator={true}
          scrollEnabled={true}
          style={{ minHeight: 100, maxHeight: 160 }}
        />
        <Divider className="bg-gray-300 mt-2"  />

        {/* User Entered Goals */}
        <View className="flex-1 mt-4">
          <IconLabelHeading
            icon={require("@/assets/images/highLevelGoals.png")}
            label="High level goals (User entered)"
            subtitle="Goals you have added"
            count={userGoals.length}
          />
          {/* <Divider className="bg-gray-300 my-3" /> */}

          <View className="flex-1">
            <FlatList
              data={userGoals}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={true}
              scrollEnabled={true}
              style={{ minHeight: 50 }}
              ListEmptyComponent={
                <Text className="text-gray-500 text-lg">
                  No user goals found.
                </Text>
              }
              renderItem={({ item }) => {
                let daysRemaining, totalDays, progress;
                if (item.target_date && item.created_date) {
                  daysRemaining = getDaysRemaining(item.target_date);
                  totalDays = getDaysBetween(
                    item.created_date,
                    item.target_date
                  );
                  // Show at least 2% progress for new goals
                  progress = Math.max(
                    0.02,
                    Math.min(1, (totalDays - daysRemaining) / totalDays)
                  );
                }
                return (
                  <View className="bg-white border border-gray-300 rounded-xl px-3 py-3 mb-3">
                    <View className="flex-row items-start mb-2">
                      <View className="flex-row items-center flex-1">
                        {/* Goal Title */}
                        <Text className="text-lg text-black ml-3 font-normal">
                          {item.goal_description}
                        </Text>
                      </View>
                      <ActionPopover
                        onEdit={() => {
                          handleEditGoal(item);
                        }}
                        onDelete={() => {
                          setGoalToDelete(item);
                          setShowAlertDialog(true);
                        }}
                      />
                    </View>

                    {/* Only show days remaining if target_date exists */}
                    {item.target_date && (
                      <View className="flex-row items-center justify-end mb-2">
                        <Icon
                          as={Clock}
                          className="text-gray-500 mr-1 w-5 h-5"
                        />
                        <Text className="text-gray-500 text-sm font-medium">
                          {getDaysRemaining(item.target_date)} days remaining
                        </Text>
                      </View>
                    )}
                    {/* Show progress bar if days remaining > 0*/}
                    {progress !== undefined &&
                      daysRemaining !== undefined &&
                      daysRemaining > 0 && (
                        <View className="w-full px-2 py-2">
                          <Progress
                            value={progress * 100}
                            size="sm"
                            orientation="horizontal"
                          >
                            <ProgressFilledTrack
                              style={{ backgroundColor: palette.primary }}
                            />
                          </Progress>
                        </View>
                      )}
                  </View>
                );
              }}
            />
          </View>
        </View>

        <Divider className="bg-gray-300 " />

        {/* Add Your Goals */}
        <View className="py-4">
          <CustomButton
            title="Add your goal"
            onPress={() => setShowAddForm(true)}
          />
        </View>
      </View>

      <CustomAlertDialog
        isOpen={showAlertDialog}
        onClose={() => setShowAlertDialog(false)}
        description={goalToDelete?.goal_description}
        onConfirm={async () => {
          if (goalToDelete) {
            await deletePatientGoal(goalToDelete.id);
            await fetchGoals();
            showToast({
              title: "Goal deleted",
              description: "High level goal deleted successfully!",
            });
          }
          setShowAlertDialog(false);
          setGoalToDelete(null);
        }}
      />
    </SafeAreaView>
  );
}

// --------------Add your goals------------------

function AddYourGoalsPage({
  onClose,
  handleAddUpdateGoal,
  editingGoal,
}: {
  onClose: () => void;
  handleAddUpdateGoal: (goal: {
    id?: number;
    goal_description: string;
    target_date?: Date;
  }) => void;
  editingGoal?: { id: number; goal_description: string; target_date?: Date };
}) {
  const [goalDescription, setGoalDescription] = useState(
    editingGoal?.goal_description || ""
  );
  const [completionDate, setCompletionDate] = useState<Date | null>(
    editingGoal?.target_date ? new Date(editingGoal.target_date) : null
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);

  const DURATIONS = [7, 30, 60, 90];

  const formatDate = (date: Date) => {
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const yy = String(date.getFullYear());
    return `${mm}-${dd}-${yy}`;
  };

  const addDays = (days: number) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + days);
    return d;
  };

  const handleSelectDuration = (days: number) => {
    setSelectedDuration(days);
    const newDate = addDays(days);
    setCompletionDate(newDate);
  };

  const handleConfirm = (date: Date) => {
    // Manual date overrides duration buttons
    setCompletionDate(date);
    setSelectedDuration(null);
    setShowDatePicker(false);
  };

  const handleSave = () => {
    if (isDisabled) return;
    handleAddUpdateGoal({
      id: editingGoal?.id,
      goal_description: goalDescription.trim(),
      target_date: completionDate ?? undefined,
    });
    onClose();
  };

  const isDisabled = goalDescription.trim().length === 0;

  // Common goals (click to auto-fill)
  const commonGoals = [
    "Stay physically active",
    "Manage stress levels",
    "Ensure proper sleep",
    "Stay hydrated",
    "Routine check-ups",
    "Quit smoking",
  ];

  const selectCommonGoal = (goal: string) => {
    setGoalDescription(goal);
  };

  return (
    <SafeAreaView edges={["right", "top", "left"]}  className="flex-1 bg-white">
      <Header
        title="Add Health Goal"
        right={
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-white font-medium">Cancel</Text>
          </TouchableOpacity>
        }
        onBackPress={onClose}
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={"padding"}>
        <ScrollView
          className="px-5 pt-5 flex-1"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Goal Title */}

          <IconLabelHeading
            icon={require("@/assets/images/highLevelGoals.png")}
            label={editingGoal ? "Update your goal" : "Add your goal"}
            // subtitle=" Enter a specific, measurable health goal"
          />
          <CustomFormInput
            label="Goal Title *"
            placeholder="Enter you health goal"
            onChangeText={setGoalDescription}
            value={goalDescription}
            className="mb-2"
          />
          <Text className="text-gray-600 text-sm mb-4">
            Describe a specific, measurable health goal.
          </Text>

          {/* Duration (Days) */}
          <View className="mb-5">
            <View className="flex-row items-center ">
              <Icon
                as={Target}
                size="sm"
                className="text-gray-600 mr-1 font-medium"
              />
              <Text
                className="text-base "
                // style={{ color: palette.primary }}
              >
                Duration (Days)
              </Text>
              
            </View>
            

            <View className="flex-row justify-between my-2">
              {DURATIONS.map((d) => {
                const active = selectedDuration === d;
                return (
                  <TouchableOpacity
                    key={d}
                    onPress={() => handleSelectDuration(d)}
                    className={`flex-1 mx-1 rounded-md border ${
                      active ? "border-0" : "bg-white border-gray-300"
                    }`}
                    style={{
                      paddingVertical: 5,
                      backgroundColor: active ? palette.primary : "transparent",
                      borderColor: active ? palette.primary : palette.gray300,
                    }}
                    activeOpacity={0.85}
                  >
                    <View className="items-center">
                      <Icon
                        as={Clock}
                        size="sm"
                        className={`mb-1 ${
                          active ? "text-white" : "text-gray-600"
                        }`}
                      />
                      <Text
                        className={`text-sm font-medium ${
                          active ? "text-white" : "text-gray-700"
                        }`}
                      >
                        {d} days
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text className="text-gray-500 text-sm mb-2">
              Selecting a duration auto-fills this date.
            </Text>

            {/* Target Date (auto-populated) */}
            <TouchableOpacity
              className="border border-gray-300 rounded-md px-3 py-3"
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center">
                <Text className="flex-1 text-base text-gray-800">
                  {completionDate ? formatDate(completionDate) : "MM-DD-YYYY"}
                </Text>
                <Icon as={Calendar} className="text-gray-500 w-5 h-5" />
              </View>
            </TouchableOpacity>
            <DateTimePickerModal
              isVisible={showDatePicker}
              mode="date"
              onConfirm={handleConfirm}
              onCancel={() => setShowDatePicker(false)}
              minimumDate={new Date()}
            />
            
          </View>

          {/* Common Goals */}
          <CommonConditions
            conditions={commonGoals}
            onSelect={(c) => selectCommonGoal(c)}
          />
        </ScrollView>

        <View className="p-5">
          <CustomButton
            title={editingGoal ? "Update" : "Save"}
            onPress={handleSave}
            disabled={isDisabled}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
