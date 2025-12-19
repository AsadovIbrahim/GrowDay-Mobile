import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faArrowLeft,faBullseye } from "@fortawesome/free-solid-svg-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import CryEmoji from "../../../assets/icons/cry-emoji.svg";
import SadEmoji from "../../../assets/icons/sad-emoji.svg";
import CoolEmoji from "../../../assets/icons/cool-emoji.svg";
import LaughEmoji from "../../../assets/icons/laughing-emoji.svg";

const UserPref4 = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const [selectedOption, setSelectedOption] = useState("Occasionally");
  
  // Get preferences from previous screen
  const previousPreferences = route.params?.preferences || {};

  const handleGoBack = () => {
    navigation.goBack();
  };

  const options = [
    { id: "Constantly", SvgIcon: CryEmoji, label: "Constantly" },
    { id: "Occasionally", SvgIcon: SadEmoji, label: "Occasionally" },
    { id: "Rarely", SvgIcon: LaughEmoji, label: "Rarely" },
    { id: "Never", SvgIcon: CoolEmoji, label: "Never" },
  ];  

  return (
    <LinearGradient colors={["#e7f0df", "#2f6f3f"]} className="flex-1 px-5">
      <SafeAreaView className="flex-1">
        {/* HEADER */}
        <View className="flex-row items-center mt-4 mb-8">
          <TouchableOpacity onPress={handleGoBack}>
            <FontAwesomeIcon icon={faArrowLeft} size={20} color="#1f2937" />
          </TouchableOpacity>

          <View className="flex-1 h-2 bg-black/10 rounded-full mx-4">
            <View className="w-4/5 h-full bg-green-500 rounded-full" />
          </View>

          <Text className="text-gray-800 font-semibold font-redditsans-bold">
            4/5
          </Text>
        </View>

        {/* TITLE */}
        <View className="items-center mb-6">
          <Text className="text-[26px] font-redditsans-bold text-gray-800 text-center">
          Do you often find it hard to
          </Text>

          <View className="flex-row items-center justify-center gap-2 mt-1">
            <Text className="text-[26px] font-redditsans-bold text-green-500">
              focus?
            </Text>
            <FontAwesomeIcon icon={faBullseye} size={20} color="#ef4444" />
          </View>

          <Text className="text-[13px] font-redditsans-regular text-gray-500 mt-3 text-center px-10">
          Understanding your motivations helps us align GrowDay with your goals.Select all that apply.
          </Text>
        </View>

        {/* OPTIONS */}
        <View className="flex-1 mt-16">
          {options.map((option) => (
            <TouchableOpacity
              key={option.id}
              onPress={() => setSelectedOption(option.id)}
              className={`bg-white rounded-2xl p-6 mb-4 flex-row items-center ${
                selectedOption === option.id
                  ? "border-2 border-green-500"
                  : "border-2 border-transparent"
              }`}
              style={{
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
              <Text className="text-[16px] font-redditsans-bold text-gray-800">
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* BUTTON */}
        <TouchableOpacity
          onPress={() => {
            navigation.navigate("UserPref5", {
              preferences: {
                ...previousPreferences,
                focusDifficulty: selectedOption,
              }
            });
          }}
          className="mb-20 bg-[#8bc37a] py-5 rounded-full"
        >
          <Text className="text-white text-center font-redditsans-bold text-[16px]">
            Continue
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default UserPref4;
