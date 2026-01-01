import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useState } from "react";

const CalendarSelector = ({ selectedDate, onDateSelect }) => {
  const today = new Date();
  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  
  // Generate dates for the next 7 days
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push({
      day: date.getDate(),
      dayName: dayNames[date.getDay()],
      fullDate: new Date(date)
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
          className={`px-4 py-3 rounded-2xl ${
            date.day === selectedDate ? 'bg-white border-2 border-blue-500' : 'bg-gray-100'
          }`}
          style={{
            shadowColor: date.day === selectedDate ? "#000" : "transparent",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: date.day === selectedDate ? 3 : 0,
          }}
        >
          <Text 
            className={`text-lg font-bold ${
              date.day === selectedDate ? 'text-blue-500' : 'text-black'
            }`}
            style={{ fontFamily: 'redditsans-bold' }}
          >
            {date.day}
          </Text>
          <Text 
            className={`text-xs ${
              date.day === selectedDate ? 'text-black' : 'text-gray-500'
            }`}
            style={{ fontFamily: 'redditsans-regular' }}
          >
            {date.dayName}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

export default CalendarSelector;

