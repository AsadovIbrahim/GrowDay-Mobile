import React, { useMemo } from "react";
import { View, Text } from "react-native";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const TaskProgressCard = ({ title,totalPointsEarned,requiredPoints, percentage }) => {
  const progressPercentage = useMemo(() => {
    if (typeof percentage === "number") return clamp(percentage, 0, 100);
    const safeTotal = Number(requiredPoints) || 0;
    const safeCurrent = Number(totalPointsEarned) || 0;
    if (safeTotal <= 0) return 0;
    return clamp((safeCurrent / safeTotal) * 100, 0, 100);
  }, [percentage, totalPointsEarned, requiredPoints]);

  return (
    <View
      className="bg-white rounded-2xl p-5 mb-4"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
      }}
    >
      <Text className="text-lg font-redditsans-bold text-black mb-1">{title}</Text>

      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-sm text-gray-500 font-redditsans-medium">
          {totalPointsEarned} XP / {requiredPoints} XP
        </Text>
        <Text className="text-sm font-redditsans-bold text-black">{Math.round(progressPercentage)}%</Text>
      </View>

      <View className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <View 
            className="h-full bg-green-500 rounded-full" 
            style={{ width: `${progressPercentage}%` }} 
        />
      </View>
    </View>
  );
};

export default TaskProgressCard;

