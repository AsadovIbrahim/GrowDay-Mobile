import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { ICONS } from "../constants/icons";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";

const SuggestedHabitCard = ({ name, frequency, icon, onPress }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { colors } = theme;

  const displayIcon = ICONS[icon] || ICONS.default;
  const translationKey = name ? name.toLowerCase().replace(/\s+/g, '_') : '';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="mr-3 rounded-xl overflow-hidden"
      style={{
        width: 150,
        height: 120, // Slightly increased height to accommodate everything
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
          <Text style={{ fontSize: 20 }}>{displayIcon}</Text>
        </View>
        <Text 
          className="text-base font-redditsans-bold mb-1" 
          style={{ color: colors.text }}
          numberOfLines={2}
        >
          {t(`habits.${translationKey}`, { defaultValue: name })}
        </Text>
        <Text className="text-sm font-redditsans-regular" style={{ color: colors.textSecondary }}>
          {t(`my_habits.filters.${frequency.toLowerCase()}`)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default SuggestedHabitCard;

