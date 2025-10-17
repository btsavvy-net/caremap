import { View, Text, Image, TouchableOpacity } from "react-native";
import { Divider } from "@/components/ui/divider";
// import { Badge, BadgeText } from "@/components/ui/badge";
import { SafeAreaView } from "react-native-safe-area-context";
import { Route, router } from "expo-router";
import { ROUTES } from "@/utils/route";
import Header from "@/components/shared/Header";
import palette from "@/utils/theme/color";

function medicalOverview() {
  const medicalTiles = [
    {
      name: "Snapshot",
      count: "3",
      icon: require("@/assets/images/snapshot.png"),
      link: ROUTES.SNAPSHOT,
    },
    {
      name: "Medical Conditions",
      count: "2",
      icon: require("@/assets/images/medical-condition.png"),
      link: ROUTES.MEDICAL_CONDITIONS,
    },
    

    
  ];

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Header title=" Medical Overview" 
      right={
                      <TouchableOpacity onPress={() => router.back()}>
                        <Text className="text-white font-medium">Cancel</Text>
                      </TouchableOpacity>
                    }
                    />

      <View className="p-4">
        <View className=" rounded-lg">
          {medicalTiles.map((tile, index) => (
            <View key={index}>
              <TouchableOpacity
                className="flex-row items-center justify-between p-4"
                onPress={() => router.push(tile.link as Route)}
              >
                <View className="flex-row items-center">
                  <Image
                    source={tile.icon}
                    className="w-8 h-8 mr-4"
                    resizeMode="contain"
                  />
                  <Text className="text-lg">{tile.name}</Text>
                </View>

                <View className="flex-row items-center">
                  {/* {tile.count && (
                    <Badge
                   style={{ backgroundColor: palette.primary }}
                     className="rounded-full mr-2">
                      <BadgeText className="text-white">{tile.count}</BadgeText>
                    </Badge>
                  )} */}
                  <Image
                    source={require("@/assets/images/arrow.png")}
                    className="w-4 h-4"
                    resizeMode="contain"
                  />
                </View>
              </TouchableOpacity>

              {index < medicalTiles.length - 1 && (
                <Divider className="bg-gray-300 h-px" />
              )}
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

export default medicalOverview;
