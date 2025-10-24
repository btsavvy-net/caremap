import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Box } from "@/components/ui/box";
import { Divider } from "@/components/ui/divider";
import { EditIcon, Icon, ShareIcon } from "@/components/ui/icon";
import { PatientContext } from "@/context/PatientContext";
import { UserContext } from "@/context/UserContext";
import { initializeAuthSession } from "@/services/auth-service/google-auth";
import { syncPatientSession } from "@/services/auth-service/session-service";
import { ShowAlert } from "@/services/common/ShowAlert";
import { calculateAge } from "@/services/core/utils";
import { PDFExportService } from "@/services/core/PDFExportService";
import { logger } from "@/services/logging/logger";
import { ROUTES } from "@/utils/route";
import palette from "@/utils/theme/color";
import { Route, router } from "expo-router";
import { Camera, User } from "lucide-react-native";
import { useContext, useEffect, useState } from "react";
import { Image, Text, TouchableOpacity, View, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Grid, GridItem } from "@/components/ui/grid";

export default function HealthProfile() {
  const { user, setUserData } = useContext(UserContext);
  const { patient, setPatientData } = useContext(PatientContext);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const COLUMNS = 2 as const;
  const gridColsClass = "grid-cols-2";
  useEffect(() => {
    initializeAuthSession(setUserData).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const sync = async () => {
      try {
        if (!user) return;
        const patientData = await syncPatientSession(user);
        setPatientData(patientData);
      } catch (err) {
        logger.debug("Failed to sync patient session:", err);
        return ShowAlert("e", `Failed to sync patient data.`);
      } finally {
        setLoading(false);
      }
    };

    sync();
  }, [user]);

  const handleExportPatientData = async () => {
    if (!patient || isExporting) return;

    setIsExporting(true);
    try {
      await PDFExportService.exportPatientDataToPDF(patient.id);
    } catch (error) {
      console.error("Error exporting patient data:", error);
      ShowAlert("e", "Failed to export health report. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const medicalTiles = [
    {
      name: "Medical overview",
      image: require("@/assets/images/medicalOverview.png"),
      badge: 5,
      link: ROUTES.MEDICAL_OVERVIEW,
    },
    {
      name: "Emergency Care",
      image: require("@/assets/images/emergencyCare.png"),
      badge: 3,
      link: ROUTES.EMERGENCY_CARE,
    },
    {
      name: "Allergies",
      image: require("@/assets/images/allergies.png"),
      badge: 2,
      link: ROUTES.ALLERGIES,
    },
    {
      name: "Medications",
      image: require("@/assets/images/medications.png"),
      badge: 6,
      link: ROUTES.MEDICATIONS,
    },
    {
      name: "Medical History",
      image: require("@/assets/images/medical-history.png"),
      badge: 1,
      link: ROUTES.MEDICAL_HISTORY,
    },
    {
      name: "Notes",
      image: require("@/assets/images/notes.png"),
      badge: 4,
      link: ROUTES.NOTES,
    },
    {
      name: "Medical Equipments",
      image: require("@/assets/images/medical-equipment.png"),
      badge: 4,
      link: ROUTES.MEDICAL_EQUIPMENTS,
    },
    {
      name: "High level Goals",
      image: require("@/assets/images/highLevelGoals.png"),
      badge: 4,
      link: ROUTES.HIGH_LEVEL_GOALS,
    },
    
  ];
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-lg">Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-lg">Not logged in</Text>
      </View>
    );
  }

  return (
   <SafeAreaView
      edges={["right", "top", "left"]}
      className="flex-1 m-0 bg-white"
    >
      <View
        style={{ backgroundColor: palette.primary }}
        className="pt-3 pb-4 px-6"
      >
        {/* Top row: Title + actions */}
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl text-white font-semibold ml-2 tracking-wide">
            My Health
          </Text>
          <View className="flex-row items-center">
            <TouchableOpacity
              className="p-2 mr-"
              onPress={() => router.push(ROUTES.EDIT_PROFILE)}
              accessibilityLabel="Edit profile"
            >
              <Icon as={EditIcon} size="lg" className="text-white" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleExportPatientData} disabled={isExporting || !patient}>
            {isExporting ? (
              <ActivityIndicator size="small" color="white" style={{ margin: 8 }} />
            ) : (
              <Icon as={ShareIcon} size="lg" className="text-white m-2" />
            )}
          </TouchableOpacity>
          </View>
        </View>
 
        {/* User row: Avatar + details */}
        <View className="mt-4 flex-row items-center">
          <Avatar className="border border-white/60 bg-white/10 w-20 h-20">
            {patient?.profile_picture ? (
              <AvatarImage source={{ uri: patient.profile_picture }} />
            ) : (
              <View className="w-full h-full items-center justify-center rounded-full">
                <Icon as={User} className="text-white/90 w-9 h-9" />
              </View>
            )}
          </Avatar>
 
          <View className="ml-4 flex-1">
            <Text
              className="text-white text-xl font-semibold"
              numberOfLines={1}
            >
              {`${patient?.first_name ?? ""} ${
                patient?.last_name ?? ""
              }`.trim() || "Your name"}
            </Text>
 
            <Text className="text-white font-semibold mt-1">
              Age:{" "}
              {calculateAge(patient?.date_of_birth)
                ? `${calculateAge(patient?.date_of_birth)} years`
                : "Not set"}
            </Text>
            <Text className="text-white font-semibold">
              Weight:{" "}
              {patient?.weight
                ? `${patient.weight} ${patient.weight_unit ?? ""}`
                : "Not set"}
            </Text>
          </View>
        </View>
      </View>

      {/* --- Tiles Grid (gluestack Grid) --- */}
      <ScrollView
        className="bg-white flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <Box className="flex-1 p-2">
          <View className=" overflow-hidden bg-white">
            <Grid className="gap-0" _extra={{ className: gridColsClass }}>
              {medicalTiles.map((tile, index) => {
                const isLastOdd =
                  medicalTiles.length % COLUMNS === 1 &&
                  index === medicalTiles.length - 1;

                return (
                  <GridItem
                    key={tile.name + index}
                    className={`items-stretch justify-stretch`}
                    _extra={{
                      className: isLastOdd ? "col-span-2" : "col-span-1",
                    }}
                  >
                    <TouchableOpacity
                      activeOpacity={0.65}
                      onPress={() => router.push(tile.link as any)}
                      style={{
                        margin: 8,
                        backgroundColor: "white",
                        borderRadius: 6,
                        minHeight: 125,
                        // ✅ Cross-platform shadow
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.35,
                        shadowRadius: 3.84,
                        elevation: 4,
                      }}
                      className="items-center justify-center"
                    >
                      <View className="relative">
                        <Image
                          source={tile.image}
                          style={{ width: 50, height: 50 }}
                          resizeMode="contain"
                        />
                      </View>

                      <Text
                        style={{ color: palette.heading }}
                        className="mt-3 text-lg font-semibold text-center"
                      >
                        {tile.name}
                      </Text>
                    </TouchableOpacity>
                  </GridItem>
                );
              })}
            </Grid>
          </View>
        </Box>
      </ScrollView>
    </SafeAreaView>
  );
}