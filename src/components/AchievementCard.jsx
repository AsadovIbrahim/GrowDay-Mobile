import React from "react";
import { View, Text } from "react-native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faLock, faFire, faStar, faCheck, faBottleWater } from "@fortawesome/free-solid-svg-icons";

const AchievementCard = ({
  title,
  description,
  streakLabel,
  pointsLabel,
  isUnlocked = false,
  leadingIcon = null,
}) => {
  return (
    <View
      className="bg-white rounded-[24px] p-5 mb-4 shadow-sm"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      {/* Top Section: Icon and Text */}
      <View className="flex-row items-center mb-5">
        {/* Leading icon */}
        <View
          className={`w-[52px] h-[52px] rounded-full items-center justify-center mr-4 ${isUnlocked ? "bg-green-100" : "bg-gray-200"
            }`}
        >
          {leadingIcon ? (
            leadingIcon
          ) : isUnlocked ? (
            <FontAwesomeIcon icon={faBottleWater} size={24} color="#4ade80" />
          ) : (
            <FontAwesomeIcon icon={faLock} size={22} color="#9ca3af" />
          )}
        </View>

        {/* Title and Description */}
        <View className="flex-1">
          <Text
            numberOfLines={1}
            className="text-[17px] font-redditsans-bold text-gray-900 mb-1"
          >
            {title}
          </Text>
          <Text
            numberOfLines={2}
            className="text-[13px] font-redditsans-regular text-gray-600 leading-[18px] pr-2"
          >
            {description}
          </Text>
        </View>
      </View>

      {/* Bottom Section: Stats and Status */}
      <View className="flex-row items-end justify-between ml-1">
        <View className="space-y-[6px]">
          {/* Streak */}
          <View className="flex-row items-center">
            <FontAwesomeIcon icon={faFire} size={14} color="#fb923c" />
            <Text className="ml-2 text-[13px] font-redditsans-regular text-gray-600">
              Streak: <Text className="font-redditsans-bold text-gray-900">{streakLabel}</Text>
            </Text>
          </View>

          {/* Points */}
          <View className="flex-row items-center mt-1.5">
            <FontAwesomeIcon icon={faStar} size={14} color="#facc15" />
            <Text className="ml-2 text-[13px] font-redditsans-regular text-gray-600">
              Points: <Text className="font-redditsans-bold text-gray-900">{pointsLabel}</Text>
            </Text>
          </View>
        </View>

        <Text
          className={`text-[13px] font-redditsans-regular ${isUnlocked ? "text-green-500" : "text-gray-400"
            }`}
        >
          {isUnlocked ? "Unlocked" : "Locked"}
        </Text>
      </View>
    </View>
  );
};

export default AchievementCard;

