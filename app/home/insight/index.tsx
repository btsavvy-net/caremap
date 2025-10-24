import React, { useContext, useState, useEffect } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import moment from "moment";

import { PatientContext } from "@/context/PatientContext";
import Header from "@/components/shared/Header";
import TrackCalendar from "@/components/shared/track-shared-components/TrackCalender";
import { LineChart } from "react-native-gifted-charts";
import { Spinner } from "@/components/ui/spinner";
import insightsConfig from "@/services/config/insights.json";
import { router } from "expo-router";
import { Divider } from "@/components/ui/divider";
import { getAllDateBasedInsights } from "@/services/core/InsightsService";
import { logger } from "react-native-reanimated/lib/typescript/logger";
import palette from "@/utils/theme/color";
import { black, white } from "tailwindcss/colors";

export default function InsightScreen() {
  const { patient } = useContext(PatientContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allInsightsData, setAllInsightsData] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(moment());

  const formatDate = (date: moment.Moment): string => date.format("MM-DD-YYYY");

  useEffect(() => {
    if (patient?.id) fetchAllInsights();
  }, [selectedDate, patient?.id]);

  const fetchAllInsights = async () => {
    if (!patient?.id) {
      setError("No patient data available");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const formattedDate = selectedDate.format("YYYY-MM-DD");

      const allData = await getAllDateBasedInsights(
        patient.id.toString(),
        formattedDate
      );

      const enhancedData = allData.map((insight: any) => {
        const config = insightsConfig.find(
          (cfg) => cfg.insightKey === insight.insightKey
        );
        return {
          ...insight,
          insightName: config?.insightName || "Insight",
        };
      });

      setAllInsightsData(enhancedData);
    } catch (err) {
      console.error("Error fetching insights:", err);
      setError("Failed to fetch insights");
    } finally {
      setLoading(false);
    }
  };

  const renderChart = (series: any, insightName: string, index: number) => {
    if (!series?.data?.length) {
      return (
        <View
          key={`${insightName}-${series?.topic || "no-data"}-${index}`}
          className="mb-2 "
        >
          <Text className="text-lg font-bold mb-2 text-gray-800">
            {insightName}: {series?.topic || "No Data"}
          </Text>
          <View className="p-4 bg-gray-100 rounded-lg">
            <Text className="text-gray-600">
              No data available for this insight
            </Text>
          </View>
        </View>
      );
    }

    const chartData = series.data.map((point: any) => ({
      value: point.value,
      label: point.label,
    }));
  
const maxY = Math.ceil(Math.max(...chartData.map((d:any) => d.value)) / 10) * 10;

    return (
      <View
  key={`${insightName}-${series.topic || "topic"}-${index}`}
  className="mb-4 bg-white p-3 rounded-lg shadow-sm"
>
  <Text className="text-lg font-semibold mb-2 text-gray-800">
    {series.topic}
  </Text>
  <LineChart
    areaChart
    data={chartData}
    height={140}
    // rotateLabel
    width={300}
    spacing={60}
    
    color={palette.primary}
    thickness={2}
    //  maxValue={10}
    hideDataPoints={false}
    startFillColor={palette.primary}
    endFillColor={palette.fill}
    startOpacity={0.9}
    endOpacity={0.2}
    initialSpacing={15}
    noOfSections={4}
    yAxisColor="transparent"
    yAxisThickness={0}
    rulesType="dotted"
    rulesColor="lightgray"
    yAxisTextStyle={{ color: black }}
    // yAxisSide="right"
    xAxisColor="lightgray"
    xAxisLabelTextStyle={{ color: black, fontSize: 11 }}
    pointerConfig={{
      pointerStripHeight: 140,
      pointerStripColor: palette.gray300,
      pointerStripWidth: 2,
      pointerColor: palette.secondary,
      radius: 5,
      pointerLabelWidth: 100,
      pointerLabelHeight: 90,
      activatePointersOnLongPress: true,
      autoAdjustPointerLabelPosition: false,
      pointerLabelComponent: (items:any) => {
        return (
          <View
            style={{
              
              height: 90,
              width: 50,
              justifyContent: "center",
              // marginTop: -30,
              marginLeft: -15,
            }}
          >
            <Text
              style={{
                color: palette.secondary,
                fontSize: 13,
                fontWeight: "700",
                marginBottom: 6,
                textAlign: "center",
              }}
            >
              {items[0].label}
            </Text>

            <View
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 12,
                backgroundColor: palette.primary,
              }}
            >
              <Text
                style={{
                  fontWeight: "bold",
                  textAlign: "center",
                  color: white,
                }}
              >
                {items[0].value}
              </Text>
            </View>
          </View>
        );
      },
    }}
  />
</View>

    );
  };

  return (
    <SafeAreaView edges={["right", "top", "left"]} className="flex-1 bg-white">
      <Header
        title="Insights"
        right={
          <TouchableOpacity
            onPress={() => router.back()}
          >
            <Text className="text-white font-medium">Cancel</Text>
          </TouchableOpacity>
        }
      />

     

      {/* ✅ Calendar */}
      <View className="overflow-hidden">
        <TrackCalendar
          selectedDate={selectedDate}
          onDateSelected={(date) => setSelectedDate(date)}
        />
      </View>

      {error && (
        <View className="mb-4 p-3 mx-4 bg-red-100 rounded-lg">
          <Text className="text-red-700 text-center">{error}</Text>
        </View>
      )}

      {loading && (
        <View className="items-center justify-center py-4">
          <Spinner size="large" />
        </View>
      )}

      <ScrollView
        className="flex-1 bg-white"
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
      >
        {allInsightsData && allInsightsData.length > 0 ? (
          <View className="mt-2">
            {allInsightsData.map((insightData: any, idx: number) => (
              <View key={`${insightData.insightKey || "insight"}-${idx}`}>
                {insightData.series && insightData.series.length > 0 ? (
                  insightData.series.map((series: any, i: number) =>
                    renderChart(series, insightData.insightName, i)
                  )
                ) : (
                  <View className="p-4 bg-gray-100 rounded-lg">
                    <Text className="text-gray-600">
                      No data available for this insight
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        ) : (
          !loading && (
            <View className="mt-4 p-4 bg-gray-100 rounded-lg mx-4">
              <Text className="text-center text-gray-600">
                No insights data available for {formatDate(selectedDate)}
              </Text>
            </View>
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
