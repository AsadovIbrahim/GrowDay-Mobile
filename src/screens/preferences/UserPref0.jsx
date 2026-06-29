import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faArrowLeft, faMars, faVenus, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";

const UserPref0 = () => {
  const { theme, isDark } = useTheme();
  const { colors } = theme;
  const { t } = useTranslation();
  const route = useRoute();
  const navigation = useNavigation();

  const initialData = route.params?.initialData;
  const isUpdate = route.params?.isUpdate;

  const [gender, setGender] = useState(initialData?.gender || null);

  const genders = [
    { id: "Male", label: t("preferences.step0.male"), icon: faMars, iconColor: "#3b82f6" },
    { id: "Female", label: t("preferences.step0.female"), icon: faVenus, iconColor: "#ec4899" },
    { id: "Other", label: t("preferences.step0.other"), icon: faEyeSlash, iconColor: "#8b949e" },
  ];

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={isDark ? ["#0a0f0b", "#1a2e1c"] : ["#e7f0df", "#2f6f3f"]} style={StyleSheet.absoluteFillObject} />
      <SafeAreaView style={{ flex: 1 }} className="px-5">
        <View className="flex-row items-center mt-4 mb-8">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <FontAwesomeIcon icon={faArrowLeft} size={20} color={isDark ? "#ffffff" : "#1f2937"} />
          </TouchableOpacity>
          <View className="flex-1 h-2 bg-black/10 rounded-full mx-4">
            <View className="w-[12.5%] h-full bg-green-500 rounded-full" />
          </View>
          <Text style={{ color: colors.textSecondary }} className="font-semibold font-redditsans-bold">1/8</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
          <View className="items-center mb-8">
            <Text style={{ color: colors.text }} className="text-[26px] font-redditsans-bold text-center">
              {t("preferences.step0.title1")}
            </Text>
            <Text className="text-[26px] font-redditsans-bold text-green-500 text-center">
              {t("preferences.step0.title2")}
            </Text>
            <Text style={{ color: colors.textSecondary }} className="text-[14px] font-redditsans-regular mt-2 text-center px-10">
              {t("preferences.step0.subtitle")}
            </Text>
          </View>

          <View className="mb-8">
            <Text style={{ color: colors.text }} className="text-[18px] font-redditsans-bold mb-4 px-1">{t("preferences.step0.question")}</Text>
            {genders.map((g) => {
              const isSelected = gender === g.id;
              return (
                <TouchableOpacity
                  key={g.id}
                  onPress={() => setGender(g.id)}
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
                  <View className="flex-row items-center flex-1">
                    <View
                      style={{
                        backgroundColor: isSelected
                          ? `${g.iconColor}20`
                          : (isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)")
                      }}
                      className="w-10 h-10 rounded-full items-center justify-center mr-3"
                    >
                      <FontAwesomeIcon icon={g.icon} size={20} color={isSelected ? g.iconColor : (isDark ? "#9ca3af" : "#4b5563")} />
                    </View>
                    <Text style={{
                      color: colors.text,
                      fontSize: 16,
                      fontWeight: isSelected ? "700" : "500"
                    }} className="font-redditsans-bold">
                      {g.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <View className="flex-1" />

          <View className="mt-4 mb-6">
            <TouchableOpacity
              disabled={!gender}
              onPress={() => {
                navigation.navigate("UserPref1", {
                  isUpdate,
                  initialData,
                  preferences: {
                    gender,
                  }
                });
              }}
              style={{ backgroundColor: colors.primaryLight, opacity: !gender ? 0.5 : 1 }}
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

export default UserPref0;
