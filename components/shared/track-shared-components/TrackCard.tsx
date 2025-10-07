import palette from "@/utils/theme/color";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import {
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionTrigger,
  AccordionTitleText,
  AccordionContent,
  AccordionContentText,
  AccordionIcon,
} from "@/components/ui/accordion";
import { ChevronDownIcon, ChevronUpIcon } from "@/components/ui/icon";

interface TrackCardProps {
  item_id: number;
  entry_id: number;
  item_name: string;
  completed: number;
  total: number;
  date: string; // formatted date string
  summaries: string[];
}

export default function TrackCard({
  item_id,
  entry_id,
  item_name,
  completed,
  total,
  date,
  summaries,
}: TrackCardProps) {
  const router = useRouter();
  const hasAnswers = total > 0 && completed > 0 && summaries.length > 0;

  const handleOpenQuestions = () => {
    router.push({
      pathname: "/home/track/questions/[itemId]",
      params: {
        itemId: item_id.toString(),
        itemName: item_name,
        entryId: entry_id.toString(),
        date,
      },
    });
  };

  // If no answers yet, show Begin button
  if (!hasAnswers) {
    return (
      <View
        className="rounded-xl px-4 py-5 mb-4 "
        style={{ backgroundColor: palette.trackCardBackground,
    // iOS shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    // Android shadow
    elevation: 4, }}
      >
        <View className="flex-row justify-between md-2">
          <Text
            style={{
              fontSize: 16,
              color: palette.secondary,
              marginBottom: 10,
              fontWeight: "600",
            }}
          >
            {item_name}
          </Text>
          <Text className="">Weekly</Text>
        </View>

        <TouchableOpacity
          onPress={handleOpenQuestions}
          activeOpacity={0.8}
          style={{ backgroundColor: palette.primary }}
          className="py-3 rounded-lg items-center"
        >
          <Text className="text-white font-bold">Begin</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // If answers exist, use Accordion
  return (
    <Accordion
      size="md"
      variant="filled"
      type="single"
      isCollapsible={true}
       defaultValue={[`track-${item_id}`]}
        className="rounded-xl mb-4" // 👈 add margin here
      style={{ backgroundColor: palette.trackCardBackground }}
    >
      <AccordionItem
        value={`track-${item_id}`}
        style={{ backgroundColor: palette.trackCardBackground }}
      >
        <AccordionHeader>
          <AccordionTrigger>
            {({ isExpanded }: { isExpanded: boolean }) => (
              <View className=" flex-row items-center justify-between w-full">
                {/* Tappable card title opens questions */}
                <TouchableOpacity
                  onPress={handleOpenQuestions}
                  activeOpacity={0.7}
                  className="flex-1 pr-2"
                >
                  <AccordionTitleText
                    className="text-lg font-semibold"
                    style={{ color: palette.secondary }}
                  >
                    {item_name}
                  </AccordionTitleText>
                </TouchableOpacity>

                {/* Arrow only toggles accordion */}
                <AccordionIcon
                  as={isExpanded ? ChevronUpIcon : ChevronDownIcon}
                  className="ml-2"
                />
              </View>
            )}
          </AccordionTrigger>
        </AccordionHeader>

        <AccordionContent>
          <AccordionContentText>
            <View>
              {summaries.map((s, i) => (
                <View key={i} className="mb-2">
                  <Text className="text-sm text-gray-700">• {s}</Text>
                </View>
              ))}
            </View>
          </AccordionContentText>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
