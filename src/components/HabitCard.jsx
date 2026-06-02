import { View, Text, TouchableOpacity } from "react-native";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { useNavigation } from "@react-navigation/native";
import { ICONS } from "../constants/icons";
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { getTranslatedHabit } from '../utils/habitTranslations';

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


const HabitCard = ({ habit, index, onPress, selectedDate }) => {
  const { theme } = useTheme();
  const { colors } = theme;
  const { t, i18n } = useTranslation();
  const isFuture = (() => {
    if (!selectedDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(selectedDate);
    target.setHours(0, 0, 0, 0);
    return target > today;
  })();

  const isCompleted = !isFuture && (habit.status?.toLowerCase() === 'completed' || habit.status?.toLowerCase() === 'done');
  const navigation = useNavigation();
  
  const handlePress=(()=>{
    navigation.navigate("UserHabitDetails",{
      habitId: habit.userHabitId || habit.id,
      date: selectedDate,
      isFuture: isFuture
    })
  })
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

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
    <View
      style={{ opacity: isFuture ? 0.85 : 1, backgroundColor: colors.card }}
      className="rounded-xl p-4 mb-3 flex-row items-center">
      <View 
        style={{ backgroundColor: isCompleted ? colors.primarySurface : colors.cardSecondary }}
        className="w-12 h-12 rounded-full items-center justify-center mr-3"
      >
        {isCompleted ? (
          <FontAwesomeIcon icon={faCheck} color={colors.primary} size={20} />
        ) : (
          <Text className="text-2xl">{ICONS[habit.icon]}</Text>
        )}
      </View>
      
      <View className="flex-1">
        <Text className="text-base font-redditsans-medium mb-1" style={{ color: colors.text }}>
            {habit.title || getTranslatedHabit(habit, i18n.language, t).title}        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
          <Text 
            style={{ color: colors.textSecondary }}
            className="text-sm font-redditsans-regular"
          >
            {isFuture ? t('common.upcoming') : (isCompleted ? t('common.completed') : t('common.pending'))}
          </Text>
          {formattedTime && (
            <>
              <Text style={{ color: colors.textSecondary }} className="text-sm mx-1">•</Text>
              <Text 
                style={{ color: colors.textSecondary }}
                className="text-sm font-redditsans-regular"
              >
                {formattedTime}
              </Text>
            </>
          )}
          {habit.categoryDetails && (
            <View 
              style={{
                backgroundColor: (habit.categoryDetails.color || '#3b82f6') + '20',
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                marginLeft: 4
              }}
            >
              <Text style={{ fontSize: 11 }}>{getCategoryIcon(habit.categoryDetails.icon)}</Text>
              <Text 
                style={{ 
                  color: habit.categoryDetails.color || '#3b82f6', 
                  fontSize: 11,
                  fontWeight: '600'
                }}
              >
                {habit.categoryDetails.name}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
    </TouchableOpacity>
  );
};

export default HabitCard;

