import React, { useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Modal, Animated, Easing } from "react-native";
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
import { createUserPreferencesWithAIFetch, updateUserPreferencesWithAIFetch } from "../../utils/fetch";
import { useTheme } from "../../context/ThemeContext";

const UserPref6 = () => {
  const { theme, isDark } = useTheme();
  const { colors } = theme;
  const route = useRoute();
  const navigation = useNavigation();
  const [selectedOptions, setSelectedOptions] = useState([]);
   const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  const loadingMessages = [
    "Syncing with your energy levels...",
    "Analyzing focus patterns...",
    "Brainstorming perfect routines...",
    "Finalizing your AI blueprint...",
    "Almost there, magic is happening..."
  ];

  // Animated loading messages effect
  React.useEffect(() => {
    let interval;
    if (isLoading) {
      // Reset step and start fade in
      setLoadingStep(0);
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();

      interval = setInterval(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start(() => {
          setLoadingStep((prev) => (prev + 1) % loadingMessages.length);
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }).start();
        });
      }, 3000);
    } else {
      fadeAnim.setValue(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);
  
  const isUpdate = route.params?.isUpdate;
  const initialData = route.params?.initialData;
  const previousPreferences = route.params?.preferences || {};

  React.useEffect(() => {
    if (initialData?.motivationalFactors) {
       const reverseMap = {
         "LackOfMotivation": "Lack of Motivation",
         "WorkOverload": "Work Overload",
         "ClutteredEnvironment": "Cluttered Environment",
         "DigitalDistractions": "Digital Distractions",
         "Other": "Stress",
         "LackOfTimeManagement": "Lack of Motivation" // Fallback or add new option if needed
       };
       
       let factors = [];
       if (typeof initialData.motivationalFactors === 'string') {
         factors = initialData.motivationalFactors.split(",").map(f => f.trim());
       } else if (Array.isArray(initialData.motivationalFactors)) {
         factors = initialData.motivationalFactors;
       }

       const labels = factors.map(f => reverseMap[f]).filter(f => f);
       // Remove duplicates if any
       setSelectedOptions([...new Set(labels)]);
    }
  }, [initialData]);

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

  const handleSubmit = () => {
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

    navigation.navigate("UserPref7", {
      isUpdate,
      initialData,
      preferences: {
        ...previousPreferences,
        motivationalFactors: motivationalFactors,
      }
    });
  };

  return (
    <LinearGradient colors={isDark ? ["#0a0f0b", "#1a2e1c"] : ["#e7f0df", "#2f6f3f"]} className="flex-1 px-5">
      <SafeAreaView className="flex-1">
        {/* HEADER */}
        <View className="flex-row items-center mt-4 mb-8">
          <TouchableOpacity onPress={handleGoBack}>
            <FontAwesomeIcon icon={faArrowLeft} size={20} color={isDark ? "#ffffff" : "#1f2937"} />
          </TouchableOpacity>

          <View className="flex-1 h-2 bg-black/10 rounded-full mx-4">
            <View className="w-[87.5%] h-full bg-green-500 rounded-full" />
          </View>

          <Text style={{ color: colors.textSecondary }} className="font-semibold font-redditsans-bold">
            7/8
          </Text>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
        >
          {/* TITLE */}
          <View className="items-center mb-8">
            <Text style={{ color: colors.text }} className="text-[26px] font-redditsans-bold text-center leading-tight">
              What influenced you to
            </Text>

            <View className="flex-row items-center justify-center mt-1">
              <Text style={{ color: colors.text }} className="text-[26px] font-redditsans-bold">
                become{" "}
              </Text>
              <Text className="text-[26px] font-redditsans-bold text-green-500">
                organized?
              </Text>
              <Text className="text-2xl ml-2">🧘</Text>
              </View>

            <Text style={{ color: colors.textSecondary }} className="text-[13px] font-redditsans-regular mt-4 text-center px-8 leading-5">
              Let us know if focus is a struggle for you so we can provide
              targeted support.
            </Text>
          </View>

          {/* OPTIONS */}
          <View className="mb-8">
            {options.map((option) => {
              const isSelected = selectedOptions.includes(option.id);
              return (
                <TouchableOpacity
                  key={option.id}
                  onPress={() => toggleOption(option.id)}
                  className={`rounded-2xl p-5 mb-3 flex-row items-center justify-between ${
                    isSelected
                      ? "border-2 border-green-500"
                      : isDark ? "border border-white/10" : "border border-green-100"
                  }`}
                  style={{
                    backgroundColor: isDark ? "#1a2e1c" : "#ffffff",
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
                    <Text style={{ color: colors.text }} className="text-[16px] font-redditsans-bold flex-1">
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

          <View style={{ flex: 1 }} />

          {/* BUTTON */}
          <TouchableOpacity
            onPress={handleSubmit}
            className="bg-[#8bc37a] py-4 rounded-full mb-6"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 4,
              elevation: 4,
            }}
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

export default UserPref6;
