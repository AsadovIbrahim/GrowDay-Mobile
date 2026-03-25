import { View, Text, TouchableOpacity } from "react-native";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faClock, faChevronRight, faCheckSquare, faSquare } from '@fortawesome/free-solid-svg-icons';
import { ICONS } from "../constants/icons";

const HabitListItem = ({ habit, onPress, isSelected, onToggleSelect, isSelectionMode, onLongPress }) => {
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
      className={`bg-white rounded-xl p-4 mb-3 flex-row items-center ${isSelected ? 'border-2 border-green-500' : ''}`}
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
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
            color={isSelected ? "#16a34a" : "#9ca3af"}
            size={24}
          />
        </TouchableOpacity>
      )}

      {/* Icon */}
      <View className="w-12 h-12 rounded-full items-center justify-center mr-4">
        <Text className="text-2xl">{ICONS[habit.icon]}</Text>
      </View>

      {/* Title and Type */}
      <View className="flex-1">
        <Text className="text-base font-redditsans-medium text-black mb-1">
          {habit.title}
        </Text>
        <Text className="text-sm text-gray-500 font-redditsans-regular">
          {displayType}
        </Text>
      </View>

      {/* Time and Arrow */}
      <View className="flex-row items-center gap-2">
        {formattedTime && (
          <View className="flex-row items-center gap-1">
            <FontAwesomeIcon icon={faClock} color="#9ca3af" size={14} />
            <Text className="text-sm text-gray-500 font-redditsans-regular">
              {formattedTime}
            </Text>
          </View>
        )}
        {!isSelectionMode && (
          <FontAwesomeIcon icon={faChevronRight} color="#9ca3af" size={14} />
        )}
      </View>
    </TouchableOpacity>
  );
};

export default HabitListItem;

