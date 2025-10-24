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
import { Textarea, TextareaInput } from "@/components/ui/textarea";
import palette from "@/utils/theme/color";
import {
  createPatientAllergy,
  getPatientAllergiesByPatientId,
  updatePatientAllergy,
  deletePatientAllergy,
} from "@/services/core/PatientAllergyService";
import { PatientContext } from "@/context/PatientContext";
import { CustomAlertDialog } from "@/components/shared/CustomAlertDialog";
import Header from "@/components/shared/Header";
import ActionPopover from "@/components/shared/ActionPopover";
import { useCustomToast } from "@/components/shared/useCustomToast";
import { PatientAllergy } from "@/services/database/migrations/v1/schema_v1";
import { logger } from "@/services/logging/logger";
import { router } from "expo-router";
import { Divider } from "@/components/ui/divider";
import { CustomButton } from "@/components/shared/CustomButton";
import IconLabelHeading from "@/components/shared/IconLabelHeading";
import { Icon } from "@/components/ui/icon";
import { Calendar } from "lucide-react-native";
import { CustomFormInput } from "@/components/shared/CustomFormInput";
import LinkedHealthSystemList from "@/components/shared/LinkedHealthSystemList";

export default function Allergies() {
  const { patient } = useContext(PatientContext);
  const [patientAllergy, setPatientAllergy] = useState<PatientAllergy[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCondition, setEditingCondition] = useState<
    PatientAllergy | undefined
  >(undefined);

  // for Alert while delete
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [allergyToDelete, setAllergyToDelete] = useState<PatientAllergy | null>(
    null
  );
  // Custom toast
  const showToast = useCustomToast();

  async function fetchAllergies() {
    if (!patient?.id) {
      logger.debug("No patient id found");
      return;
    }
    try {
      const allergies = await getPatientAllergiesByPatientId(patient.id);
      setPatientAllergy(allergies);
    } catch (e) {
      logger.debug(String(e));
    }
  }

  useEffect(() => {
    fetchAllergies();
  }, [patient]);

  // Add/Update allergy
  const handleAddUpdateAllergy = async (allergy: PatientAllergy) => {
    if (!patient?.id) return;
    if (allergy.id) {
      //  edit exsiting allergy
      await updatePatientAllergy(
        {
          topic: allergy.topic,
          severity: allergy.severity,
          details: allergy.details,
        },
        { id: allergy.id }
      );
      await fetchAllergies();
      showToast({
        title: "Allergy updated",
        description: "Allergy updated successfully!",
      });
    } else {
      // Add new allergy
      await createPatientAllergy({
        patient_id: patient.id,
        topic: allergy.topic,
        details: allergy.details,
        severity: allergy.severity,
      });
      await fetchAllergies();
      showToast({
        title: "Allergy deleted",
        description: "Allergy deleted successfully!",
      });
    }
  };

  const normalizedAllergies = patientAllergy.map((a) => ({
    ...a,
    linked_health_system: !!a.linked_health_system,
  }));

  const linkedAllergies = normalizedAllergies.filter(
    (a) => a.linked_health_system === true
  );
  const personalAllergies = normalizedAllergies.filter(
    (a) => !a.linked_health_system
  );

  // open edit form
  const handleEditAllergy = (allergy: PatientAllergy) => {
    setEditingCondition(allergy);
    setShowAddForm(true);
  };

  if (showAddForm) {
    return (
      <AddAllergyPage
        onClose={() => {
          setShowAddForm(false);
          setEditingCondition(undefined);
        }}
        handleAddUpdateAllergy={handleAddUpdateAllergy}
        editingCondition={editingCondition}
      />
    );
  }

  // Format date for display
  function getFormattedConditionDate(condition: PatientAllergy): string {
    const showUpdated =
      condition.updated_date &&
      condition.updated_date !== condition.created_date;
    const dateToShow = showUpdated
      ? condition.updated_date
      : condition.created_date;
    return dateToShow
      ? new Date(dateToShow)
          .toLocaleDateString("en-US", {
            month: "2-digit",
            day: "2-digit",
            year: "2-digit",
          })
          .replace(/\//g, "-")
      : "";
  }

  return (
    <SafeAreaView edges={["right", "top", "left"]} className="flex-1 bg-white">
      {/* Header */}
      <Header
        title="Allergies"
        right={
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-white font-medium">Cancel</Text>
          </TouchableOpacity>
        }
      />

      <View className="px-5 pt-5 flex-1">
        <View>
          <IconLabelHeading
            icon={require("@/assets/images/allergies.png")}
            label="Allergies (Linked Health System)"
            subtitle="Select ones to review with your care team"
            count={linkedAllergies.length}
          />
          <LinkedHealthSystemList data={linkedAllergies} titleKey="topic"/>
          <Divider className="bg-gray-300 my-3" />
        </View>
        
          <View className="flex-1">
            <IconLabelHeading
              icon={require("@/assets/images/allergies.png")}
              label="List your allergies"
              subtitle="Manage your personal allergy records"
              count={personalAllergies.length}
            />


            <View className="flex-1">
              <FlatList
                data={personalAllergies}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={true}
                showsVerticalScrollIndicator={true}
                renderItem={({ item }) => {
                  const formattedDate = getFormattedConditionDate(item);
                  return (
                    <View className="border border-gray-300 rounded-lg mb-3 px-3 py-3">
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center space-x-2">
                          <Text className="text-lg ml-3 max-w-[220px] text-left font-semibold">
                            {item.topic}
                          </Text>
                        </View>
                        <View className="flex-row">
                          <View className="flex-row items-center ">
                            <Icon
                              as={Calendar}
                              size="sm"
                              className="text-gray-600 mr-1"
                            />
                            <Text className="text-lg text-gray-700 mr-3">
                              {formattedDate}
                            </Text>
                          </View>

                          <ActionPopover
                            onEdit={() => {
                              handleEditAllergy(item);
                            }}
                            onDelete={() => {
                              setAllergyToDelete(item);
                              setShowAlertDialog(true);
                            }}
                          />
                        </View>
                      </View>
                      {item.details ? (
                        <View className="px-3 mt-1">
                          <Text className="text-lg text-gray-700">
                            {item.details}
                          </Text>
                        </View>
                      ) : null}
                      {item.severity ? (
                        <View className="px-3">
                          <Text className="text-base text-gray-700">
                            Severity:
                            <Text className="font-semibold">
                              {item.severity}
                            </Text>
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  );
                }}
                ListEmptyComponent={
                  <Text className="text-gray-500">No allergies found.</Text>
                }
                style={{ minHeight: 50 }}
              />
            </View>
          </View>
      
        <Divider className="bg-gray-300 " />

        <View className="py-5">
          <CustomButton
            title="Add Allergy"
            onPress={() => setShowAddForm(true)}
          />
        </View>
      </View>

      <CustomAlertDialog
        isOpen={showAlertDialog}
        onClose={() => setShowAlertDialog(false)}
        description={allergyToDelete?.topic}
        onConfirm={async () => {
          if (allergyToDelete) {
            await deletePatientAllergy(allergyToDelete.id);
            await fetchAllergies();
            showToast({
              title: "Allergy deleted",
              description: "Allergy has deleted successfully!",
            });
          }
          setShowAlertDialog(false);
          setAllergyToDelete(null);
        }}
      />
    </SafeAreaView>
  );
}

function AddAllergyPage({
  onClose,
  handleAddUpdateAllergy,
  editingCondition,
}: {
  onClose: () => void;
  handleAddUpdateAllergy: (allergy: PatientAllergy) => void;
  editingCondition?: PatientAllergy;
}) {
  const [topic, setTopic] = useState(editingCondition?.topic || "");
  const [details, setDetails] = useState(editingCondition?.details || "");

  const [severity, setSeverity] = useState<string | undefined>(
    editingCondition?.severity || ""
  );

  const isDisabled = topic.trim().length === 0;

  const handleSave = () => {
    if (isDisabled) return;
    handleAddUpdateAllergy({
      ...(editingCondition?.id ? { id: editingCondition.id } : {}),
      topic: topic.trim(),
      details: details.trim(),
      ...(severity ? { severity } : {}),
    } as PatientAllergy);
    onClose(); // Go back to list
  };

  return (
    <SafeAreaView edges={["right", "top", "left"]} className="flex-1 bg-white">
      {/* Header */}
      <Header
        title="Allergies"
        right={
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-white font-medium">Cancel</Text>
          </TouchableOpacity>
        }
        onBackPress={onClose}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        className="bg-white"
        behavior={"padding"}
      >
        <ScrollView
          className="px-5 pt-5 flex-1"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <IconLabelHeading
            icon={require("@/assets/images/allergies.png")}
            label={editingCondition ? "Update Allergy" : "Add Allergy"}
          />

          {/* Enter Topic */}
          <CustomFormInput
            className="mb-2"
            label="Enter Topic *"
            value={topic}
            onChangeText={setTopic}
            placeholder="e.g., Diabetes, Hypertension"
          />

          {/* Details */}
          <Text className="text-black mb-2 text-base">Details</Text>
          <Textarea
            size="md"
            isReadOnly={false}
            isInvalid={false}
            isDisabled={false}
            className="w-full"
          >
            <TextareaInput
              placeholder="Enter details"
              style={{ textAlignVertical: "top", fontSize: 16 }}
              value={details}
              onChangeText={setDetails}
            />
          </Textarea>

          {/* Severity */}
          <Text className="text-black text-base mb-2 mt-4">Severity *</Text>
          <View style={{ width: "100%", alignSelf: "flex-start" }}>
            <View
              className="flex-row border rounded-lg overflow-hidden mb-2"
              style={{ borderColor: palette.primary }}
            >
              {["Mild", "Moderate", "Severe"].map((level, idx) => (
                <TouchableOpacity
                  key={level}
                  style={{
                    flex: 1,
                    backgroundColor:
                      severity === level ? palette.primary : "white",
                    borderRightWidth: idx < 2 ? 1 : 0,
                    borderColor: palette.primary,
                    paddingVertical: 10,
                    paddingHorizontal: 1,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onPress={() => setSeverity(level)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={{
                      color: severity === level ? "white" : palette.primary,
                      fontWeight: "bold",
                    }}
                  >
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Save button */}
        <View className="p-5">
          <CustomButton
            title={editingCondition ? "Update" : "Save"}
            onPress={handleSave}
            disabled={isDisabled}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
