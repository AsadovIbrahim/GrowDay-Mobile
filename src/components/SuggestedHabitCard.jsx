import React from "react";
import { View, Text } from "react-native";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';

const SuggestedHabitCard = ({ name, frequency }) => {
  return (
    <View
      className="mr-3 rounded-xl overflow-hidden"
      style={{
        width: 150,
        height: 110,
        backgroundColor: "#ffffff",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      <View className="flex-1 justify-center p-4">
        <View
          className="w-10 h-10 bg-white rounded-xl items-center justify-center mb-3"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
          }}
        >
        </View>
        <Text className="text-base font-redditsans-bold text-black mb-1">
          {name}
        </Text>
        <Text className="text-sm text-gray-700 font-redditsans-regular">
          {frequency}
        </Text>
      </View>
    </View>
  );
};

export default SuggestedHabitCard;

