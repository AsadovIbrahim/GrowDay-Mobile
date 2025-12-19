import React, { useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faArrowLeft,
  faBullseye,
  faInfinity,
  faTheaterMasks,
  faGamepad,
  faBomb,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { storage } from "../../utils/MMKVStore";
import { createUserPreferencesFetch } from "../../utils/fetch";

const UserPref5 = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const previousPreferences = route.params?.preferences || {};

  const handleGoBack = () => {
    navigation.goBack();
  };

  const options = [
    {
      id: "Lack of Motivation",
      icon: faBullseye,
      iconColor: "#ef4444",
      label: "Lack of Motivation",
    },
    {
      id: "Work Overload",
      icon: faInfinity,
      iconColor: "#3b82f6",
      label: "Work Overload",
    },
    {
      id: "Cluttered Environment",
      icon: faTheaterMasks,
      iconColor: "#f97316",
      label: "Cluttered Environment",
    },
    {
      id: "Digital Distractions",
      icon: faGamepad,
      iconColor: "#a855f7",
      label: "Digital Distractions",
    },
    {
      id: "Stress",
      icon: faBomb,
      iconColor: "#ef4444",
      label: "Stress",
    },
  ];

  const toggleOption = (optionId) => {
    setSelectedOptions((prev) => {
      if (prev.includes(optionId)) {
        return prev.filter((id) => id !== optionId);
      } else {
        return [...prev, optionId];
      }
    });
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      
      // Get all preferences from route params
      const wakeUpHour = previousPreferences.wakeUpHour || 7;
      const wakeUpMinute = previousPreferences.wakeUpMinute || 0;
      const endOfDayHour = previousPreferences.endOfDayHour || 9;
      const endOfDayMinute = previousPreferences.endOfDayMinute || 0;
      const procrastinationFrequency = previousPreferences.procrastinationFrequency || "Sometimes";
      const focusDifficulty = previousPreferences.focusDifficulty || "Occasionally";
      
      // Get access token
      const accessToken = storage.getString("accessToken");
      
      if (!accessToken) {
        Alert.alert("Error", "Authentication token not found. Please login again.");
        setIsLoading(false);
        return;
      }

      
      const wakeUpHour24 = wakeUpHour === 12 ? 0 : wakeUpHour;
      const endOfDayHour24 = endOfDayHour === 12 ? 12 : endOfDayHour + 12;

      const motivationalFactorsMap = {
        "Lack of Motivation": "LackOfMotivation",
        "Work Overload": "WorkOverload",
        "Cluttered Environment": "ClutteredEnvironment",
        "Digital Distractions": "DigitalDistractions",
        "Stress": "Other", 
      };

      const motivationalFactorsEnumNames = selectedOptions
        .map((option) => motivationalFactorsMap[option])
        .filter((value) => value !== undefined);

     
      const motivationalFactors = motivationalFactorsEnumNames.length > 0 
        ? motivationalFactorsEnumNames.join(",") 
        : "None";

      const validProcrastinateFrequency = procrastinationFrequency || "Sometimes";
      const validFocusDifficulty = focusDifficulty || "Occasionally";

      const payload = {
        wakeUpTime: `${String(wakeUpHour24).padStart(2, "0")}:${String(wakeUpMinute).padStart(2, "0")}:00`,
        sleepTime: `${String(endOfDayHour24).padStart(2, "0")}:${String(endOfDayMinute).padStart(2, "0")}:00`,
        procrestinateFrequency: validProcrastinateFrequency, 
        focusDifficulty: validFocusDifficulty,
        motivationalFactors: motivationalFactors,
      };

      console.log("Sending payload:", JSON.stringify(payload, null, 2));
      console.log("procrastinateFrequency value:", validProcrastinateFrequency);
      console.log("focusDifficulty value:", validFocusDifficulty);

      // Call API
      const response = await createUserPreferencesFetch(accessToken, payload);
      
      if (response && !response.error && response.success !== false) {
        storage.set("hasCompletedPreferences", true);
        
      } else {
        Alert.alert("Error", response?.message || "Failed to save preferences. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting preferences:", error);
      Alert.alert("Error", "An error occurred while saving your preferences. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#e7f0df", "#2f6f3f"]} className="flex-1 px-5">
      <SafeAreaView className="flex-1">
        {/* HEADER */}
        <View className="flex-row items-center mt-4 mb-8">
          <TouchableOpacity onPress={handleGoBack}>
            <FontAwesomeIcon icon={faArrowLeft} size={20} color="#1f2937" />
          </TouchableOpacity>

          <View className="flex-1 h-2 bg-black/10 rounded-full mx-4">
            <View className="w-full h-full bg-green-500 rounded-full" />
          </View>

          <Text className="text-gray-800 font-semibold font-redditsans-bold">
            5/5
          </Text>
        </View>

        {/* TITLE */}
        <View className="items-center mb-8">
          <Text className="text-[26px] font-redditsans-bold text-gray-800 text-center leading-tight">
            What influenced you to
          </Text>

          <View className="flex-row items-center justify-center mt-1">
            <Text className="text-[26px] font-redditsans-bold text-gray-800">
              become{" "}
            </Text>
            <Text className="text-[26px] font-redditsans-bold text-green-500">
              organized?
            </Text>
            <Text className="text-2xl ml-2">🧘</Text>
            </View>

          <Text className="text-[13px] font-redditsans-regular text-gray-500 mt-4 text-center px-8 leading-5">
            Let us know if focus is a struggle for you so we can provide
            targeted support.
          </Text>
        </View>

        {/* OPTIONS */}
        <View className="flex-1 mt-8">
          {options.map((option) => {
            const isSelected = selectedOptions.includes(option.id);
            return (
              <TouchableOpacity
                key={option.id}
                onPress={() => toggleOption(option.id)}
                className={`bg-white rounded-2xl p-5 mb-3 flex-row items-center justify-between ${
                  isSelected
                    ? "border-2 border-green-500"
                    : "border border-green-100"
                }`}
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.08,
                  shadowRadius: 3,
                  elevation: 2,
                }}
              >
                <View className="flex-row items-center flex-1">
                  <View className="mr-4">
                    <FontAwesomeIcon
                      icon={option.icon}
                      size={28}
                      color={option.iconColor}
                    />
                  </View>
                  <Text className="text-[16px] font-redditsans-bold text-gray-800 flex-1">
                    {option.label}
                  </Text>
                </View>
                {isSelected && (
                  <View className="ml-3">
                    <FontAwesomeIcon
                      icon={faCheck}
                      size={18}
                      color="#22c55e"
                    />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* BUTTON */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isLoading}
          className="mb-8 bg-[#8bc37a] py-4 rounded-full"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 4,
            elevation: 4,
            opacity: isLoading ? 0.6 : 1,
          }}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-white text-center font-redditsans-bold text-[16px]">
              Continue
            </Text>
          )}
        </TouchableOpacity>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default UserPref5;
