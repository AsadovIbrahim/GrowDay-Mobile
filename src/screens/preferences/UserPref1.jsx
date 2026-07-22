import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";

const UserPref1 = () => {
  const { t } = useTranslation();
  const { theme, isDark } = useTheme();

  const AGE_RANGES = [
    { id: "under18", label: t("preferences.step1.ranges.under18"), value: 17 },
    { id: "18-24", label: "18 - 24", value: 21 },
    { id: "25-34", label: "25 - 34", value: 29 },
    { id: "35-44", label: "35 - 44", value: 39 },
    { id: "45-54", label: "45 - 54", value: 49 },
    { id: "55plus", label: "55+", value: 60 },
  ];
  const { colors } = theme;
  const route = useRoute();
  const navigation = useNavigation();

  const initialData = route.params?.initialData;
  const isUpdate = route.params?.isUpdate;
  const previousPreferences = route.params?.preferences || {};

  // Find the initial range based on value or label
  const [selectedRange, setSelectedRange] = useState(
    AGE_RANGES.find(r => r.label === initialData?.age || r.value === initialData?.age) || null
  );

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={isDark ? ["#0a0f0b", "#1a2e1c"] : ["#e7f0df", "#2f6f3f"]} style={StyleSheet.absoluteFillObject} />
      <SafeAreaView style={{ flex: 1 }} className="px-5">
        <View className="flex-row items-center mt-4 mb-8">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className={`w-10 h-10 items-center justify-center rounded-full border ${
              isDark ? "bg-white/10 border-white/15" : "bg-black/5 border-black/10"
            }`}
          >
            <FontAwesomeIcon icon={faArrowLeft} size={18} color={isDark ? "#ffffff" : "#1f2937"} />
          </TouchableOpacity>
          <View className="flex-1 h-2 bg-black/10 rounded-full mx-4">
            <View className="w-[25%] h-full bg-green-500 rounded-full" />
          </View>
          <Text style={{ color: colors.textSecondary }} className="font-semibold font-redditsans-bold">2/8</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
          <View className="items-center mb-8">
            <Text style={{ color: colors.text }} className="text-[26px] font-redditsans-bold text-center">
              {t("preferences.step1.title1")}
            </Text>
            <Text className="text-[26px] font-redditsans-bold text-green-500 text-center">
              {t("preferences.step1.title2")}
            </Text>
            <Text style={{ color: colors.textSecondary }} className="text-[14px] font-redditsans-regular mt-2 text-center px-10">
              {t("preferences.step1.subtitle")}
            </Text>
          </View>

          <View className="mb-8">
            {AGE_RANGES.map((range) => {
              const isSelected = selectedRange?.id === range.id;
              return (
                <TouchableOpacity
                  key={range.id}
                  onPress={() => setSelectedRange(range)}
                  className={`flex-row items-center p-4 mb-3 rounded-2xl ${isSelected ? "border-2 border-green-500" : isDark ? "border border-white/10" : "border border-green-100"
                    }`}
                  style={{
                    backgroundColor: isDark ? "#1a2e1c" : "#ffffff",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isSelected ? 0.2 : 0.05,
                    shadowRadius: 4,
                    elevation: 3
                  }}
                >
                  <View className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${isSelected ? "border-green-500 bg-green-500" : "border-gray-400"
                    }`}>
                    {isSelected && <View className="w-2 h-2 bg-white rounded-full" />}
                  </View>
                  <Text style={{
                    color: colors.text,
                    fontSize: 16,
                    fontWeight: isSelected ? "700" : "500"
                  }} className="font-redditsans-bold">
                    {range.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View className="flex-1" />

          <View className="mt-4 mb-6">
            <TouchableOpacity
              disabled={!selectedRange}
              onPress={() => {
                navigation.navigate("UserPref2", {
                  isUpdate,
                  initialData,
                  preferences: {
                    ...previousPreferences,
                    age: selectedRange.value,
                    ageLabel: selectedRange.label
                  }
                });
              }}
              style={{ backgroundColor: colors.primaryLight, opacity: !selectedRange ? 0.5 : 1 }}
              className="py-5 rounded-full shadow-lg"
            >
              <Text className="text-white text-center font-redditsans-bold text-[16px]">{t("preferences.continue")}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default UserPref1;
