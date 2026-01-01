import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getNotificationDetailFetch, readNotificationFetch } from "../../utils/fetch";
import { useMMKVString } from "react-native-mmkv";
import { useState, useEffect } from "react";

const NotificationDetail = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { notification: routeNotification } = route.params || {};
  const [notification, setNotification] = useState(routeNotification || null);
  const [token] = useMMKVString('accessToken');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (routeNotification?.id) {
      getNotificationDetail();
      readNotification();
    }
  }, []);

  const readNotification = async () => {
    if (!routeNotification?.id) return;
    try {
      const response = await readNotificationFetch(token, routeNotification.id);
      console.log('Read notification response:', response);
      setNotification(prev => prev ? { ...prev, isRead: true } : prev);
    } catch (error) {
      console.log('Error reading notification:', error);
    }
  };

  const getNotificationDetail = async () => {
    if (!routeNotification?.id) return;
    
    setLoading(true);
    try {
      const response = await getNotificationDetailFetch(token, routeNotification.id);
      setNotification(response);
    } catch (error) {
      console.log('Error fetching notification detail:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleGoBack = () => {
    navigation.goBack();
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white">
        <View className="pt-12 px-4 pb-4 bg-white">
          <TouchableOpacity onPress={handleGoBack}>
            <FontAwesomeIcon icon={faArrowLeft} size={20} color="#1f2937" />
          </TouchableOpacity>
        </View>
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500 font-redditsans-regular">
            Loading...
          </Text>
        </View>
      </View>
    );
  }

  if (!notification) {
    return (
      <View className="flex-1 bg-white">
        <View className="pt-12 px-4 pb-4 bg-white">
          <TouchableOpacity onPress={handleGoBack}>
            <FontAwesomeIcon icon={faArrowLeft} size={20} color="#1f2937" />
          </TouchableOpacity>
        </View>
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500 font-redditsans-regular">
            Notification not found
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="pt-12 px-4 pb-4 bg-white">
        <View className="flex-row items-center gap-4 mb-4">
          <TouchableOpacity onPress={handleGoBack}>
            <FontAwesomeIcon icon={faArrowLeft} size={20} color="#1f2937" />
          </TouchableOpacity>
          <Text className="text-3xl mt-3 font-redditsans-bold text-black mb-4">
            Notification Details
          </Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        <View className="bg-white rounded-xl p-6 mb-4"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          {/* Habit Title */}
          <View className="mb-4">
            <Text className="text-xs text-gray-400 font-redditsans-regular mb-2">
              Habit
            </Text>
            <Text className={`text-2xl ${
              !notification.isRead 
                ? 'font-redditsans-bold text-black' 
                : 'font-redditsans-regular text-black'
            }`}>
              {notification.habitTitle || 'N/A'}
            </Text>
          </View>

          {/* Message */}
          <View className="mb-4">
            <Text className="text-xs text-gray-400 font-redditsans-regular mb-2">
              Message
            </Text>
            <Text className={`text-base ${
              !notification.isRead 
                ? 'font-redditsans-medium text-gray-700' 
                : 'font-redditsans-regular text-gray-700'
            }`}>
              {notification.message || 'No message'}
            </Text>
          </View>

          {/* Timestamp */}
          <View className="mb-4">
            <Text className="text-xs text-gray-400 font-redditsans-regular mb-2">
              Date & Time
            </Text>
            <Text className="text-sm text-gray-700 font-redditsans-regular">
              {notification.createdAt 
                ? new Date(notification.createdAt).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  })
                : 'N/A'
              }
            </Text>
          </View>

          {/* Status */}
          <View>
            <Text className="text-xs text-gray-400 font-redditsans-regular mb-2">
              Status
            </Text>
            <View className="flex-row items-center">
              {!notification.isRead ? (
                <>
                  <View className="w-3 h-3 bg-red-500 rounded-full mr-2" />
                  <Text className="text-sm text-green-600 font-redditsans-medium">
                    Unread
                  </Text>
                </>
              ) : (
                <>
                  <View className="w-3 h-3 bg-green-500 rounded-full mr-2" />
                  <Text className="text-sm text-gray-600 font-redditsans-medium">
                    Read
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default NotificationDetail;

