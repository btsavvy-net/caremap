import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import palette from "@/utils/theme/color";
import Header from "@/components/shared/Header";
import { Divider } from "@/components/ui/divider";
import { useCustomToast } from "@/components/shared/useCustomToast";
import { PatientContext } from "@/context/PatientContext";
import { PatientMedication } from "@/services/database/migrations/v1/schema_v1";
import { CustomAlertDialog } from "@/components/shared/CustomAlertDialog";

import ActionPopover from "@/components/shared/ActionPopover";
import {
  createPatientMedication,
  getPatientMedicationsByPatientId,
  updatePatientMedication,
  deletePatientMedication,
} from "@/services/core/PatientMedicationService";
import { router } from "expo-router";
import { CustomButton } from "@/components/shared/CustomButton";
import IconLabelHeading from "@/components/shared/IconLabelHeading";
import { CustomFormInput } from "@/components/shared/CustomFormInput";
import { Textarea, TextareaInput } from "@/components/ui/textarea";
const linkedHealthSystem: string[] = [];
export default function MedicationsScreen() {
  const { patient } = useContext(PatientContext);
  const [medicationList, setMedicationList] = useState<PatientMedication[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<PatientMedication | null>(
    null
  );
  const [showDialog, setShowDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<PatientMedication | null>(
    null
  );
  const showToast = useCustomToast();

  useEffect(() => {
    if (patient?.id) {
      getPatientMedicationsByPatientId(patient.id).then(setMedicationList);
    }
  }, [patient]);

  const handleAddOrUpdate = async (data: { name: string; details: string }) => {
    if (!patient?.id) return;

    if (editingItem) {
      const updated = await updatePatientMedication(
        {
          name: data.name,
          details: data.details,
        },
        { id: editingItem.id }
      );
      if (updated) {
        await refreshCareList();
        showToast({
          title: "Updated",
          description: `\"${data.name}\" was updated successfully.`,
          action: "success",
        });
      }
    } else {
      const created = await createPatientMedication({
        patient_id: patient.id,
        name: data.name,
        details: data.details,
      });
      if (created) {
        await refreshCareList();
        showToast({
          title: "Added",
          description: `\"${data.name}\" was added successfully.`,
          action: "success",
        });
      }
    }

    setShowForm(false);
    setEditingItem(null);
  };

  const refreshCareList = async () => {
    if (patient?.id) {
      const updatedList = await getPatientMedicationsByPatientId(patient.id);
      setMedicationList(updatedList);
    }
  };

  if (showForm) {
    return (
      <MedicationForm
        onClose={() => {
          setShowForm(false);
          setEditingItem(null);
        }}
        onSave={handleAddOrUpdate}
        editingItem={editingItem}
      />
    );
  }

  return (
    <SafeAreaView edges={["right", "top", "left"]} className="flex-1 bg-white">
      <Header
        title="Medications"
        right={
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-white font-medium">Cancel</Text>
          </TouchableOpacity>
        }
      />

      <View className="px-5 pt-5 bg-white flex-1">
        {/* Add linked health system medications */}
        <IconLabelHeading
          icon={require("@/assets/images/medications.png")}
          label="Medications (Linked Health System)"
          subtitle="Medications imported from your linked health system"
          count={linkedHealthSystem.length}
        />

        <Divider className="bg-gray-300 my-2" />
        <IconLabelHeading
          icon={require("@/assets/images/medications.png")}
          label="List your active medications"
          subtitle="Manage your personal medication records"
          count={medicationList.length}
        />


        <FlatList
          data={medicationList}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={true}
          renderItem={({ item }) => (
            <View className="flex-row items-start border border-gray-300 rounded-xl p-4 mb-4">
              <View className="ml-3 flex-1">
                <Text className="font-semibold text-lg">{item.name}</Text>
                <Text className="text-gray-500 text-base mt-1">
                  {item.details}
                </Text>
              </View>

              <ActionPopover
                onEdit={() => {
                  setEditingItem(item);
                  setShowForm(true);
                }}
                onDelete={() => {
                  setItemToDelete(item);
                  setShowDialog(true);
                }}
              />
            </View>
          )}
          ListEmptyComponent={
            <Text className="text-gray-500 text-center my-4 text-lg">
              No Medication found.
            </Text>
          }
        />

        <Divider className="bg-gray-300 mb-2" />
        <View className="p-5">
          <CustomButton
            title="Add New Medication"
            onPress={() => setShowForm(true)}
          />
        </View>
      </View>

      <CustomAlertDialog
        isOpen={showDialog}
        onClose={() => {
          setShowDialog(false);
          setItemToDelete(null);
        }}
        title="Confirm Deletion"
        description={
          itemToDelete
            ? `Are you sure you want to delete \"${itemToDelete.name}\"?`
            : "Are you sure you want to delete this item?"
        }
        onConfirm={async () => {
          if (itemToDelete) {
            await deletePatientMedication(itemToDelete.id);
            setMedicationList((prev) =>
              prev.filter((eq) => eq.id !== itemToDelete.id)
            );
            showToast({
              title: "Deleted",
              description: `\"${itemToDelete.name}\" was removed successfully.`,
              action: "success",
            });
            setItemToDelete(null);
          }
          setShowDialog(false);
        }}
      />
    </SafeAreaView>
  );
}

function MedicationForm({
  onClose,
  onSave,
  editingItem,
}: {
  onClose: () => void;
  onSave: (data: { name: string; details: string }) => void;
  editingItem?: PatientMedication | null;
}) {
  const [name, setName] = useState(editingItem?.name || "");
  const [details, setGuidance] = useState(editingItem?.details || "");

  const isSaveDisabled = !name.trim() || !details.trim();

  const handleSave = () => {
    if (!isSaveDisabled) {
      onSave({
        name: name.trim(),
        details: details.trim(),
      });
    }
  };

  return (
    <SafeAreaView edges={["right", "top", "left"]} className="flex-1 bg-white">
      <Header
        title="Medications"
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
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <IconLabelHeading
            icon={require("@/assets/images/medications.png")}
            label={editingItem ? "Update Medication" : "Add Medication"}
            subtitle="Keep your medication records up to date"
          />

          <CustomFormInput
            className="mb-2"
            label="Medications name"
            value={name}
            onChangeText={setName}
            placeholder="Enter medication name"
          />

          <Text className="text-black mb-2 text-base">
            Medications details
          </Text>
          <Textarea
            size="md"
            isReadOnly={false}
            isInvalid={false}
            isDisabled={false}
            className="w-full"
          >
            <TextareaInput
              placeholder="Enter guidance steps"
              style={{ textAlignVertical: "top", fontSize: 16 }}
              value={details}
              onChangeText={setGuidance}
            />
          </Textarea>
        </ScrollView>
        <View className="p-5">
          <CustomButton
            title={editingItem ? "Update" : "Save"}
            disabled={isSaveDisabled}
            onPress={handleSave}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
