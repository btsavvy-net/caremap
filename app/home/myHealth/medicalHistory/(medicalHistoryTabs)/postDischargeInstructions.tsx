
import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Textarea, TextareaInput } from "@/components/ui/textarea";
import palette from "@/utils/theme/color";
import {
  createDischargeInstruction,
  getDischargeInstructionsByPatientId,
  updateDischargeInstruction,
  deleteDischargeInstruction,
} from "@/services/core/DischargeInstructionService";
import { PatientContext } from "@/context/PatientContext";
import { CustomAlertDialog } from "@/components/shared/CustomAlertDialog";
import Header from "@/components/shared/Header";
import ActionPopover from "@/components/shared/ActionPopover";
import { useCustomToast } from "@/components/shared/useCustomToast";
import { DischargeInstruction } from "@/services/database/migrations/v1/schema_v1";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { CalendarDaysIcon, Icon } from "@/components/ui/icon";
import { KeyboardAvoidingView, Platform } from "react-native";
import { logger } from "@/services/logging/logger";
import { router } from "expo-router";
import { Divider } from "@/components/ui/divider";
import { CustomButton } from "@/components/shared/CustomButton";
import { CustomFormInput } from "@/components/shared/CustomFormInput";
import IconLabelHeading from "@/components/shared/IconLabelHeading";

export default function PostDischargeInstructions() {
  const { patient } = useContext(PatientContext);
  const [patientDischargeInstructions, setPatientDischargeInstructions] =
    useState<DischargeInstruction[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<
    DischargeInstruction | undefined
  >(undefined);

  // for Alert while delete
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<DischargeInstruction | null>(
    null
  );

  // Custom toast
  const showToast = useCustomToast();

  async function fetchDischargeInstructions() {
    if (!patient?.id) {
      logger.debug("No patient id found");
      return;
    }
    try {
      const getDischargeInstructions =
        await getDischargeInstructionsByPatientId(patient.id);

      setPatientDischargeInstructions(getDischargeInstructions);
    } catch (e) {
      logger.debug(String(e));
    }
  }

  useEffect(() => {
    fetchDischargeInstructions();
  }, [patient]);

  // Add/Update
  const handleAddUpdate = async (discharge: DischargeInstruction) => {
    if (!patient?.id) return;
    if (discharge.id) {
      //  edit
      await updateDischargeInstruction(
        {
          summary: discharge.summary,
          discharge_date: discharge.discharge_date,
          details: discharge.details,
        },
        { id: discharge.id }
      );
      await fetchDischargeInstructions();
      showToast({
        title: "Discharge updated",
        description: "Discharge instruction updated successfully!",
      });
    } else {
      // Add
      await createDischargeInstruction({
        patient_id: patient.id,
        summary: discharge.summary,
        discharge_date: discharge.discharge_date,
        details: discharge.details,
      });
      await fetchDischargeInstructions();
      showToast({
        title: "Discharge added",
        description: "Discharge instruction added successfully!",
      });
    }
  };

  // open edit form
  const handleEditForm = (discharge: DischargeInstruction) => {
    setEditingItem(discharge);
    setShowForm(true);
  };

  if (showForm) {
    return (
      <AddUpdateFormPage
        onClose={() => {
          setShowForm(false);
          setEditingItem(undefined);
        }}
        handleAddUpdate={handleAddUpdate}
        editingItem={editingItem}
      />
    );
  }

  return (
    <SafeAreaView edges={["right", "top", "left"]} className="flex-1 bg-white">
      {/* Header */}
      <Header
        title="Post Discharge Instruction"
        right={
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-white font-medium">Cancel</Text>
          </TouchableOpacity>
        }
      />

      <View className="px-5 pt-5 flex-1">
        <View className="flex-1">
          <IconLabelHeading
            icon={require("@/assets/images/allergies.png")}
            label="Discharge Summary"
            subtitle="Details of your discharge summary."
            count={patientDischargeInstructions.length}
          />
          {/* Heading*/}

          <View className="flex-1">
            <FlatList
              data={patientDischargeInstructions}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={true}
              showsVerticalScrollIndicator={true}
              ListEmptyComponent={
                <Text className="text-gray-500">
                  No discharge instruction found.
                </Text>
              }
              style={{ minHeight: 50 }}
              renderItem={({ item }) => {
                return (
                  <View
                    className="border border-gray-300 rounded-lg mb-3 py-3 bg-white"
                    style={{ position: "relative" }}
                  >
                    {/* ActionPopover in top-right */}
                    <View
                      style={{
                        position: "absolute",
                        top: 10,
                        right: 8,
                        zIndex: 1,
                      }}
                    >
                      <ActionPopover
                        onEdit={() => handleEditForm(item)}
                        onDelete={() => {
                          setItemToDelete(item);
                          setShowAlertDialog(true);
                        }}
                      />
                    </View>
                    <View className="pl-4 pr-10">
                      {/* Procedure Name */}
                      <View className="flex-row justify-between items-start mb-2">
                        <Text
                          className="font-medium text-base"
                          // style={{ flex: 1 }}
                        >
                          Summary:
                        </Text>
                        <Text
                          className="font-normal text-base leading-5 text-gray-700"
                          style={{
                            flexShrink: 1,
                            // flexWrap: "wrap",
                            textAlign: "right",
                            maxWidth: 190,
                          }}
                          // numberOfLines={2}
                          // ellipsizeMode="tail"
                        >
                          {item.summary}
                        </Text>
                      </View>
                      {/* Date of discharge */}
                      <View className="flex-row justify-between items-start mb-2">
                        <Text className="font-medium text-base">
                          Date of discharge:
                        </Text>
                        <Text
                          className="font-normal text-base leading-5 text-gray-700"
                          style={{
                            flexShrink: 1,
                            textAlign: "right",
                            maxWidth: 180,
                          }}
                        >
                          {item.discharge_date
                            ? new Date(item.discharge_date)
                                .toLocaleDateString("en-US", {
                                  month: "2-digit",
                                  day: "2-digit",
                                  year: "numeric",
                                })
                                .replace(/\//g, "-")
                            : ""}
                        </Text>
                      </View>
                      {/* Details */}
                      {item.details ? (
                        <Text className="text-base text-gray-700 leading-5">
                          {item.details}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                );
              }}
            />
          </View>
        </View>

        <Divider className="bg-gray-300 mb-2" />

        {/* Add Button */}
        <View className="py-5">
          <CustomButton title="Add Details" onPress={() => setShowForm(true)} />
        </View>
      </View>

      <CustomAlertDialog
        isOpen={showAlertDialog}
        onClose={() => setShowAlertDialog(false)}
        description={itemToDelete?.summary}
        onConfirm={async () => {
          if (itemToDelete) {
            await deleteDischargeInstruction(itemToDelete.id);
            await fetchDischargeInstructions();
            showToast({
              title: "Discharge deleted",
              description: "Discharge instruction deleted successfully!",
            });
          }
          setShowAlertDialog(false);
          setItemToDelete(null);
        }}
      />
    </SafeAreaView>
  );
}

function AddUpdateFormPage({
  onClose,
  handleAddUpdate,
  editingItem,
}: {
  onClose: () => void;
  handleAddUpdate: (discharge: DischargeInstruction) => void;
  editingItem?: DischargeInstruction;
}) {
  const [dischargeSummary, setDischargeSummary] = useState(
    editingItem?.summary || ""
  );

  const [dateOfDischarge, setDateOfDischarge] = useState<Date | null>(
    editingItem?.discharge_date ? new Date(editingItem.discharge_date) : null
  );
  const [dischargeDesc, setDischargeDesc] = useState(
    editingItem?.details || ""
  );
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Helper to format date as MM-DD-YY
  const formatDate = (date: Date) => {
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    // const yy = String(date.getFullYear()).slice(-2);
    const yy = String(date.getFullYear());
    return `${mm}-${dd}-${yy}`;
  };

  const handleDateConfirm = (date: Date) => {
    setDateOfDischarge(date);
    setShowDatePicker(false);
  };

  const isDisabled = dischargeSummary.trim().length === 0 || !dateOfDischarge;

  const handleSave = () => {
    if (isDisabled) return;
    handleAddUpdate({
      ...(editingItem?.id ? { id: editingItem.id } : {}),
      summary: dischargeSummary.trim(),
      discharge_date: dateOfDischarge,
      details: dischargeDesc.trim(),
    } as DischargeInstruction);
  };

  return (
    <SafeAreaView edges={["right", "top", "left"]} className="flex-1 bg-white">
      {/* Header */}
      <Header
        title="Post Discharge Instruction"
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
        // behavior={Platform.OS === "ios" ? "padding" : "height"}
        behavior={"padding"}
        // keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <ScrollView
          className="px-5 pt-5 flex-1"
          contentContainerStyle={{
            paddingBottom: 30,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
        >
          <View className="flex-1">
            <IconLabelHeading
              icon={require("@/assets/images/allergies.png")}
              label={
                editingItem
                  ? "Update discharge summary"
                  : "Add discharge summary"
              }
              // subtitle="Please provide the details below"
            />

            {/* Discharge summary */}
            <CustomFormInput
              label="Summary *"
              value={dischargeSummary}
              onChangeText={setDischargeSummary}
              placeholder="Enter discharge summary"
            />
            {/* Date of discharge*/}
            <View className="mb-4">
              <Text className="  text-base mb-1">Date of discharge *</Text>
              <TouchableOpacity
                className="border border-gray-300 rounded-md px-3 py-3"
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
              >
                <View className="flex-row items-center">
                  <Text
                    className={`flex-1 text-base ${
                      dateOfDischarge ? "text-black" : "text-gray-500"
                    }`}
                  >
                    {dateOfDischarge ? formatDate(dateOfDischarge) : "MM-DD-YY"}
                  </Text>
                  <Icon
                    as={CalendarDaysIcon}
                    className="text-gray-500 w-5 h-5"
                  />
                </View>
              </TouchableOpacity>

              <DateTimePickerModal
                isVisible={showDatePicker}
                mode="date"
                onConfirm={handleDateConfirm}
                onCancel={() => setShowDatePicker(false)}
                // minimumDate={new Date()} // Prevent selecting past dates
              />
            </View>
            {/* Details */}
            <Text className=" mb-1 text-base">Description</Text>
            <Textarea
              size="md"
              isReadOnly={false}
              isInvalid={false}
              isDisabled={false}
              className="w-full"
            >
              <TextareaInput
                placeholder="Enter discharge details"
                style={{ textAlignVertical: "top", fontSize: 16 }}
                value={dischargeDesc}
                onChangeText={setDischargeDesc}
              />
            </Textarea>
          </View>
        </ScrollView>

        {/* Save button */}
        <View className="p-5">
          <CustomButton
            title={editingItem ? "Update" : "Save"}
            onPress={() => {
              handleSave();
              onClose(); // Go back to list
            }}
            disabled={isDisabled}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
