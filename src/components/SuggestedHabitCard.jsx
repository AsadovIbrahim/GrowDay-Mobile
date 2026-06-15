import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { ICONS } from "../constants/icons";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { getTranslatedHabit } from "../utils/habitTranslations";

const CATEGORY_ICON_MAP = {
  default: '⭐', health: '❤️', fitness: '💪', mindfulness: '🧘',
  productivity: '📈', learning: '📚', social: '👥', finance: '💰',
  nutrition: '🍎', sleep: '😴', creativity: '🎨', selfcare: '💅',
  hydration: '💧', work: '💼', music: '🎵', sports: '⚽',
  nature: '🌱', meditation: '🕊️', coding: '💻', travel: '✈️',
};

const getCategoryIcon = (iconKey) => {
  if (!iconKey) return '';
  if ([...iconKey].length <= 2 && iconKey.codePointAt(0) > 255) return iconKey;
  return CATEGORY_ICON_MAP[iconKey.toLowerCase()] || '';
};

const SuggestedHabitCard = ({ name, frequency, icon, onPress, habit }) => {
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const { colors } = theme;

  const displayIcon = ICONS[icon] || ICONS.default;
  const displayTitle = getTranslatedHabit(habit || { title: name }, i18n.language, t).title;

  const rawFrequency = frequency || habit?.frequency || "Daily";
  const sanitizedFrequency = rawFrequency.trim();
  const frequencyKey = sanitizedFrequency.toLowerCase();

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
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
      }}
    >
      <View className="flex-1 justify-center p-4">
        <View
          className="w-10 h-10 rounded-xl items-center justify-center mb-3"
          style={{
            backgroundColor: colors.cardSecondary,
          }}
        >
          <Text style={{ fontSize: 20 }}>{displayIcon}</Text>
        </View>
        <Text
          className="text-base font-redditsans-bold mb-1"
          style={{ color: colors.text }}
          numberOfLines={2}
        >
          {displayTitle}
        </Text>
        <Text className="text-[12px] font-redditsans-regular" style={{ color: colors.textSecondary }} numberOfLines={1}>
          {t(`my_habits.filters.${frequencyKey}`, { defaultValue: sanitizedFrequency })}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default SuggestedHabitCard;

