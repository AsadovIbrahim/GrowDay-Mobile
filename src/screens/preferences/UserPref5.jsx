import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faArrowLeft, faBullseye } from "@fortawesome/free-solid-svg-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";
import CryEmoji from "../../../assets/icons/cry-emoji.svg";
import SadEmoji from "../../../assets/icons/sad-emoji.svg";
import CoolEmoji from "../../../assets/icons/cool-emoji.svg";
import LaughEmoji from "../../../assets/icons/laughing-emoji.svg";

const UserPref5 = () => {
  const { theme, isDark } = useTheme();
  const { colors } = theme;
  const { t } = useTranslation();
  const route = useRoute();
  const navigation = useNavigation();

  const initialData = route.params?.initialData;
  const isUpdate = route.params?.isUpdate;

  const [selectedOption, setSelectedOption] = useState(initialData?.focusDifficulty || null);

  // Get preferences from previous screen
  const previousPreferences = route.params?.preferences || {};

  const handleGoBack = () => {
    navigation.goBack();
  };

  const options = [
    { id: "Constantly", SvgIcon: CryEmoji, label: t("preferences.step5.options.constantly") },
    { id: "Occasionally", SvgIcon: SadEmoji, label: t("preferences.step5.options.occasionally") },
    { id: "Rarely", SvgIcon: LaughEmoji, label: t("preferences.step5.options.rarely") },
    { id: "Never", SvgIcon: CoolEmoji, label: t("preferences.step5.options.never") },
  ];

  return (
    <LinearGradient colors={isDark ? ["#0a0f0b", "#1a2e1c"] : ["#e7f0df", "#2f6f3f"]} className="flex-1 px-5">
      <SafeAreaView className="flex-1">
        {/* HEADER */}
        <View className="flex-row items-center mt-4 mb-8">
          <TouchableOpacity onPress={handleGoBack}>
            <FontAwesomeIcon icon={faArrowLeft} size={20} color={isDark ? "#ffffff" : "#1f2937"} />
          </TouchableOpacity>

          <View className="flex-1 h-2 bg-black/10 rounded-full mx-4">
            <View className="w-[75%] h-full bg-green-500 rounded-full" />
          </View>

          <Text style={{ color: colors.textSecondary }} className="font-semibold font-redditsans-bold">
            6/8
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
        >
          <View className="items-center mb-6">
            <Text style={{ color: colors.text }} className="text-[26px] font-redditsans-bold text-center">
              {t("preferences.step5.title1")}
            </Text>

            <View className="flex-row items-center justify-center gap-2 mt-1">
              <Text className="text-[26px] font-redditsans-bold text-green-500">
                {t("preferences.step5.title2")}
              </Text>
              <FontAwesomeIcon icon={faBullseye} size={20} color="#ef4444" />
            </View>

            <Text style={{ color: isDark ? "rgba(255,255,255,0.6)" : "#6b7280" }} className="text-[13px] font-redditsans-regular mt-3 text-center px-10">
              {t("preferences.step5.subtitle")}
            </Text>
          </View>

          {/* OPTIONS */}
          <View className="mb-8">
            {options.map((option) => (
              <TouchableOpacity
                key={option.id}
                onPress={() => setSelectedOption(option.id)}
                className="rounded-2xl p-4 mb-3 flex-row items-center"
                style={{
                  backgroundColor: isDark ? "#1a2e1c" : "#ffffff",
                  borderWidth: selectedOption === option.id ? 3 : 2,
                  borderColor: selectedOption === option.id
                    ? "#22c55e"
                    : (isDark ? "rgba(255,255,255,0.1)" : "transparent"),
                  shadowColor: selectedOption === option.id ? "#22c55e" : "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: selectedOption === option.id ? 0.3 : 0.1,
                  shadowRadius: selectedOption === option.id ? 8 : 4,
                  elevation: selectedOption === option.id ? 5 : 3,
                }}
              >
                {option.SvgIcon && (
                  <View className="mr-3">
                    <option.SvgIcon width={24} height={24} />
                  </View>
                )}
                <Text 
                  style={{ 
                    color: selectedOption === option.id 
                      ? (isDark ? "#22c55e" : colors.primary) 
                      : (isDark ? "#ffffff" : "#1f2937") 
                  }} 
                  className="text-[15px] font-redditsans-bold"
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ flex: 1 }} />

          {/* BUTTON */}
          <TouchableOpacity
            disabled={!selectedOption}
            onPress={() => {
              navigation.navigate("UserPref6", {
                isUpdate,
                initialData,
                preferences: {
                  ...previousPreferences,
                  focusDifficulty: selectedOption,
                }
              });
            }}
            style={{ backgroundColor: colors.primaryLight, opacity: !selectedOption ? 0.5 : 1 }}
            className="py-5 rounded-full"
          >
            <Text className="text-white text-center font-redditsans-bold text-[16px]">
              {t("preferences.continue")}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default UserPref5;
