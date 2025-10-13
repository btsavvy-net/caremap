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

export default function DateBasedInsightScreen() {
  const { patient } = useContext(PatientContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allInsightsData, setAllInsightsData] = useState<any[]>([]);

  const [selectedDate, setSelectedDate] = useState(moment());

  const formatDate = (date: moment.Moment): string => {
    return date.format("MM-DD-YYYY");
  };

  useEffect(() => {
    if (patient?.id) {
      fetchAllInsights();
    }
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

      console.debug("All insights data:", JSON.stringify(allData, null, 2));

      const enhancedData = allData.map((insight: any) => {
        const config = insightsConfig.find(
          (cfg) => cfg.insightKey === insight.insightKey
        );
        return {
          ...insight,
          insightName: config?.insightName || "Unknown Insight",
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

  const renderChart = (series: any, insightName: string) => {
    if (!series?.data?.length) {
      return (
        <View key={`${series?.topic || "no-data"}`} className="mb-4">
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

    return (
      <View key={`${series.topic}`} className="mb-4">
        <Text className="text-lg font-bold mb-2">{series.topic}</Text>
        <LineChart
          data={chartData}
          height={220}
          width={Dimensions.get("window").width - 32}
          color1="#0077FF"
          thickness={3}
          noOfSections={4}
          areaChart
          hideDataPoints={false}
          startFillColor={"rgba(0,119,255,0.3)"}
          endFillColor={"rgba(0,119,255,0.05)"}
          startOpacity={1}
          endOpacity={0.3}
          yAxisTextStyle={{ color: "#777" }}
          xAxisLabelTextStyle={{ color: "#777", fontSize: 12 }}
          rulesType="solid"
          rulesColor="rgba(0,0,0,0.1)"
        />
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Header
        title="Insights"
        right={
          <TouchableOpacity
            onPress={() => router.back()}
            className="px-3 py-2"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text className="text-white font-medium">Cancel</Text>
          </TouchableOpacity>
        }
      />

      <View className="px-2">
        <Divider className="bg-gray-300" />
      </View>

      {/* ✅ Calendar Section */}
        <View className=" overflow-hidden ">
          <TrackCalendar
            selectedDate={selectedDate}
            onDateSelected={(date) => setSelectedDate(date)}
          />
        </View>

      {/* Error */}
      {error && (
        <View className="mb-4 p-3 mx-4 bg-red-100 rounded-lg">
          <Text className="text-red-700 text-center">{error}</Text>
        </View>
      )}

      {/* Loading */}
      {loading && (
        <View className="items-center justify-center py-4">
          <Spinner size="large" />
        </View>
      )}

      {/* Insights */}
      <ScrollView
        className="flex-1 bg-white"
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
      >
        {allInsightsData && allInsightsData.length > 0 ? (
          <View className="mt-2">
            {allInsightsData.map((insightData: any) => (
              <View
                key={`${insightData.insightKey}-${selectedDate.toISOString()}`}
                className="mb-6 p-3 bg-gray-50 rounded-lg shadow-sm"
              >
                <Text className="text-base font-semibold mb-3 text-gray-800">
                  {insightData.insightName}
                </Text>

                {insightData.series && insightData.series.length > 0 ? (
                  insightData.series.map((series: any) => (
                    <View
                      key={`${insightData.insightKey}-${series.topic}`}
                      className="mb-4"
                    >
                      {renderChart(series, insightData.insightName)}
                    </View>
                  ))
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
 