import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Dimensions } from "react-native";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft, faTrash, faCheckSquare, faSquare } from '@fortawesome/free-solid-svg-icons';
import React, { useState, useEffect } from "react";
import { useMMKVString } from "react-native-mmkv";
import { getUserNotificationsFetch, getUserUnreadNotificationsFetch, markAsAllReadNotificationFetch, getUnreadNotificationCountFetch, deleteNotificationFetch } from "../../utils/fetch";
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";

const Notification = () => {
  const { theme, isDark } = useTheme();
  const { colors } = theme;
  const { t } = useTranslation();

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
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize] = useState(10);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    setPageIndex(0);
    setHasMore(true);
    await Promise.all([
      getNotifications(0, true),
      getUnreadNotifications(),
      getUnreadNotificationCount()
    ]);
  };

  // Refresh notifications when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      handleRefresh();
    }, [])
  );

  const handleGoBack = () => {
    navigation.navigate('HomeScreen');
  };
  const getNotifications = async (page = 0, isRefresh = false) => {
    if (page === 0 && !isRefresh) setLoading(true);
    else if (page > 0) setIsLoadingMore(true);

    try {
      const response = await getUserNotificationsFetch(token, page, pageSize);
      let newNotifications = [];
      if (Array.isArray(response)) {
        newNotifications = response;
      } else if (response && Array.isArray(response.data)) {
        newNotifications = response.data;
      }

      if (newNotifications.length < pageSize) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      if (page === 0) {
        setNotifications(newNotifications);
      } else {
        setNotifications(prev => {
          const prevailingIds = new Set(prev.map(i => i.id));
          const uniqueNew = newNotifications.filter(i => !prevailingIds.has(i.id));
          return [...prev, ...uniqueNew];
        });
      }
    } catch (error) {
      console.log('Error fetching notifications:', error);
      if (page === 0) setNotifications([]);
    } finally {
      if (page === 0) setLoading(false);
      setIsLoadingMore(false);
      setRefreshing(false);
    }
  };

  const handleLoadMore = () => {
    if (!hasMore || loading || isLoadingMore || selectedTab === 'unread') return;
    const nextPage = pageIndex + 1;
    setPageIndex(nextPage);
    getNotifications(nextPage);
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
      handleRefresh();
    } catch (error) {
      console.log('Error deleting notification:', error);
    }
  };

  const deleteSelectedNotifications = async () => {
    if (selectedNotifications.size === 0) return;

    Alert.alert(
      t('notifications.delete_title'),
      t('notifications.delete_confirm', { count: selectedNotifications.size }),
      [
        { text: t('notifications.cancel'), style: "cancel" },
        {
          text: t('notifications.delete_btn'),
          style: "destructive",
          onPress: async () => {
            const deletePromises = Array.from(selectedNotifications).map(id =>
              deleteNotification(id)
            );
            await Promise.all(deletePromises);
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

      handleRefresh();

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
        className="mb-3 p-4 rounded-xl"
        style={{
          backgroundColor: isSelected ? (isDark ? 'rgba(59, 130, 246, 0.15)' : '#f0f9ff') : colors.card,
          borderWidth: 2,
          borderColor: isSelected ? '#3b82f6' : colors.border,
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
                <Text className={`text-base ${!notification.isRead
                  ? 'font-redditsans-bold'
                  : 'font-redditsans-regular'
                  }`}
                  style={{ color: colors.text }}
                >
                  {notification.habitTitle ? t(`habits.${notification.habitTitle.toLowerCase().replace(/ /g, '_')}`, { defaultValue: t(`backend_notifications.${notification.habitTitle}`, { defaultValue: notification.habitTitle }) }) : ''}
                </Text>
              </View>
              <Text className={`text-sm ${!notification.isRead
                ? 'font-redditsans-medium'
                : 'font-redditsans-regular'
                }`}
                style={{ color: colors.textSecondary }}
              >
                {t(`backend_notifications.${notification.message}`, { defaultValue: notification.message })}
              </Text>
            </View>
          </View>

          {/* Right side - Unread indicator and timestamp */}
          <View className="items-end">
            {!notification.isRead && !isSelectionMode && (
              <View className="w-3 h-3 bg-green-500 rounded-full mb-2" />
            )}
            <Text className="text-xs font-redditsans-regular" style={{ color: colors.textSecondary }}>
              {notification.createdAt
                ? (() => {
                    const dateStr = notification.createdAt;
                    // Force 'Z' if missing to ensure UTC-to-local conversion
                    const isoStr = (dateStr.includes('T') || dateStr.includes(' ')) && !dateStr.endsWith('Z') && !dateStr.includes('+') 
                        ? dateStr.replace(' ', 'T') + 'Z' 
                        : dateStr;
                    return new Date(isoStr).toLocaleString('en-US', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    }).replace(',', '');
                  })()
                : 'N/A'
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
  const screenWidth = Dimensions.get('window').width;
  const scrollViewRef = React.useRef(null);

  const handleTabChange = (tab) => {
    setSelectedTab(tab);
    if (scrollViewRef.current) {
      if (tab === 'all') {
        scrollViewRef.current.scrollTo({ x: 0, animated: true });
      } else {
        scrollViewRef.current.scrollTo({ x: screenWidth, animated: true });
      }
    }
  };

  const handleScrollEnd = (e) => {
    const offset = e.nativeEvent.contentOffset.x;
    if (offset > screenWidth / 2) {
      if (selectedTab !== 'unread') setSelectedTab('unread');
    } else {
      if (selectedTab !== 'all') setSelectedTab('all');
    }
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <View className="pt-12 px-4 pb-4" style={{ backgroundColor: colors.background }}>
        <View className="flex-row items-center gap-4 mb-4">
          <TouchableOpacity onPress={handleGoBack}>
            <FontAwesomeIcon icon={faArrowLeft} size={20} color={colors.text} />
          </TouchableOpacity>
          <Text className="text-3xl mt-3 font-redditsans-bold mb-4" style={{ color: colors.text }}>
            {t('notifications.title')}
          </Text>
        </View>

        {/* Tabs */}
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center gap-6">
            {/* View All Tab */}
            <TouchableOpacity
              onPress={() => handleTabChange('all')}
              className="flex-row items-center"
            >
              <Text
                className="text-base font-redditsans-medium"
                style={{ color: selectedTab === 'all' ? colors.text : colors.textSecondary }}
              >
                {t('notifications.view_all')}
              </Text>
              {selectedTab === 'all' && (
                <View className="absolute -bottom-1 left-0 right-0 h-0.5 bg-green-500" />
              )}
            </TouchableOpacity>

            {/* Unread Tab */}
            <TouchableOpacity
              onPress={() => handleTabChange('unread')}
              className="flex-row items-center"
            >
              <Text
                className="text-base font-redditsans-medium"
                style={{ color: selectedTab === 'unread' ? colors.text : colors.textSecondary }}
              >
                {t('notifications.unread')}
              </Text>
              {unreadCount > 0 && (
                <View className="ml-2 rounded-full px-2 py-0.5" style={{ backgroundColor: colors.cardSecondary }}>
                  <Text className="text-xs font-redditsans-medium" style={{ color: colors.text }}>
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
                    {t('notifications.delete_count', { count: selectedNotifications.size })}
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
                    {t('notifications.cancel')}
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
                    {t('notifications.mark_all_read')}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>
        </View>
      </View>

      {/* Notifications List */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        className="flex-1"
      >
        <View style={{ width: screenWidth }}>
          <FlatList
            className="flex-1 px-4"
            showsVerticalScrollIndicator={false}
            data={notifications}
            keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
            renderItem={({ item, index }) => (
              <NotificationItem notification={item} index={index} />
            )}
            onRefresh={handleRefresh}
            refreshing={refreshing}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={() => (
              <View className="py-4 mt-2 mb-8">
                {isLoadingMore && <ActivityIndicator size="small" color="#22c55e" />}
              </View>
            )}
            ListEmptyComponent={() => (
              <View className="flex-1 items-center justify-center py-20">
                <Text className="font-redditsans-regular" style={{ color: colors.textSecondary }}>
                  {loading ? t('notifications.loading') : t('notifications.none_found')}
                </Text>
              </View>
            )}
          />
        </View>
        <View style={{ width: screenWidth }}>
          <FlatList
            className="flex-1 px-4"
            showsVerticalScrollIndicator={false}
            data={unreadNotifications}
            keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
            renderItem={({ item, index }) => (
              <NotificationItem notification={item} index={index} />
            )}
            onRefresh={handleRefresh}
            refreshing={refreshing}
            ListEmptyComponent={() => (
              <View className="flex-1 items-center justify-center py-20">
                <Text className="font-redditsans-regular" style={{ color: colors.textSecondary }}>
                  {loading ? t('notifications.loading') : t('notifications.none_found')}
                </Text>
              </View>
            )}
          />
        </View>
      </ScrollView>
    </View>
  );
};

export default Notification;
