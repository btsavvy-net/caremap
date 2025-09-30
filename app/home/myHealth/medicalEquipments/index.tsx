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
import { ChevronLeft } from "lucide-react-native";
import palette from "@/utils/theme/color";
import Header from "@/components/shared/Header";
import { Divider } from "@/components/ui/divider";
import ActionPopover from "@/components/shared/ActionPopover";
import { SafeAreaView } from "react-native-safe-area-context";

import { PatientContext } from "@/context/PatientContext";
import { CustomAlertDialog } from "@/components/shared/CustomAlertDialog";
import { PatientEquipment } from "@/services/database/migrations/v1/schema_v1";
import {
  createPatientEquipment,
  deletePatientEquipment,
  getPatientEquipmentsByPatientId,
  updatePatientEquipment,
} from "@/services/core/PatientEquipmentService";
import { useCustomToast } from "@/components/shared/useCustomToast";
import { router } from "expo-router";
import { CustomButton } from "@/components/shared/CustomButton";
import IconLabelHeading from "@/components/shared/IconLabelHeading";
import { CustomFormInput } from "@/components/shared/CustomFormInput";
import { Textarea, TextareaInput } from "@/components/ui/textarea";

export default function MedicalEquipmentScreen() {
  const { patient } = useContext(PatientContext);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<PatientEquipment | null>(null);
  const [equipmentList, setEquipmentList] = useState<PatientEquipment[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<PatientEquipment | null>(
    null
  );
  const showToast = useCustomToast();

  useEffect(() => {
    if (patient?.id) {
      getPatientEquipmentsByPatientId(patient.id).then(setEquipmentList);
    }
  }, [patient]);

  const handleAddOrUpdate = async (data: {
    name: string;
    equipment_description: string;
  }) => {
    if (!patient?.id) return;

    if (editingItem) {
      const updated = await updatePatientEquipment(
        {
          equipment_name: data.name,
          equipment_description: data.equipment_description,
        },
        { id: editingItem.id }
      );
      if (updated) {
        await refreshEquipmentList();

        showToast({
          title: "Equipment Updated",
          description: `"${data.name}" was successfully updated.`,
          action: "success",
        });
      }
    } else {
      const created = await createPatientEquipment({
        patient_id: patient.id,
        equipment_name: data.name,
        equipment_description: data.equipment_description,
      });
      if (created) {
        await refreshEquipmentList();

        showToast({
          title: "Equipment Added",
          description: `"${data.name}" has been added.`,
          action: "success",
        });
      }
    }

    setShowForm(false);
    setEditingItem(null);
  };
  const refreshEquipmentList = async () => {
    if (patient?.id) {
      const updatedList = await getPatientEquipmentsByPatientId(patient.id);
      setEquipmentList(updatedList);
    }
  };
  if (showForm) {
    return (
      <MedicalEquipmentForm
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
        title="Medical Equipments"
        right={
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-white font-medium">Cancel</Text>
          </TouchableOpacity>
        }
      />

      <View className="pt-5 px-5 bg-white flex-1">
        <IconLabelHeading
          icon={require("@/assets/images/medical-equipment.png")}
          label="
          Essential medical equipment or devices"
          subtitle="Your devices or equipment that you rely on for 
          daily living"
          count={equipmentList.length}
        />

        {/* <View className="bmb-4" /> */}

        <FlatList
          data={equipmentList}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={true}
          renderItem={({ item }) => (
            <View className="flex-row items-start border border-gray-300 rounded-xl p-4 mb-4">
              <View className="ml-3 flex-1">
                <Text className="font-semibold text-lg">
                  {item.equipment_name}
                </Text>
                <Text className="text-gray-700 text-balance mt-1">
                  {item.equipment_description}
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
              No medical equipment found.
            </Text>
          }
        />

        <Divider className="bg-gray-300 " />

        
        <View className="py-5">
          <CustomButton
            title="Add medical equipment"
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
            ? `Are you sure you want to delete "${itemToDelete.equipment_name}"?`
            : "Are you sure you want to delete this item?"
        }
        confirmButtonProps={{
          style: { backgroundColor: palette.primary, marginLeft: 8 },
        }}
        onConfirm={async () => {
          if (itemToDelete) {
            await deletePatientEquipment(itemToDelete.id);
            setEquipmentList((prev) =>
              prev.filter((eq) => eq.id !== itemToDelete.id)
            );
            showToast({
              title: "Equipment Deleted",
              description: `"${itemToDelete.equipment_name}" has been removed.`,
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

function MedicalEquipmentForm({
  onClose,
  onSave,
  editingItem,
}: {
  onClose: () => void;
  onSave: (data: { name: string; equipment_description: string }) => void;
  editingItem?: PatientEquipment | null;
}) {
  const [name, setName] = useState(editingItem?.equipment_name || "");
  const [equipment_description, setEquipmentDescription] = useState(
    editingItem?.equipment_description || ""
  );

  const isSaveDisabled = !name.trim() || !equipment_description.trim();

  const handleSave = () => {
    if (!isSaveDisabled) {
      onSave({
        name: name.trim(),
        equipment_description: equipment_description.trim(),
      });
    }
  };

  return (
    <SafeAreaView edges={["right", "top", "left"]} className="flex-1 bg-white">
      <Header
        title="Medical Equipments"
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
            icon={require("@/assets/images/medical-equipment.png")}
            label={editingItem ? "Update Medical Equipment" : "Add Medical Equipment"}
            subtitle="Please provide the details below"
          />

          

          <CustomFormInput
            className="mb-2"
            label="Equipment Name"
            value={name}
            onChangeText={setName}
            placeholder="Enter equipment name"
          />

          {/* Details */}
          <Text className=" mb-2 text-base">Equipment Description</Text>
          <Textarea
            size="md"
            isReadOnly={false}
            isInvalid={false}
            isDisabled={false}
            className="w-full"
          >
            <TextareaInput
              placeholder="Enter equipment description"
              style={{ textAlignVertical: "top", fontSize: 16 }}
              value={equipment_description}
              onChangeText={setEquipmentDescription}
            />
          </Textarea>
        </ScrollView>

        {/* Button */}
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

