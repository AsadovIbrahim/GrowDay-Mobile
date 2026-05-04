import { View, Text, TouchableOpacity } from "react-native";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faClock, faChevronRight, faCheckSquare, faSquare, faCheck } from '@fortawesome/free-solid-svg-icons';
import { ICONS } from "../constants/icons";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";

const HabitListItem = ({ habit, onPress, isSelected, onToggleSelect, isSelectionMode, onLongPress, showStatus }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { colors } = theme;
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
            return date.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
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
  const displayType = habitType.charAt(0).toUpperCase() + habitType.slice(1).toLowerCase();
  
  const isCompleted = showStatus && (habit.status?.toLowerCase() === 'completed' || habit.status?.toLowerCase() === 'done');
  
  // Get icon based on habit title or icon property
  

  const handlePress = () => {
    if (isSelectionMode) {
      // In selection mode, toggle selection
      onToggleSelect && onToggleSelect();
    } else {
      // Normal mode, handle normal press
      onPress && onPress();
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      onLongPress={onLongPress}
      className={`rounded-xl p-4 mb-3 flex-row items-center ${isSelected ? 'border-2' : ''} ${isCompleted ? 'opacity-80' : ''}`}
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: isCompleted ? 0 : 2 },
        shadowOpacity: isCompleted ? 0 : 0.1,
        shadowRadius: 4,
        elevation: isCompleted ? 0 : 3,
        backgroundColor: isCompleted ? colors.primarySurface : colors.card,
        borderColor: isSelected ? colors.primary : 'transparent'
      }}
    >
      {/* Checkbox - Only visible in selection mode */}
      {isSelectionMode && (
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            onToggleSelect && onToggleSelect();
          }}
          className="mr-3"
          activeOpacity={0.7}
        >
          <FontAwesomeIcon
            icon={isSelected ? faCheckSquare : faSquare}
            color={isSelected ? colors.primary : colors.textSecondary}
            size={24}
          />
        </TouchableOpacity>
      )}

      {/* Icon */}
      <View 
        className="w-12 h-12 rounded-full items-center justify-center mr-4"
        style={{ backgroundColor: isCompleted ? colors.primarySurface : colors.cardSecondary }}
      >
        {isCompleted ? (
          <FontAwesomeIcon icon={faCheck} color={colors.primary} size={20} />
        ) : (
          <Text className="text-2xl">{ICONS[habit.icon]}</Text>
        )}
      </View>

      {/* Title and Type */}
      <View className="flex-1">
        <Text className="text-base font-redditsans-medium mb-1" style={{ color: colors.text }}>
          {t(`habits.${habit.title.toLowerCase().replace(/\s+/g, '_')}`, { defaultValue: habit.title })}
        </Text>
        <Text className="text-sm font-redditsans-regular" style={{ color: colors.textSecondary }}>
          {isCompleted ? t('common.completed') : t(`my_habits.filters.${habitType.toLowerCase()}`)}
        </Text>
      </View>

      {/* Time and Arrow */}
      <View className="flex-row items-center gap-2">
        {formattedTime && (
          <View className="flex-row items-center gap-1">
            <FontAwesomeIcon icon={faClock} color={colors.textSecondary} size={14} />
            <Text className="text-sm font-redditsans-regular" style={{ color: colors.textSecondary }}>
              {formattedTime}
            </Text>
          </View>
        )}
        {!isSelectionMode && (
          <FontAwesomeIcon icon={faChevronRight} color={colors.textSecondary} size={14} />
        )}
      </View>
    </TouchableOpacity>
  );
};

export default HabitListItem;

