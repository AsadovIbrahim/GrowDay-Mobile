import React, { useEffect, useMemo, useState } from "react";
import { Modal, View, Text, TouchableOpacity, TextInput, ScrollView } from "react-native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faChevronDown, faTimes } from "@fortawesome/free-solid-svg-icons";
import { addUserHabitFetch } from "../utils/fetch";
import { storage } from "../utils/MMKVStore";
import { useMMKVString } from "react-native-mmkv";


const pad2 = (n) => String(n).padStart(2, "0");


const SelectSheet = ({ visible, title, options, selectedValue, onSelect, onClose }) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.25)" }}
      >
        <View className="flex-1 items-center justify-center px-6">
          <TouchableOpacity
            activeOpacity={1}
            className="bg-white rounded-2xl px-5 pt-4 pb-5 w-full"
            style={{ maxHeight: 420 }}
            onPress={() => {}}
          >
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-base font-redditsans-bold text-black">{title}</Text>
              <TouchableOpacity onPress={onClose}>
                <FontAwesomeIcon icon={faTimes} size={16} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="gap-2 pb-1">
                {options.map((opt) => (
                  <TouchableOpacity
                    key={String(opt.value)}
                    onPress={() => {
                      onSelect(opt.value);
                      onClose();
                    }}
                    className={`px-4 py-3 rounded-xl border ${
                      opt.value === selectedValue ? "border-green-600 bg-green-50" : "border-gray-200 bg-white"
                    }`}
                  >
                    <Text
                      className={`text-base font-redditsans-medium ${
                        opt.value === selectedValue ? "text-green-700" : "text-gray-800"
                      }`}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const HabitAddModal = ({ visible, habit, onClose, onSubmit }) => {
  const [reminderHour, setReminderHour] = useState(9);
  const [reminderMinute, setReminderMinute] = useState(0);
  const [hourSheetOpen, setHourSheetOpen] = useState(false);
  const [minuteSheetOpen, setMinuteSheetOpen] = useState(false);
  const [duration, setDuration] = useState("20");
  const [startDate, setStartDate] = useState("Today");
  const [endDate, setEndDate] = useState("No end date");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [token] = useMMKVString('accessToken');


  const handleDurationChange = (text) => {
    // Only allow numbers
    const numericValue = text.replace(/[^0-9]/g, "");
    // Limit to maximum 60
    if (numericValue === "" || (parseInt(numericValue) >= 0 && parseInt(numericValue) <= 60)) {
      setDuration(numericValue);
    }
  };

  const addUserHabit = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const response = await addUserHabitFetch(token, {
        habitId: habit.id,
        reminderTime: reminderTime,
        duration: duration,
      });
      console.log(response);
      if (response && !response.error && response.success !== false) {
        setSuccess(true);
        if (onSubmit) {
          onSubmit();
        }
      } else {
        setError(response?.message || "Failed to add habit. Please try again.");
      }
    } catch (error) {
      console.log(error);
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  const reminderTime = useMemo(() => {
    return `${pad2(reminderHour)}:${pad2(reminderMinute)}`;
  }, [reminderHour, reminderMinute]);

  useEffect(() => {
    if (habit) {
      // Reset fields when habit changes
      setReminderHour(9);
      setReminderMinute(0);
      setDuration("20");
      setStartDate("Today");
      setEndDate("No end date");


    }
  }, [habit]);

  

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)" }}
      >
        <View className="flex-1 justify-end">
          <TouchableOpacity
            activeOpacity={1}
            className="bg-white rounded-t-3xl px-5 pt-5 pb-6"
            onPress={() => {}}
          >
            {/* Header */}
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-redditsans-bold text-black">
                Add Habit
              </Text>
              <TouchableOpacity onPress={onClose}>
                <FontAwesomeIcon icon={faTimes} size={16} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Habit name pill */}
            <View className="bg-white rounded-xl border border-gray-200 px-3 py-3 mb-4">
              <Text className="text-base font-redditsans-medium text-black">
                {habit?.title || habit?.name || "Habit"}
              </Text>
            </View>

            {/* Reminder Time */}
            <View className="mb-4">
              <Text className="text-sm text-gray-500 font-redditsans-regular mb-2">
                Reminder Time
              </Text>

              <View className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex-row items-center">
                {/* Left: time display */}
                <View className="flex-1 px-4 py-4">
                  <Text className="text-2xl font-redditsans-bold text-black">
                    {pad2(reminderHour)}:{pad2(reminderMinute)}
                  </Text>
                </View>

                {/* Right: selectors */}
                <View className="flex-row items-center bg-gray-100">
                  <TouchableOpacity
                    onPress={() => setHourSheetOpen(true)}
                    className="px-4 py-4 flex-row items-center"
                  >
                    <Text className="text-base font-redditsans-medium text-gray-800 mr-2">
                      {pad2(reminderHour)}
                    </Text>
                    <FontAwesomeIcon icon={faChevronDown} size={14} color="#6b7280" />
                  </TouchableOpacity>

                  <View style={{ width: 1, height: "100%", backgroundColor: "#e5e7eb" }} />

                  <TouchableOpacity
                    onPress={() => setMinuteSheetOpen(true)}
                    className="px-4 py-4 flex-row items-center"
                  >
                    <Text className="text-base font-redditsans-medium text-gray-800 mr-2">
                      {pad2(reminderMinute)}
                    </Text>
                    <FontAwesomeIcon icon={faChevronDown} size={14} color="#6b7280" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Duration */}
            <View className="mb-4">
              <Text className="text-sm text-gray-500 font-redditsans-regular mb-2">
                Duration (optional)
              </Text>
              <View className="bg-white rounded-xl border border-gray-200 px-3 py-3 flex-row items-center">
                <TextInput
                  value={duration}
                  onChangeText={handleDurationChange}
                  keyboardType="numeric"
                  maxLength={2}
                  className="text-base text-black font-redditsans-regular flex-1"
                  placeholder="20"
                  placeholderTextColor="#9ca3af"
                />
                <Text className="text-base text-gray-500 font-redditsans-regular ml-2">
                  minutes
                </Text>
              </View>
            </View>

            
            {/* Actions */}
            <View className="mb-3">
              <TouchableOpacity
                onPress={addUserHabit}
                className="w-full bg-green-700 rounded-full py-3 items-center justify-center"
              >
                <Text className="text-white text-base font-redditsans-medium">
                  Add Habit
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="w-full bg-gray-100 rounded-full py-3 items-center justify-center"
            >
              <Text className="text-gray-700 text-base font-redditsans-medium">
                Cancel
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* Hour Selector Sheet */}
      <SelectSheet
        visible={hourSheetOpen}
        title="Select Hour"
        selectedValue={reminderHour}
        onClose={() => setHourSheetOpen(false)}
        onSelect={setReminderHour}
        options={Array.from({ length: 24 }, (_, i) => {
          return { label: pad2(i), value: i };
        })}
      />

      {/* Minute Selector Sheet */}
      <SelectSheet
        visible={minuteSheetOpen}
        title="Select Minute"
        selectedValue={reminderMinute}
        onClose={() => setMinuteSheetOpen(false)}
        onSelect={setReminderMinute}
        options={Array.from({ length: 60 }, (_, i) => {
          return { label: pad2(i), value: i };
        })}
      />
    </Modal>
  );
};

export default HabitAddModal;

