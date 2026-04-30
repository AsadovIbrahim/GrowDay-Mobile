import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useState } from "react";
import { useTheme } from '../../../context/ThemeContext';

const CalendarSelector = ({ selectedDate, onDateSelect }) => {
  const { theme } = useTheme();
  const { colors } = theme;
  const today = new Date();
  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  
  // Generate dates for the next 7 days
  const dates = [];
for (let i = -3; i <= 3; i++) {
  const date = new Date(today);
  date.setDate(today.getDate() + i);
  dates.push({
    day: date.getDate(),
    dayName: dayNames[date.getDay()],
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
              fontFamily: 'redditsans-bold' 
            }}
            className="text-lg font-bold"
          >
            {date.day}
          </Text>
          <Text 
            style={{ 
              color: date.day === selectedDate ? colors.text : colors.textSecondary,
              fontFamily: 'redditsans-regular' 
            }}
            className="text-xs"
          >
            {date.dayName}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

export default CalendarSelector;

