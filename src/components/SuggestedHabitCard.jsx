import React from "react";
import { View, Text } from "react-native";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useTheme } from "../context/ThemeContext";

const SuggestedHabitCard = ({ name, frequency }) => {
  const { theme } = useTheme();
  const { colors } = theme;

  return (
    <View
      className="mr-3 rounded-xl overflow-hidden"
      style={{
        width: 150,
        height: 110,
        backgroundColor: colors.card,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      <View className="flex-1 justify-center p-4">
        <View
          className="w-10 h-10 rounded-xl items-center justify-center mb-3"
          style={{
            backgroundColor: colors.cardSecondary,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
          }}
        >
        </View>
        <Text className="text-base font-redditsans-bold mb-1" style={{ color: colors.text }}>
          {name}
        </Text>
        <Text className="text-sm font-redditsans-regular" style={{ color: colors.textSecondary }}>
          {frequency}
        </Text>
      </View>
    </View>
  );
};

export default SuggestedHabitCard;

