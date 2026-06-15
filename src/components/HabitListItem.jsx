import React, { useRef } from "react";
import { View, Text, TouchableOpacity, Pressable, Animated } from "react-native";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faClock, faCheck, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { ICONS } from "../constants/icons";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { getTranslatedHabit, getTranslatedCategory } from "../utils/habitTranslations";

const CATEGORY_ICON_MAP = {
  default: '⭐', health: '❤️', fitness: '💪', mindfulness: '🧘',
  productivity: '📈', learning: '📚', social: '👥', finance: '💰',
  nutrition: '🍎', sleep: '😴', creativity: '🎨', selfcare: '💅',
  hydration: '💧', work: '💼', music: '🎵', sports: '⚽',
  nature: '🌱', meditation: '🕊️', coding: '💻', travel: '✈️',
};

const getCategoryIcon = (iconKey) => {
  if (!iconKey) return '⭐';
  if ([...iconKey].length <= 2 && iconKey.codePointAt(0) > 255) return iconKey;
  return CATEGORY_ICON_MAP[iconKey.toLowerCase()] || '⭐';
};

const HabitListItem = ({ habit, onPress, isSelected, onToggleSelect, isSelectionMode, onLongPress, showStatus }) => {
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const { colors } = theme;
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.985,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
  };

  const formatTime = (timeValue) => {
    if (!timeValue) return '';
    try {
      let timeString = '';

      if (typeof timeValue === 'string' && timeValue.includes(':') && !timeValue.includes('T')) {
        timeString = timeValue;
      }
      else if (typeof timeValue === 'string' && timeValue.includes('T')) {
        const date = new Date(timeValue);
        if (!isNaN(date.getTime())) {
          timeString = date.toTimeString().split(' ')[0];
        }
      }
      else if (timeValue instanceof Date) {
        timeString = timeValue.toTimeString().split(' ')[0];
      }

      if (timeString) {
        const parts = timeString.split(':');
        if (parts.length >= 2) {
          const hours = parseInt(parts[0], 10);
          const minutes = parseInt(parts[1], 10);
          if (!isNaN(hours) && !isNaN(minutes)) {
            const date = new Date();
            date.setHours(hours, minutes, 0);
            return date.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
          }
        }
      }

      return timeString || '';
    } catch {
      return '';
    }
  };

  const notificationTime = habit.notificationTime || habit.NotificationTime || habit.notification_time;
  const formattedTime = formatTime(notificationTime);

  // Get habit frequency/type
  const habitType = habit.frequency || habit.frequencyType || habit.type || 'Daily';

  const isCompleted = showStatus && (habit.status?.toLowerCase() === 'completed' || habit.status?.toLowerCase() === 'done');

  const handlePress = () => {
    if (isSelectionMode) {
      onToggleSelect && onToggleSelect();
    } else {
      onPress && onPress();
    }
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      onLongPress={onLongPress}
    >
      <Animated.View
        className={`rounded-xl p-4 mb-3 flex-row items-center ${isSelected ? 'border-2' : ''} ${isCompleted ? 'opacity-80' : ''}`}
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: isCompleted ? 0 : 2 },
          shadowOpacity: isCompleted ? 0 : 0.1,
          shadowRadius: 4,
          elevation: isCompleted ? 0 : 3,
          backgroundColor: isCompleted ? colors.primarySurface : colors.card,
          borderColor: isSelected
            ? colors.primary
            : (isCompleted ? colors.primary + '30' : colors.border + '15'),
          borderWidth: isSelected ? 2 : 1,
          transform: [{ scale: scaleValue }],
        }}
      >
        {/* Selection Checkbox (Circular, Custom-designed for Play Store level look) */}
        {isSelectionMode && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onToggleSelect && onToggleSelect();
            }}
            style={{
              width: 22,
              height: 22,
              borderRadius: 11,
              borderWidth: isSelected ? 0 : 2,
              borderColor: isSelected ? 'transparent' : colors.textSecondary + '60',
              backgroundColor: isSelected ? colors.primary : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
            activeOpacity={0.7}
          >
            {isSelected && (
              <FontAwesomeIcon
                icon={faCheck}
                color="#FFFFFF"
                size={11}
              />
            )}
          </TouchableOpacity>
        )}

        {/* Icon (With Absolute Corner Checkmark Badge if Completed) */}
        <View
          style={{
            width: 46,
            height: 46,
            borderRadius: 23,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 14,
            backgroundColor: isCompleted ? (colors.primary + '15') : colors.cardSecondary,
            borderWidth: isCompleted ? 1.5 : 1,
            borderColor: isCompleted ? colors.primary + '40' : colors.border + '10',
            position: 'relative'
          }}
        >
          <Text style={{ fontSize: 22 }}>{ICONS[habit.icon] || '⭐'}</Text>

          {isCompleted && (
            <View
              style={{
                position: 'absolute',
                bottom: -2,
                right: -2,
                width: 18,
                height: 18,
                borderRadius: 9,
                backgroundColor: colors.primary,
                borderWidth: 1.5,
                borderColor: isCompleted ? colors.primarySurface : colors.card,
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <FontAwesomeIcon icon={faCheck} color="#FFFFFF" size={9} />
            </View>
          )}
        </View>

        {/* Title and Metadata */}
        <View style={{ flex: 1 }}>
          <Text
            className="text-[16px] font-redditsans-bold mb-1"
            style={{
              color: isCompleted ? colors.textSecondary : colors.text,
              lineHeight: 20
            }}
            numberOfLines={1}
          >
            {habit.title || getTranslatedHabit(habit, i18n.language, t).title}          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', columnGap: 8, rowGap: 4 }}>
            {/* Status / Frequency Pill */}
            <View
              style={{
                backgroundColor: isCompleted
                  ? colors.primary + '15'
                  : (showStatus ? '#eab30815' : colors.cardSecondary),
                paddingHorizontal: 6,
                paddingVertical: 1,
                borderRadius: 6,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Text
                className="font-redditsans-bold"
                style={{
                  fontSize: 11,
                  color: isCompleted
                    ? colors.primary
                    : (showStatus ? '#eab308' : colors.textSecondary)
                }}
              >
                {isCompleted
                  ? `✓ ${t('common.completed', 'Completed')}`
                  : (showStatus
                    ? `⏳ ${t('my_habits.filters.due_today', 'Due Today')}`
                    : t(`my_habits.filters.${habitType.toLowerCase()}`)
                  )
                }
              </Text>
            </View>

            {/* Category Pill */}
            {habit.categoryDetails && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: (habit.categoryDetails.color || '#3b82f6') + '15',
                  paddingHorizontal: 6,
                  paddingVertical: 1,
                  borderRadius: 6,
                  gap: 3
                }}
              >
                <Text
                  className="font-redditsans-bold"
                  style={{
                    color: habit.categoryDetails.color || '#3b82f6',
                    fontSize: 11
                  }}
                  numberOfLines={1}
                >
                  {getTranslatedCategory(habit.categoryDetails, i18n.language, t)}
                </Text>
              </View>
            )}

            {/* Streak Pill */}
            {habit.currentStreak > 0 && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#f59e0b15',
                  paddingHorizontal: 6,
                  paddingVertical: 1,
                  borderRadius: 6,
                  gap: 3
                }}
              >
                <Text style={{ fontSize: 11 }}>🔥</Text>
                <Text className="font-redditsans-bold" style={{ fontSize: 11, color: '#f59e0b' }}>
                  {habit.currentStreak}
                </Text>
              </View>
            )}

            {/* Time Pill */}
            {formattedTime && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.cardSecondary,
                  paddingHorizontal: 6,
                  paddingVertical: 1,
                  borderRadius: 6,
                  gap: 3
                }}
              >
                <FontAwesomeIcon icon={faClock} color={colors.textSecondary} size={9} />
                <Text className="font-redditsans-medium" style={{ fontSize: 11, color: colors.textSecondary }}>
                  {formattedTime}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Right side: Chevron */}
        {!isSelectionMode && (
          <View style={{ marginLeft: 8 }}>
            <FontAwesomeIcon icon={faChevronRight} color={colors.textSecondary} size={13} style={{ opacity: 0.4 }} />
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
};

export default HabitListItem;
