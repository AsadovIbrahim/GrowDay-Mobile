import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";

const HabitAddCard = ({ title, frequency, onAdd }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { colors } = theme;

  const translationKey = title ? title.toLowerCase().replace(/\s+/g, '_') : '';

  return (
    <View
      className="rounded-3xl px-6 py-5 mb-3 flex-row items-center justify-between"
      style={{
        backgroundColor: colors.card,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 3,
      }}
    >
      <View>
        <Text className="text-base font-redditsans-medium mb-1" style={{ color: colors.text }}>
          {t(`habits.${translationKey}`, { defaultValue: title })}
        </Text>
        <Text className="text-sm font-redditsans-regular" style={{ color: colors.textSecondary }}>
          {t(`my_habits.filters.${(frequency || 'Daily').toLowerCase()}`, { defaultValue: frequency })}
        </Text>
      </View>

      <TouchableOpacity
        onPress={onAdd}
        className="w-9 h-9 rounded-2xl items-center justify-center"
        style={{
          backgroundColor: colors.cardSecondary,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <FontAwesomeIcon icon={faPlus} size={16} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
};

export default HabitAddCard;

