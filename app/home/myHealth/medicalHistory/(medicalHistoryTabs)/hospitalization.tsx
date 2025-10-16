
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
import { CalendarDaysIcon, Icon } from "@/components/ui/icon";
import { SafeAreaView } from "react-native-safe-area-context";

import { ChevronLeft } from "lucide-react-native";
import palette from "@/utils/theme/color";
import Header from "@/components/shared/Header";
import { Divider } from "@/components/ui/divider";
import ActionPopover from "@/components/shared/ActionPopover";
import { CustomAlertDialog } from "@/components/shared/CustomAlertDialog";
import { PatientContext } from "@/context/PatientContext";
import { useCustomToast } from "@/components/shared/useCustomToast";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Hospitalization as _Hospitalization } from "@/services/database/migrations/v1/schema_v1";
import {
  createHospitalization,
  deleteHospitalization,
  getHospitalizationsByPatientId,
  updateHospitalization,
} from "@/services/core/HospitalizationService";
import { router } from "expo-router";
import { CustomButton } from "@/components/shared/CustomButton";
import { Textarea, TextareaInput } from "@/components/ui/textarea";
import IconLabelHeading from "@/components/shared/IconLabelHeading";
import { CustomFormInput } from "@/components/shared/CustomFormInput";

export default function Hospitalization() {
  const { patient } = useContext(PatientContext);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<_Hospitalization | null>(null);
  const [hospitalizations, setHospitalizations] = useState<_Hospitalization[]>(
    []
  );
  const [showDialog, setShowDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<_Hospitalization | null>(
    null
  );
  const showToast = useCustomToast();

  useEffect(() => {
    if (patient?.id) {
      getHospitalizationsByPatientId(patient.id).then(setHospitalizations);
    }
  }, [patient]);

  const handleAddOrUpdate = async (data: {
    admission_date: Date;
    discharge_date: Date;
    details: string;
  }) => {
    if (!patient?.id) return;

    if (editingItem) {
      const updated = await updateHospitalization(
        {
          admission_date: data.admission_date,
          discharge_date: data.discharge_date,
          details: data.details,
        },
        { id: editingItem.id }
      );
      if (updated) {
        await refreshList();
        showToast({
          title: "Updated",
          description: "Hospitalization updated successfully.",
          action: "success",
        });
      }
    } else {
      const created = await createHospitalization({
        patient_id: patient.id,
        admission_date: data.admission_date,
        discharge_date: data.discharge_date,
        details: data.details,
      });
      if (created) {
        await refreshList();
        showToast({
          title: "Added",
          description: "Hospitalization added successfully.",
          action: "success",
        });
      }
    }

    setShowForm(false);
    setEditingItem(null);
  };

  const refreshList = async () => {
    if (patient?.id) {
      const updatedList = await getHospitalizationsByPatientId(patient.id);
      setHospitalizations(updatedList);
    }
  };

  if (showForm) {
    return (
      <HospitalizationForm
        onClose={() => {
          setShowForm(false);
          setEditingItem(null);
        }}
        onSave={handleAddOrUpdate}
        editingItem={editingItem}
      />
    );
  }

  function formatDisplayDate(date: Date | string | null | undefined): string {
    if (!date) return "";
    try {
      const d = new Date(date);
      return d
        .toLocaleDateString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "2-digit",
        })
        .replace(/\//g, "-");
    } catch (e) {
      return "";
    }
  }

  return (
    <SafeAreaView edges={["right", "top", "left"]} className="flex-1 bg-white">
      <Header
        title="Hospitalizations"
        right={
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-white font-medium">Cancel</Text>
          </TouchableOpacity>
        }
      />
      <View className="px-5 pt-5 bg-white flex-1">

        <IconLabelHeading
            icon={require("@/assets/images/hospitalization.png")}
            label="List your active hospitalizations"
            subtitle="Details of your hospitalization"
            count={hospitalizations.length}
          />
        
        {/* <View className="border-t border-gray-300 mb-4" /> */}

        <FlatList
          data={hospitalizations}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View className="flex-row items-start border border-gray-300 rounded-xl py-4 pl-4 pr-2 mb-4">
              <View className="flex-1">
                <View className="flex-row mb-2 flex-wrap justify-between mr-2">
                  <Text className="font-medium">Date of Admission:</Text>
                  <Text className="font-normal text-gray-700">
                    {formatDisplayDate(item.admission_date)}
                  </Text>
                </View>

                <View className="flex-row mb-2 flex-wrap justify-between mr-2">
                  <Text className="font-medium">Date of Discharge:</Text>
                  <Text className="font-normal text-gray-700">
                    {formatDisplayDate(item.discharge_date)}
                  </Text>
                </View>

                {item.details ? (
                  <Text className="text-gray-700 mt-1">{item.details}</Text>
                ) : null}
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
            <Text className="text-gray-500 text-center my-4">
              No hospitalizations found.
            </Text>
          }
        />

        <Divider className="bg-gray-300 mb-2" />
        <View className="py-5">
          <CustomButton
          title="Add Hospitalizations Details"
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
            ? `Are you sure you want to delete the hospitalization record?`
            : "Are you sure you want to delete this item?"
        }
        onConfirm={async () => {
          if (itemToDelete) {
            await deleteHospitalization(itemToDelete.id);
            await refreshList();
            showToast({
              title: "Deleted",
              description: "Record deleted.",
              action: "success",
            });
          }
          setShowDialog(false);
        }}
      />
    </SafeAreaView>
  );
}

function HospitalizationForm({
  onClose,
  onSave,
  editingItem,
}: {
  onClose: () => void;
  onSave: (data: {
    admission_date: Date;
    discharge_date: Date;
    details: string;
  }) => void;
  editingItem?: _Hospitalization | null;
}) {
  const [admission, setAdmission] = useState<Date | null>(
    editingItem?.admission_date || null
  );
  const [discharge, setDischarge] = useState<Date | null>(
    editingItem?.discharge_date || null
  );
  const [description, setDescription] = useState(editingItem?.details || "");

  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isSelectingAdmission, setIsSelectingAdmission] = useState(true);

  const showPicker = (isAdmission: boolean) => {
    setIsSelectingAdmission(isAdmission);
    setDatePickerVisibility(true);
  };
  const showToast = useCustomToast();

  const handleConfirm = (date: Date) => {
    if (isSelectingAdmission) {
      setAdmission(date);
    } else {
      setDischarge(date);
    }
    setDatePickerVisibility(false);
  };

  const formatDate = (date: Date) => {
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    // const yy = String(date.getFullYear()).slice(-2);
    const yy = String(date.getFullYear());
    return `${mm}-${dd}-${yy}`;
  };
  const isDisabled = !admission || !discharge || !description.trim();

  return (
    <SafeAreaView edges={["right", "top", "left"]} className="flex-1 bg-white">
      <Header
        title="Hospitalizations"
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
            icon={require("@/assets/images/hospitalization.png")}
            label={editingItem ? "Update hospitalization details" : "Add hospitalization details"}
            // subtitle="Please provide the details below"
          />

          

          <View className="mb-4">
            <Text className="text-base mb-1 text-black">
              Date of Admission *
            </Text>
            <TouchableOpacity
              className="border border-gray-300 rounded-md px-3 py-3"
              onPress={() => showPicker(true)}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center">
                <Text
                  className={`flex-1 text-base ${
                    admission ? "text-gray-800" : "text-gray-500"
                  }`}
                >
                  {admission ? formatDate(admission) : "MM-DD-YYYY"}
                </Text>
                <Icon as={CalendarDaysIcon} className="text-gray-500 w-5 h-5" />
              </View>
            </TouchableOpacity>
          </View>

          <View className="mb-4">
            <Text className="text-base mb-1 text-black">
              Date of Discharge *
            </Text>
            <TouchableOpacity
              className="border border-gray-300 rounded-md px-3 py-3"
              onPress={() => showPicker(false)}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center">
                <Text
                  className={`flex-1 text-base ${
                    discharge ? "text-black" : "text-gray-500"
                  }`}
                >
                  {discharge ? formatDate(discharge) : "MM-DD-YYYY"}
                </Text>
                <Icon as={CalendarDaysIcon} className="text-gray-500 w-5 h-5" />
              </View>
            </TouchableOpacity>
          </View>

          <DateTimePickerModal
            isVisible={isDatePickerVisible}
            mode="date"
            onConfirm={handleConfirm}
            onCancel={() => setDatePickerVisibility(false)}
            maximumDate={isSelectingAdmission ? new Date() : undefined}
            minimumDate={
              !isSelectingAdmission && admission ? admission : undefined
            }
          />

          <Text className="text-base mb-1 text-black mt-2">Description *</Text>
          <Textarea
            size="lg"
            isReadOnly={false}
            isInvalid={false}
            isDisabled={false}
            className="w-full"
          >
            <TextareaInput
              placeholder="Enter hospitalization details"
              textAlignVertical="top"
              value={description}
              onChangeText={setDescription}
            />
          </Textarea>
        </ScrollView>
        <View className="p-5">
          <CustomButton
            title={editingItem ? "Update" : "Add"}
            disabled={isDisabled}
            onPress={() => {
              if (!isDisabled && admission && discharge) {
                if (discharge < admission) {
                  showToast({
                    title: "Error",
                    description:
                      "Discharge date cannot be before admission date.",
                    action: "warning",
                  });
                  return;
                }

                onSave({
                  admission_date: admission,
                  discharge_date: discharge,
                  details: description.trim(),
                });
              }
            }}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
