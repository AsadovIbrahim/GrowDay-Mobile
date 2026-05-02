import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import CryEmoji from "../../../assets/icons/cry-emoji.svg";
import SadEmoji from "../../../assets/icons/sad-emoji.svg";
import CoolEmoji from "../../../assets/icons/cool-emoji.svg";
import LaughEmoji from "../../../assets/icons/laughing-emoji.svg";

const UserPref4 = () => {
  const { theme, isDark } = useTheme();
  const { colors } = theme;
  const route = useRoute();
  const navigation = useNavigation();

  const initialData = route.params?.initialData;
  const isUpdate = route.params?.isUpdate;

  const [selectedOption, setSelectedOption] = useState(initialData?.procrestinateFrequency || "Sometimes");
  
  // Get preferences from previous screen
  const previousPreferences = route.params?.preferences || {};

  const handleGoBack = () => {
    navigation.goBack();
  };

  const options = [
    { id: "Always", SvgIcon: CryEmoji, label: "Always" },
    { id: "Sometimes", SvgIcon: SadEmoji, label: "Sometimes" },
    { id: "Rarely", SvgIcon: LaughEmoji, label: "Rarely" },
    { id: "Never", SvgIcon: CoolEmoji, label: "Never" },
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
            <View className="w-[62.5%] h-full bg-green-500 rounded-full" />
          </View>

          <Text style={{ color: colors.textSecondary }} className="font-semibold font-redditsans-bold">
            5/8
          </Text>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
        >
          {/* TITLE */}
          <View className="items-center mb-6">
            <Text style={{ color: colors.text }} className="text-[26px] font-redditsans-bold text-center">
              Do you often
            </Text>

            <View className="flex-row items-center justify-center mt-1">
              <Text className="text-[26px] font-redditsans-bold text-green-500">
                procrastinate?
              </Text>
              <Text className="text-[26px] ml-2">👀</Text>
            </View>

            <Text style={{ color: isDark ? "rgba(255,255,255,0.6)" : "#6b7280" }} className="text-[13px] font-redditsans-regular mt-3 text-center px-10">
              Understanding your procrastination tendencies helps us tailor
              strategies to overcome them.
            </Text>
          </View>

          {/* OPTIONS */}
          <View className="mb-8">
            {options.map((option) => (
              <TouchableOpacity
                key={option.id}
                onPress={() => setSelectedOption(option.id)}
                className={`rounded-2xl p-6 mb-4 flex-row items-center ${
                  selectedOption === option.id
                    ? "border-2 border-green-500"
                    : isDark ? "border-2 border-white/10" : "border-2 border-transparent"
                }`}
                style={{
                  backgroundColor: isDark ? "#1a2e1c" : "#ffffff",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                }}
              >
                {option.SvgIcon && (
                  <View className="mr-3">
                    <option.SvgIcon width={30} height={30} />
                  </View>
                )}
                 <Text style={{ color: isDark ? "#ffffff" : "#1f2937" }} className="text-[16px] font-redditsans-bold">
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ flex: 1 }} />

          {/* BUTTON */}
          <TouchableOpacity
            onPress={() => {
              navigation.navigate("UserPref5", {
                isUpdate,
                initialData,
                preferences: {
                  ...previousPreferences,
                  procrastinationFrequency: selectedOption,
                }
              });
            }}
            className="bg-[#8bc37a] py-5 rounded-full"
          >
            <Text className="text-white text-center font-redditsans-bold text-[16px]">
              Continue
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default UserPref4;
