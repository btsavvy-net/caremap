

import React from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import AddQuestionForm, { Question } from "@/components/shared/track-shared-components/AddQuestionForm";
import { ROUTES } from "@/utils/route";
import Header from "@/components/shared/Header";
import {
  ScrollView,
  Text,
  TouchableOpacity,
 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
export default function AddQuestionScreen() {
  const router = useRouter();
  const { goalName, existing, editIndex } = useLocalSearchParams<{
    goalName?: string;
    existing?: string;
    editIndex?: string;
  }>();

  const existingQuestions: Question[] = existing ? JSON.parse(existing) : [];

  const handleSave = (q: Question) => {
    let updatedQuestions = [...existingQuestions];

    if (editIndex !== undefined) {
      // Editing existing question
      updatedQuestions[Number(editIndex)] = q;
    } else {
      // Adding new question
      updatedQuestions.push(q);
    }

    router.replace({
      pathname: ROUTES.TRACK_CUSTOM_GOALS,
      params: { addedQuestions: JSON.stringify(updatedQuestions), goalName },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
         <Header
        title="Add Custom Goal"
        right={
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-white font-medium">Cancel</Text>
          </TouchableOpacity>
        }
      />
      <ScrollView className="p-4">
        <AddQuestionForm
          onSave={handleSave}
          editing={
            editIndex !== undefined ? existingQuestions[Number(editIndex)] : null
          }
        />
      </ScrollView>
    </SafeAreaView>
  );
}

