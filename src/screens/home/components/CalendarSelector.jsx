import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useState } from "react";
import { useTheme } from '../../../context/ThemeContext';
import { useTranslation } from 'react-i18next';

const CalendarSelector = ({ selectedDate, onDateSelect }) => {
  const { theme } = useTheme();
  const { colors } = theme;
  const { t } = useTranslation();
  const today = new Date();

  const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

  // Generate dates: 3 past, today, 3 future
  const dates = [];
  for (let i = -3; i <= 3; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push({
      day: date.getDate(),
      dayKey: dayKeys[date.getDay()],
      fullDate: date,
    });
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="px-4 py-4"
      contentContainerStyle={{ gap: 12 }}
    >
      {dates.map((date, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => onDateSelect(date.day, date.fullDate)}
          style={{
            backgroundColor: date.day === selectedDate ? colors.card : colors.cardSecondary,
            borderColor: date.day === selectedDate ? colors.primary : 'transparent',
            borderWidth: date.day === selectedDate ? 2 : 0,
            shadowColor: date.day === selectedDate ? "#000" : "transparent",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: date.day === selectedDate ? 3 : 0,
          }}
          className="px-4 py-3 rounded-2xl"
        >
          <Text
            style={{
              color: date.day === selectedDate ? colors.primary : colors.text,
              fontFamily: 'RedditSans-Bold',
            }}
            className="text-lg font-bold"
          >
            {date.day}
          </Text>
          <Text
            style={{
              color: date.day === selectedDate ? colors.text : colors.textSecondary,
              fontFamily: 'RedditSans-Regular',
            }}
            className="text-xs"
          >
            {t(`home.day_short.${date.dayKey}`)}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

export default CalendarSelector;
