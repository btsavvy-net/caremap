import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Badge, BadgeText } from "@/components/ui/badge";
import { Box } from "@/components/ui/box";
import { Divider } from "@/components/ui/divider";
import { EditIcon, Icon, ShareIcon } from "@/components/ui/icon";
import { PatientContext } from "@/context/PatientContext";
import { UserContext } from "@/context/UserContext";
import { initializeAuthSession } from "@/services/auth-service/google-auth";
import { syncPatientSession } from "@/services/auth-service/session-service";
import { ShowAlert } from "@/services/common/ShowAlert";
import { calculateAge } from "@/services/core/utils";
import { startFhirSync } from "@/services/fhir-service/fhir-sync-manager";
import { logger } from "@/services/logging/logger";
import { ROUTES } from "@/utils/route";
import palette from "@/utils/theme/color";
import { Route, router } from "expo-router";
import { User } from "lucide-react-native";
import { useContext, useEffect, useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HealthProfile() {
  const { user, setUserData } = useContext(UserContext);
  const { patient, setPatientData } = useContext(PatientContext);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (!patient) return;
    startFhirSync(patient);
  }, [patient]);

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
      image: require("@/assets/images/hospitalization.png"),
      badge: 4,
      link: ROUTES.NOTES,
    },
    {
      name: "Test 1",
      image: require("@/assets/images/medicalOverview.png"),
      badge: 6,
      link: ROUTES.MEDICAL_OVERVIEW,
    },
    {
      name: "Test 2",
      image: require("@/assets/images/emergencyCare.png"),
      badge: 9,
      link: ROUTES.MEDICAL_OVERVIEW,
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
    <SafeAreaView className="flex-1 m-0">
      <View style={{ backgroundColor: palette.primary }} className="py-4 px-6 ">
        <Text className="text-xl text-white font-bold text-center ">
          My Health
        </Text>

        <View className="flex-row items-center justify-between">
          <Avatar size="xl">
            {patient?.profile_picture ? (
              <AvatarImage source={{ uri: patient.profile_picture }} />
            ) : (
              <View className="w-full h-full items-center justify-center bg-gray-200 rounded-full">
                <Icon as={User} size="xl" className="text-gray-500" />
              </View>
            )}
          </Avatar>

          <View className="mr-4">
            <Text className="text-lg text-white font-semibold">
              {`${patient?.first_name} ${patient?.last_name}`}
            </Text>
            <Text className="text-white">
              Age:{" "}
              {calculateAge(patient?.date_of_birth)
                ? `${calculateAge(patient?.date_of_birth)} years`
                : "Not set"}
            </Text>
            <Text className="text-white">
              Weight:{" "}
              {patient?.weight
                ? `${patient.weight} ${patient.weight_unit ?? ""}`
                : "Not set"}
            </Text>
          </View>
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.push(ROUTES.EDIT_PROFILE)}>
              <Icon as={EditIcon} size="lg" className="text-white m-2" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push(ROUTES.EDIT_PROFILE)}>
              <Icon as={ShareIcon} size="lg" className="text-white m-2" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View className="px-5 py-1">
        <View>
          {Array.from({ length: Math.ceil(medicalTiles.length / 2) }).map(
            (_, rowIndex) => (
              <View key={rowIndex}>
                <View className="flex-row">
                  {[0, 1].map((colIndex) => {
                    const tileIndex = rowIndex * 2 + colIndex;
                    if (tileIndex >= medicalTiles.length) return null;
                    const tile = medicalTiles[tileIndex];
                    return (
                      <TouchableOpacity
                        onPress={() => router.push(tile.link as Route)}
                        key={tileIndex}
                        className="flex-1
                         
                         items-center"
                      >
                        <View className="p-10 flex-row items-center justify-stretch">
                          <Box className="items-center w-[125px]">
                            <Image source={tile.image} resizeMode="contain" />
                            {tile.badge !== null && (
                              <Badge
                                style={{ backgroundColor: palette.primary }}
                                className="absolute -top-1 -right-1 rounded-full z-10 h-[22px] w-[22px]"
                              >
                                <BadgeText className="text-xs text-white">
                                  {tile.badge}
                                </BadgeText>
                              </Badge>
                            )}
                            <Text className="text-center text-base flex-shrink pt-2">
                              {tile.name}
                            </Text>
                          </Box>
                          <Box>
                            <Image
                              source={require("@/assets/images/arrow.png")}
                              className="w-4 h-4 ml-2"
                              resizeMode="contain"
                            />
                          </Box>
                        </View>
                        {colIndex === 0 && tileIndex % 2 === 0 && (
                          <View className="absolute right-0 top-0 bottom-0 w-px bg-black" />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {rowIndex < Math.ceil(medicalTiles.length / 2) - 1 && (
                  <Divider className="bg-black" />
                )}
              </View>
            )
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
