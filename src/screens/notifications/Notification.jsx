import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft, faTrash, faCheckSquare, faSquare } from '@fortawesome/free-solid-svg-icons';
import React, { useState, useEffect } from "react";
import { useMMKVString } from "react-native-mmkv";
import { getUserNotificationsFetch, getUserUnreadNotificationsFetch,markAsAllReadNotificationFetch,getUnreadNotificationCountFetch, deleteNotificationFetch } from "../../utils/fetch";
import { useNavigation, useFocusEffect } from '@react-navigation/native';

const Notification = () => {

  const navigation = useNavigation();
  const [token] = useMMKVString('accessToken');
  const [markAsAllRead, setMarkAsAllRead] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationId, setNotificationId] = useState(null);
  const [unreadNotifications, setUnreadNotifications] = useState([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [selectedTab, setSelectedTab] = useState('all'); // 'all' or 'unread'
  const [loading, setLoading] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState(new Set());

  useEffect(() => {
    getNotifications();
    getUnreadNotifications();
    getUnreadNotificationCount();
  }, []);

  // Refresh notifications when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      getNotifications();
      getUnreadNotifications();
      getUnreadNotificationCount();
    }, [])
  );

  const handleGoBack = () => {
    navigation.navigate('Home');
  };
  const getNotifications = async () => {
    setLoading(true);
    try {
      const response = await getUserNotificationsFetch(token);
      console.log('Notifications response:', response);
      if (Array.isArray(response)) {
        setNotifications(response);
      } else if (response && Array.isArray(response.data)) {
        setNotifications(response.data);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.log('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };
  const getUnreadNotifications = async () => {
    setLoading(true);
    try {
      const response = await getUserUnreadNotificationsFetch(token);
      console.log('Unread notifications response:', response);
      setUnreadNotifications(response);
    } catch (error) {
      console.log('Error fetching unread notifications:', error);
    }
  };
  const getUnreadNotificationCount = async () => {
    try {
      const response = await getUnreadNotificationCountFetch(token);
      console.log('Unread notification count response:', response);
      setUnreadNotificationCount(response);
    } catch (error) {
      console.log('Error fetching unread notification count:', error);
    }
  };
  const deleteNotification = async (notificationId) => {
    try {
      const response = await deleteNotificationFetch(token, notificationId);
      console.log('Notification deleted response:', response);
      
      // Immediately update states to remove the deleted notification
      setNotifications(prevNotifications => 
        prevNotifications.filter(notification => notification.id !== notificationId)
      );
      setUnreadNotifications(prevUnreadNotifications => 
        prevUnreadNotifications.filter(notification => notification.id !== notificationId)
      );
      
      // Refresh data from server to ensure consistency
      await Promise.all([
        getNotifications(),
        getUnreadNotifications(),
        getUnreadNotificationCount()
      ]);
    } catch (error) {
      console.log('Error deleting notification:', error);
    }
  };

  const deleteSelectedNotifications = async () => {
    if (selectedNotifications.size === 0) return;
    
    Alert.alert(
      "Delete Notifications",
      `Are you sure you want to delete ${selectedNotifications.size} notification(s)?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            // Delete all selected notifications
            const deletePromises = Array.from(selectedNotifications).map(id => 
              deleteNotification(id)
            );
            await Promise.all(deletePromises);
            
            // Clear selection and exit selection mode
            setSelectedNotifications(new Set());
            setIsSelectionMode(false);
          }
        }
      ]
    );
  };

  const toggleNotificationSelection = (notificationId) => {
    setSelectedNotifications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(notificationId)) {
        newSet.delete(notificationId);
      } else {
        newSet.add(notificationId);
      }
      return newSet;
    });
  };

  const handleLongPress = (notification) => {
    if (!isSelectionMode) {
      setIsSelectionMode(true);
      setSelectedNotifications(new Set([notification.id]));
    }
  };
  const markAsAllReadNotification = async () => {
    try {
      const response = await markAsAllReadNotificationFetch(token);
      console.log('Mark as all read response:', response);
      
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => ({
          ...notification,
          isRead: true
        }))
      );
      
      setUnreadNotifications([]);
      
      setUnreadNotificationCount(0);
      
      await Promise.all([
        getNotifications(),
        getUnreadNotifications(),
        getUnreadNotificationCount()
      ]);
      
      setMarkAsAllRead(true);
    } catch (error) {
      console.log('Error marking as all read:', error);
    }
  };

  // Notification Item Component
  const NotificationItem = ({ notification, index }) => {
    const isSelected = selectedNotifications.has(notification.id);

    const handlePress = () => {
      if (isSelectionMode) {
        toggleNotificationSelection(notification.id);
      } else {
        navigation.navigate('NotificationDetail', { notification });
      }
    };

    return (
      <TouchableOpacity
        onPress={handlePress}
        onLongPress={() => handleLongPress(notification)}
        activeOpacity={0.7}
        className="mb-3 bg-white p-4 rounded-xl"
        style={{
          backgroundColor: isSelected ? '#f0f9ff' : 'white',
          borderWidth: 2,
          borderColor: isSelected ? '#3b82f6' : '#e5e7eb',
          borderRadius: 12,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        <View className="flex-row items-start justify-between">
          {/* Left side - Checkbox (if selection mode) and content */}
          <View className="flex-row items-start flex-1 mr-2">
            {isSelectionMode && (
              <View className="mr-3 mt-1">
                <FontAwesomeIcon 
                  icon={isSelected ? faCheckSquare : faSquare} 
                  size={24} 
                  color={isSelected ? '#3b82f6' : '#9ca3af'} 
                />
              </View>
            )}
            <View className="flex-1">
              <View className="flex-row items-center mb-1">
                <Text className={`text-base ${
                  !notification.isRead 
                    ? 'font-redditsans-bold text-black' 
                    : 'font-redditsans-regular text-black'
                }`}>
                  {notification.habitTitle}
                </Text>
              </View>
              <Text className={`text-sm ${
                !notification.isRead 
                  ? 'font-redditsans-medium text-gray-700' 
                  : 'font-redditsans-regular text-gray-700'
              }`}>
                {notification.message}
              </Text>
            </View>
          </View>

          {/* Right side - Unread indicator and timestamp */}
          <View className="items-end">
            {!notification.isRead && !isSelectionMode && (
              <View className="w-3 h-3 bg-green-500 rounded-full mb-2" />
            )}
            <Text className="text-xs text-gray-400 font-redditsans-regular">
              {notification.createdAt 
                ? new Date(notification.createdAt).toLocaleString('en-US', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  }).replace(',', '')
                : '2025-10-17 20:12:36'
              }
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  const filteredNotifications = selectedTab === 'unread' 
    ? unreadNotifications 
    : notifications;
           


  const unreadCount = unreadNotificationCount;

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="pt-12 px-4 pb-4 bg-white">
        <View className="flex-row items-center gap-4 mb-4">
            <TouchableOpacity onPress={handleGoBack}>
            <FontAwesomeIcon icon={faArrowLeft} size={20} color="#1f2937" />
            </TouchableOpacity>
            <Text className="text-3xl mt-3 font-redditsans-bold text-black mb-4">
                Notifications
            </Text>
        </View>

        {/* Tabs */}
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center gap-6">
            {/* View All Tab */}
            <TouchableOpacity
              onPress={() => setSelectedTab('all')}
              className="flex-row items-center"
            >
              <Text 
                className={`text-base font-redditsans-medium ${
                  selectedTab === 'all' ? 'text-black' : 'text-gray-500'
                }`}
              >
                View All
              </Text>
              {selectedTab === 'all' && (
                <View className="absolute -bottom-1 left-0 right-0 h-0.5 bg-green-500" />
              )}
            </TouchableOpacity>

            {/* Unread Tab */}
            <TouchableOpacity
              onPress={() => setSelectedTab('unread')}
              className="flex-row items-center"
            >
              <Text 
                className={`text-base font-redditsans-medium ${
                  selectedTab === 'unread' ? 'text-black' : 'text-gray-500'
                }`}
              > 
                Unread
              </Text>
              {unreadCount > 0 && (
                <View className="ml-2 bg-gray-200 rounded-full px-2 py-0.5">
                  <Text className="text-xs font-redditsans-medium text-gray-700">
                    {unreadCount}
                  </Text>
                </View>
              )}
              {selectedTab === 'unread' && (
                <View className="absolute -bottom-1 left-0 right-0 h-0.5 bg-green-500" />
              )}
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View className="flex-row items-center gap-2">
            {isSelectionMode ? (
              <>
                <TouchableOpacity
                  className="bg-red-500 rounded-lg px-4 py-2"
                  onPress={deleteSelectedNotifications}
                  disabled={selectedNotifications.size === 0}
                >
                  <Text className="text-white text-sm font-redditsans-medium">
                    Delete ({selectedNotifications.size})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="bg-gray-500 rounded-lg px-4 py-2"
                  onPress={() => {
                    setIsSelectionMode(false);
                    setSelectedNotifications(new Set());
                  }}
                >
                  <Text className="text-white text-sm font-redditsans-medium">
                    Cancel
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              unreadCount > 0 && selectedTab === 'unread' && (
                <TouchableOpacity
                  className="bg-green-500 rounded-lg px-4 py-2"
                  onPress={markAsAllReadNotification}
                >
                  <Text className="text-white text-sm font-redditsans-medium">
                    Mark all read
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>
        </View>
      </View>

      {/* Notifications List */}
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {loading ? (
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-gray-500 font-redditsans-regular">
              Loading...
            </Text>
          </View>
        ) : filteredNotifications.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-gray-500 font-redditsans-regular">
              No notifications found
            </Text>
          </View>
        ) : (
          filteredNotifications.map((notification, index) => (
            <NotificationItem 
              key={notification.id || index}
              notification={notification}
              index={index}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
};

export default Notification;
