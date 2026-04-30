import React from "react";
import { View, Text } from "react-native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faLock, faTrophy } from "@fortawesome/free-solid-svg-icons";
import { useTheme } from "../context/ThemeContext";

const AchievementCard = ({ title, description, icon, earnedAt, isNew = false }) => {
  const { theme, isDark } = useTheme();
  const { colors } = theme;
  const earned = !!earnedAt;

  const formattedDate = earned
    ? new Date(earnedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <View
      className="rounded-[24px] p-5 mb-4"
      style={{
        backgroundColor: colors.card,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
        opacity: earned ? 1 : 0.55,
      }}
    >
      <View className="flex-row items-center mb-4">
        {/* Icon circle */}
        <View
          className="w-[54px] h-[54px] rounded-full items-center justify-center mr-4"
          style={{ backgroundColor: earned ? (isDark ? 'rgba(34, 197, 94, 0.15)' : '#dcfce7') : colors.cardSecondary }}
        >
          {icon ? (
            <Text style={{ fontSize: 26 }}>{icon}</Text>
          ) : earned ? (
            <FontAwesomeIcon icon={faTrophy} size={24} color="#22c55e" />
          ) : (
            <FontAwesomeIcon icon={faLock} size={22} color="#9ca3af" />
          )}
        </View>

        {/* Title + description */}
        <View className="flex-1">
          <View className="flex-row items-center mb-1">
            <Text
              numberOfLines={1}
              className="text-[17px] font-redditsans-bold flex-1"
              style={{ color: colors.text }}
            >
              {title}
            </Text>
            {isNew && (
              <View className="ml-2 bg-green-500 rounded-full px-2 py-[2px]">
                <Text className="text-white text-[10px] font-redditsans-bold">NEW</Text>
              </View>
            )}
          </View>
          <Text
            numberOfLines={2}
            className="text-[13px] font-redditsans-regular leading-[18px]"
            style={{ color: colors.textSecondary }}
          >
            {description}
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View className="flex-row items-center justify-between mt-1 ml-1">
        <Text className="text-[12px] font-redditsans-regular" style={{ color: colors.textSecondary }}>
          {earned ? `Earned on ${formattedDate}` : "Not yet unlocked"}
        </Text>
        <View
          className="px-3 py-1 rounded-full"
          style={{ backgroundColor: earned ? (isDark ? 'rgba(34, 197, 94, 0.15)' : '#dcfce7') : colors.cardSecondary }}
        >
          <Text
            className="text-[12px] font-redditsans-bold"
            style={{ color: earned ? colors.primary : colors.textSecondary }}
          >
            {earned ? "✓ Unlocked" : "Locked"}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default AchievementCard;
