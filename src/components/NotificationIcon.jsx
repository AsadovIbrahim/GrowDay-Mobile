import { View, Text, TouchableOpacity } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faBell } from '@fortawesome/free-solid-svg-icons';
import { useNavigation } from '@react-navigation/native';

const NotificationIcon = ({ count = 0, size = 18, iconColor = "#2f6f3f" }) => {
  const navigation = useNavigation();

  return (
    <View className="relative">
      <TouchableOpacity 
        onPress={() => navigation.navigate('Notification')} 
        className="w-10 h-10 bg-white rounded-full items-center justify-center"
      >
        <FontAwesomeIcon icon={faBell} color={iconColor} size={size} />
      </TouchableOpacity>
      {count > 0 && (
        <View className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full items-center justify-center border-2 border-white">
          <Text className="text-white text-xs font-redditsans-bold">
            {count > 99 ? '99+' : count}
          </Text>
        </View>
      )}
    </View>
  );
};

export default NotificationIcon;

