import React from 'react';
import { View, Text } from "react-native";
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../../../context/ThemeContext';

const ProgressSummary = ({ dailyStatistics }) => {
  const { theme } = useTheme();
  const { colors } = theme;
  return (
    <View className="px-4 mb-8">
      <View className="flex-row gap-3">
        <View 
          className="flex-1 rounded-xl p-4 flex-row items-center"
          style={{
            backgroundColor: colors.card,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <View className="relative w-16 h-16 mr-3 items-center justify-center">
            <Svg width={64} height={64} style={{ position: 'absolute' }}>
              <Circle
                cx="32"
                cy="32"
                r="28"
                stroke={colors.border}
                strokeWidth="8"
                fill="none"
              />
              <Circle
                cx="32"
                cy="32"
                r="28"
                stroke={colors.primary}
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 28}`}
                strokeDashoffset={`${2 * Math.PI * 28 * (1 - (dailyStatistics?.completionRate || 0) / 100)}`}
                strokeLinecap="round"
                transform="rotate(-90 32 32)"
              />
            </Svg>
            <Text 
              style={{ color: colors.text }}
              className="text-sm font-redditsans-bold"
            >
              {dailyStatistics?.completionRate !== undefined && dailyStatistics?.completionRate !== null 
                ? `${Math.round(dailyStatistics.completionRate)}%` 
                : '0%'}
            </Text>
          </View>
          
          <View className="flex-1">
            <Text 
              style={{ color: colors.text }}
              className="text-base font-redditsans-medium mb-1"
            >
              Completed
            </Text>
            <Text 
              style={{ color: colors.textSecondary }}
              className="text-xs font-redditsans-regular"
            >
              {dailyStatistics?.completedCount || 0} Completed
            </Text>
          </View>
        </View>

        <View 
          className="flex-1 rounded-xl p-4 flex-row items-center"
          style={{
            backgroundColor: colors.card,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <View className="relative w-16 h-16 mr-3 items-center justify-center">
            <Svg width={64} height={64} style={{ position: 'absolute' }}>
              <Circle
                cx="32"
                cy="32"
                r="28"
                stroke={colors.border}
                strokeWidth="8"
                fill="none"
              />
              <Circle
                cx="32"
                cy="32"
                r="28"
                stroke={colors.danger}
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 28}`}
                strokeDashoffset={`${2 * Math.PI * 28 * (1 - (dailyStatistics?.missedRate || 0) / 100)}`}
                strokeLinecap="round"
                transform="rotate(-90 32 32)"
              />
            </Svg>
            <Text 
              style={{ color: colors.text, fontFamily: 'redditsans-bold' }}
              className="text-sm font-bold"
            >
              {dailyStatistics?.missedRate !== undefined && dailyStatistics?.missedRate !== null 
                ? `${Math.round(dailyStatistics.missedRate)}%` 
                : '0%'}
            </Text>
          </View>
          
          <View className="flex-1">
            <Text 
              style={{ color: colors.text, fontFamily: 'redditsans-medium' }}
              className="text-base font-semibold mb-1"
            >
              Missed
            </Text>
            <Text 
              style={{ color: colors.textSecondary, fontFamily: 'redditsans-regular' }}
              className="text-xs"
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
