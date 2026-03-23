import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";

const HabitAddCard = ({ title, frequency, onAdd }) => {
  return (
    <View
      className="bg-white rounded-3xl px-6 py-5 mb-3 flex-row items-center justify-between"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 3,
      }}
    >
      <View>
        <Text className="text-base font-redditsans-medium text-black mb-1">
          {title}
        </Text>
        <Text className="text-sm text-gray-400 font-redditsans-regular">
          {frequency}
        </Text>
      </View>

      <TouchableOpacity
        onPress={onAdd}
        className="w-9 h-9 rounded-2xl bg-white items-center justify-center"
        style={{
          borderWidth: 1,
          borderColor: "#e5e7eb",
        }}
      >
        <FontAwesomeIcon icon={faPlus} size={16} color="#16a34a" />
      </TouchableOpacity>
    </View>
  );
};

export default HabitAddCard;

