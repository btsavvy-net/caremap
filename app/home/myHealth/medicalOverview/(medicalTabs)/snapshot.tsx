import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import palette from "@/utils/theme/color";
import { Textarea, TextareaInput } from "@/components/ui/textarea";
import { PatientContext } from "@/context/PatientContext";
import {
  createPatientSnapshot,
  updatePatientSnapshot,
  getPatientSnapshot,
} from "@/services/core/PatientSnapshotService";
import { PatientSnapshot } from "@/services/database/migrations/v1/schema_v1";

import { Divider } from "@/components/ui/divider";
import Header from "@/components/shared/Header";
import { useCustomToast } from "@/components/shared/useCustomToast";
import { CustomButton } from "@/components/shared/CustomButton";
import AppIcon from "@/components/shared/AppIcon";
import IconLabelHeading from "@/components/shared/IconLabelHeading";

export default function Snapshot() {
  const { patient } = useContext(PatientContext);
  const [patientOverview, setPatientOverview] = useState("");
  const [healthIssues, setHealthIssues] = useState("");
  const [snapshot, setSnapshot] = useState<PatientSnapshot | null>(null);
  const showToast = useCustomToast();

  useEffect(() => {
    if (patient?.id) {
      getPatientSnapshot(patient.id).then(
        (existing: PatientSnapshot | null) => {
          if (existing) {
            setSnapshot(existing);
            setPatientOverview(existing.patient_overview ?? "");
            setHealthIssues(existing.health_issues ?? "");
          }
        }
      );
    }
  }, [patient]);

  const isDisabled =
    patientOverview.trim() === "" && healthIssues.trim() === "";

  const handleSave = async () => {
    if (!patient?.id) {
      Alert.alert("Error", "Patient not found.");
      return;
    }

    const data: Partial<PatientSnapshot> = {
      patient_id: patient.id,
      patient_overview: patientOverview,
      health_issues: healthIssues,
    };

    try {
      if (snapshot?.id) {
        await updatePatientSnapshot(data, { id: snapshot.id });
        // Alert.alert("Success", "Snapshot updated successfully.");
        showToast({
          title: "Success",
          description: "Snapshot updated successfully.",
          action: "success",
        });
      } else {
        await createPatientSnapshot(data);
        // Alert.alert("Success", "Snapshot created successfully.");
        showToast({
          title: "Success",
          description: "Snapshot created successfully.",
          action: "success",
        });
      }

      router.back();
    } catch (err) {
      // console.error("Failed to save snapshot:", err);
      // Alert.alert("Error", "Failed to save snapshot.");
      showToast({
        title: "Error",
        description: "Failed to save snapshot.",
        action: "error",
      });
    }
  };

  return (
    <SafeAreaView edges={["right", "top", "left"]} className="flex-1 bg-white">
      <Header
        title="Snapshot"
        right={
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-white font-medium">Cancel</Text>
          </TouchableOpacity>
        }
      />
      <KeyboardAvoidingView
        // behavior={Platform.OS === "ios" ? "padding" : "height"}
        behavior={"padding"}
        style={{ flex: 1 }}
        // keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <ScrollView
          className="px-5 pt-5 flex-1"
          contentContainerStyle={{
            paddingBottom: 10,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
        >
          <IconLabelHeading
            icon={require("@/assets/images/snapshot.png")}
            label="Describe about yourself."
          />

          <Text className="text-base text-gray-500 mb-4 leading-5">
            E.g. You may include your preferences, what they like or dislike.
            What are their motivations, goals and favorite things.
          </Text>

          <Textarea
            size="lg"
            isDisabled={false}
            isInvalid={false}
            isReadOnly={false}
            className="mb-6 border border-gray-300 h-40"
          >
            <TextareaInput
              value={patientOverview}
              onChangeText={setPatientOverview}
              placeholder="Type here..."
              // multiline
              // numberOfLines={5}
              textAlignVertical="top"
            />
          </Textarea>

          <Divider className="bg-gray-300 mb-4" />

          
          <IconLabelHeading
            icon={require("@/assets/images/snapshot.png")}
            label="Describe your health issues."
            subtitle="Include current or past medical conditions etc."
          />

          <Textarea
            size="lg"
            isDisabled={false}
            isInvalid={false}
            isReadOnly={false}
            className="mb-6 border border-gray-300 h-40"
          >
            <TextareaInput
              value={healthIssues}
              onChangeText={setHealthIssues}
              placeholder="Type here..."
              // multiline
              // numberOfLines={5}
              textAlignVertical="top"
            />
          </Textarea>
        </ScrollView>

        {/* Save Button */}
        <View className="p-5">
          <CustomButton
            title="Save"
            onPress={handleSave}
            disabled={isDisabled}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
