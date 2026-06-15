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
      className="px-4 py-3"
      contentContainerStyle={{ gap: 12 }}
    >
      {dates.map((date, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => onDateSelect(date.day, date.fullDate)}
          style={{
            backgroundColor: date.day === selectedDate ? colors.primarySurface : colors.card,
            borderColor: date.day === selectedDate ? colors.primary : colors.border,
            borderWidth: date.day === selectedDate ? 2 : 1,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: date.day === selectedDate ? 0.08 : 0.02,
            shadowRadius: 3,
            elevation: date.day === selectedDate ? 2 : 1,
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 50,
          }}
          className="px-3 py-2.5 rounded-xl"
        >
          <Text
            style={{
              color: date.day === selectedDate ? colors.primary : colors.text,
              fontFamily: 'RedditSans-Bold',
              textAlign: 'center',
            }}
            className="text-lg font-bold"
          >
            {date.day}
          </Text>
          <Text
            style={{
              color: date.day === selectedDate ? colors.primary : colors.textSecondary,
              fontFamily: 'RedditSans-Medium',
              textAlign: 'center',
              marginTop: 2,
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
