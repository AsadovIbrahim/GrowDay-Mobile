import React, { useMemo } from "react";
import { View, Text } from "react-native";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const TaskProgressCard = ({ title, current = 0, total = 0, unit = "", percentage }) => {
  const progressPercentage = useMemo(() => {
    if (typeof percentage === "number") return clamp(percentage, 0, 100);
    const safeTotal = Number(total) || 0;
    const safeCurrent = Number(current) || 0;
    if (safeTotal <= 0) return 0;
    return clamp((safeCurrent / safeTotal) * 100, 0, 100);
  }, [percentage, current, total]);

  return (
    <View
      className="bg-white rounded-xl p-4 mb-3"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      <Text className="text-base font-redditsans-bold text-black mb-2">{title}</Text>

      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-sm text-gray-600 font-redditsans-regular">
          {current}/{total} {unit}
        </Text>
        <Text className="text-sm font-redditsans-bold text-black">{Math.round(progressPercentage)}%</Text>
      </View>

      <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <View className="h-full bg-green-500 rounded-full" style={{ width: `${progressPercentage}%` }} />
      </View>
    </View>
  );
};

export default TaskProgressCard;

