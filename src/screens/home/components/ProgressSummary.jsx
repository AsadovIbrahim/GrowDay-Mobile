import React from 'react';
import { View, Text } from "react-native";
import Svg, { Circle } from 'react-native-svg';

const ProgressSummary = ({ dailyStatistics }) => {
  return (
    <View className="px-4 mb-6">
      <View className="flex-row gap-3">
        {/* Completed Card */}
        <View 
          className="flex-1 bg-white rounded-xl p-4 flex-row items-center"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <View className="relative w-16 h-16 mr-3 items-center justify-center">
            <Svg width={64} height={64} style={{ position: 'absolute' }}>
              {/* Background circle */}
              <Circle
                cx="32"
                cy="32"
                r="28"
                stroke="#e5e7eb"
                strokeWidth="8"
                fill="none"
              />
              {/* Progress circle - dynamic from backend */}
              <Circle
                cx="32"
                cy="32"
                r="28"
                stroke="#8bc37a"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 28}`}
                strokeDashoffset={`${2 * Math.PI * 28 * (1 - (dailyStatistics?.completionRate || 0) / 100)}`}
                strokeLinecap="round"
                transform="rotate(-90 32 32)"
              />
            </Svg>
            <Text 
              className="text-sm font-redditsans-bold text-black"
            >
              {dailyStatistics?.completionRate !== undefined && dailyStatistics?.completionRate !== null 
                ? `${Math.round(dailyStatistics.completionRate)}%` 
                : '0%'}
            </Text>
          </View>
          
          <View className="flex-1">
            <Text 
              className="text-base font-redditsans-medium text-black mb-1"
            >
              Completed
            </Text>
            <Text 
              className="text-xs text-gray-500 font-redditsans-regular"
            >
              {dailyStatistics?.completedCount || 0} Completed
            </Text>
          </View>
        </View>

        {/* Missed Card */}
        <View 
          className="flex-1 bg-white rounded-xl p-4 flex-row items-center"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <View className="relative w-16 h-16 mr-3 items-center justify-center">
            <Svg width={64} height={64} style={{ position: 'absolute' }}>
              {/* Background circle */}
              <Circle
                cx="32"
                cy="32"
                r="28"
                stroke="#e5e7eb"
                strokeWidth="8"
                fill="none"
              />
              {/* Progress circle - dynamic from backend */}
              <Circle
                cx="32"
                cy="32"
                r="28"
                stroke="#ef4444"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 28}`}
                strokeDashoffset={`${2 * Math.PI * 28 * (1 - (dailyStatistics?.missedRate || 0) / 100)}`}
                strokeLinecap="round"
                transform="rotate(-90 32 32)"
              />
            </Svg>
            <Text 
              className="text-sm font-bold text-black"
              style={{ fontFamily: 'redditsans-bold' }}
            >
              {dailyStatistics?.missedRate !== undefined && dailyStatistics?.missedRate !== null 
                ? `${Math.round(dailyStatistics.missedRate)}%` 
                : '0%'}
            </Text>
          </View>
          
          <View className="flex-1">
            <Text 
              className="text-base font-semibold text-black mb-1"
              style={{ fontFamily: 'redditsans-medium' }}
            >
              Missed
            </Text>
            <Text 
              className="text-xs text-gray-500"
              style={{ fontFamily: 'redditsans-regular' }}
            >
              {dailyStatistics?.missedCount || 0} Missed
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default ProgressSummary;
