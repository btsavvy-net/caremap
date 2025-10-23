// components/LinkedAllergyList.tsx
import React from "react";
import { View, Text, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import palette from "@/utils/theme/color";

interface LinkedAllergyListProps<T> {
  data: T[];
  titleKey?: keyof T;     // e.g. "topic" | "goal_description" | "name"
  detailsKey?: keyof T;    // e.g. "details" | "target_date" | "description"
}

export function LinkedAllergyList<T extends { id: number | string; topic?: string; details?: string }>({
  data,
  titleKey,
  detailsKey,
}: LinkedAllergyListProps<T>) {
  return (
    <View>
      {/* List */}
      <FlatList
        data={data}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => {
          const title = titleKey ? String(item[titleKey]) : "";
          const details =
            detailsKey && item[detailsKey]
              ? String(item[detailsKey])
              : undefined;

          return (
            <View className="border border-gray-300 rounded-lg mb-3 px-3 py-3">
              {title || details ? (
                <View className="flex-row justify-between items-start">
                  <View className="flex-1 pr-2">
                    {title ? (
                      <Text className="text-md font-medium">
                        {title}
                      </Text>
                    ) : null}
                    {details ? (
                      <Text className="mt-1 text-gray-700">{details}</Text>
                    ) : null}
                  </View>
                  <Ionicons name="lock-closed" size={16} color={palette.primary} />
                </View>
              ) : (
                <Ionicons name="lock-closed" size={16} color={palette.primary} />
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <Text className="text-gray-500 text-base italic mt-2">
            No linked records found.
          </Text>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

export default LinkedAllergyList;
