import { View, Text, ScrollView, TouchableOpacity, TextInput, Animated, Dimensions, Modal, ActivityIndicator, Alert, Image, StyleSheet as RNStyleSheet } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { getUserHabitFetch, getAccountDataFetch, getTodaysUserHabitFetch, getUnreadNotificationCountFetch, getUserHabitCountFetch, getDailyStatisticsFetch } from "../../utils/fetch";
import { useEffect, useState, useRef, useContext, useCallback, useMemo } from "react";
import { useMMKVString } from "react-native-mmkv";
import { storage, clearUserSession } from "../../utils/MMKVStore";
import { ICONS } from "../../constants/icons";
import {
  faBars,
  faBell,
  faSearch,
  faWalking,
  faHome,
  faCompass,
  faMedal,
  faGear,
  faRightFromBracket,
  faChevronRight,
  faUserCircle,
  faQuestionCircle,
  faShieldAlt,
  faShareAlt,
  faStar as faStarSolid,
  faQuoteRight,
  faStore
} from '@fortawesome/free-solid-svg-icons';
import { MenuContext } from '../../context/MenuContext';
import HomeEmptyState from './HomeEmptyState';
import CalendarSelector from './components/CalendarSelector';
import ProgressSummary from './components/ProgressSummary';
import HabitCard from '../../components/HabitCard';
import AdBanner from '../../components/AdBanner';
import AvatarWithBorder from '../../components/AvatarWithBorder';
import { faChartLine } from '@fortawesome/free-solid-svg-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AIMentorCard from '../../components/AIMentorCard';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
const getLocalDateString = (d) => {
  if (!d) return null;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const Home = () => {
  const navigation = useNavigation();
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today.getDate());
  const [selectedDateObject, setSelectedDateObject] = useState(today);
  const [token] = useMMKVString('accessToken');
  const [todaysUserHabit, setTodaysUserHabit] = useState([]);
  const [userHabitCount, setUserHabitCount] = useState(0);
  const [userHabits, setUserHabits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [dailyStatistics, setDailyStatistics] = useState(null);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const { isMenuOpen, setIsMenuOpen } = useContext(MenuContext);
  const slideAnim = useRef(new Animated.Value(-Dimensions.get('window').width * 0.7)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const { theme, isDark } = useTheme();
  const { colors } = theme;
  const { t } = useTranslation();

  const [accountData, setAccountData] = useState(null);
  const firstName = accountData?.firstName;
  const email = accountData?.email;

  // Premium "Quote of the Day" — pick one quote per day using date as seed
  const dailyQuote = useMemo(() => {
    let quotes = t('notifications.motivation_quotes', { returnObjects: true });
    if (!Array.isArray(quotes) || quotes.length === 0) {
      quotes = [
        { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
        { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
        { text: "Action is the foundational key to all success.", author: "Pablo Picasso" },
        { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
        { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
        { text: "Your attitude determines how well you do it.", author: "Lou Holtz" },
        { text: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
      ];
    }
    const now = new Date();
    const seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
    return quotes[seed % quotes.length];
  }, [t]);
  const handleDateSelect = (day, fullDate) => {
    setSelectedDate(day);
    setSelectedDateObject(fullDate);
  };

  const fetchAccountData = async () => {
    try {
      const token = storage.getString("accessToken");
      const accountData = await getAccountDataFetch(token);
      setAccountData(accountData.data);
    } catch (error) {
      console.error("Failed to fetch account data", error);
    }
  };
  const fetchAllData = async () => {
    if (!token) return;
    setError(null);
    try {
      await Promise.all([
        getUserHabitCount(),
        fetchAccountData(),
        getUnreadNotificationCount(),
        getDailyStatistics(),
        getTodaysUserHabit()
      ]);
    } catch (err) {
      setError(err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAllData();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, selectedDateObject])
  );

  const getTodaysUserHabit = async (pageIndex = 0, pageSize = 4) => {
    try {
      const dateStr = getLocalDateString(selectedDateObject);
      const response = await getTodaysUserHabitFetch(token, dateStr, pageIndex, pageSize);
      console.log('Todays user habit response:', response);
      setTodaysUserHabit(response.data);
    } catch (error) {
      console.log('Error fetching todays user habit:', error);
      setError(error);
    }
  }
  const getDailyStatistics = async () => {
    try {
      const dateStr = getLocalDateString(selectedDateObject);
      const response = await getDailyStatisticsFetch(token, dateStr);
      setDailyStatistics(response.data);
    } catch (error) {
      setError(error);
    }
  }

  const getUserHabitCount = async () => {
    try {
      if (userHabitCount === 0) {
        setIsInitialLoading(true);
      }
      const response = await getUserHabitCountFetch(token);
      let count = 0;
      if (typeof response === 'number') {
        count = response;
      } else if (typeof response === 'string') {
        const parsed = parseInt(response, 10);
        count = isNaN(parsed) ? 0 : parsed;
      } else if (response && typeof response === 'object') {
        if (typeof response.data === 'number') {
          count = response.data;
        } else if (typeof response.count === 'number') {
          count = response.count;
        }
      }

      setUserHabitCount(count);
    } catch (error) {
      setError(error);
    } finally {
      setIsInitialLoading(false);
    }
  }
  const getUnreadNotificationCount = async () => {
    try {
      const response = await getUnreadNotificationCountFetch(token);
      console.log(response);
      setUnreadNotificationCount(response);
    } catch (error) {
      console.log(error);
      setError(error);
    }
  }

  const toggleMenu = () => {
    if (isMenuOpen) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -Dimensions.get('window').width * 0.7,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => setIsMenuOpen(false));
    } else {
      setIsMenuOpen(true);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const closeMenu = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -Dimensions.get('window').width * 0.7,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setIsMenuOpen(false));
  };


  const menuItems = [
    { id: 'home', label: t('menu.home'), icon: faHome, route: 'Home' },
    { id: 'explore', label: t('menu.explore'), icon: faCompass, route: 'Explore' },
    { id: 'habits', label: t('menu.habits'), icon: faWalking, route: 'UserHabits' },
    { id: 'statistics', label: t('statistics.header'), icon: faChartLine, route: 'Statistics' },
    { id: 'achievements', label: t('menu.achievements'), icon: faMedal, route: 'Achievements' },
    { id: 'store', label: t('store.header_title', 'XP Mağazası'), icon: faStore, route: 'Profile', screen: 'StoreScreen' },
    { id: 'settings', label: t('menu.settings'), icon: faGear, route: 'Profile' },
  ];

  const handleMenuPress = (item) => {
    closeMenu();
    if (item.route) {
      if (item.screen) {
        navigation.navigate(item.route, { screen: item.screen });
      } else {
        navigation.navigate(item.route);
      }
    }
  };

  const handleLogout = () => {
    closeMenu();
    Alert.alert(
      t('common.logout'),
      t('common.logout_confirm'),
      [
        { text: t('common.cancel'), style: "cancel" },
        {
          text: t('common.logout'),
          style: "destructive",
          onPress: () => {
            clearUserSession();
            // Navigation will automatically switch to AuthStack via Navigation.tsx
          }
        }
      ]
    );
  };

  return (
    <LinearGradient colors={colors.backgroundGradient} className="flex-1 px-1 pt-12">
      {isMenuOpen && (
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: colors.overlay,
            opacity: overlayOpacity,
            zIndex: 998,
          }}
        >
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={closeMenu}
          />
        </Animated.View>
      )}

      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: Dimensions.get('window').width * 0.7,
          backgroundColor: colors.card,
          zIndex: 999,
          transform: [{ translateX: slideAnim }],
          borderTopRightRadius: 20,
          borderBottomRightRadius: 20,
          shadowColor: '#000',
          shadowOffset: { width: 2, height: 0 },
          shadowOpacity: 0.25,
          shadowRadius: 10,
          elevation: 10,
        }}
      >
        <View className="flex-1 pt-14 px-4">
          {/* Profile Header */}
          <View className="flex-row items-center px-2 mb-8 mt-2">
            <AvatarWithBorder
              avatarUrl={accountData?.profilePicture}
              level={accountData?.hasPremiumBorder ? 999 : (storage.getNumber('user.activeBorder') || 1)}
              size={50}
            />
            <View className="ml-4 flex-1">
              <Text style={{ color: colors.text }} className="text-lg font-redditsans-bold" numberOfLines={1}>
                {firstName || 'User'}
              </Text>
              <Text style={{ color: colors.textSecondary }} className="text-xs font-redditsans-regular">
                {email || ''}
              </Text>
            </View>
          </View>

          <View className="flex-1">
            {menuItems.map((item) => {
              const isActive = item.id === 'home'; // Since we are on Home.jsx
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => handleMenuPress(item)}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    borderRadius: 16,
                    marginBottom: 6,
                    backgroundColor: isActive ? colors.primary + '15' : 'transparent',
                  }}
                >
                  <View className="w-8 h-8 items-center justify-center rounded-lg">
                    <FontAwesomeIcon
                      icon={item.icon}
                      color={isActive ? colors.primary : colors.textSecondary}
                      size={18}
                    />
                  </View>
                  <Text
                    style={{ color: isActive ? colors.primary : colors.textSecondary }}
                    className={`ml-3 text-base ${isActive ? 'font-redditsans-bold' : 'font-redditsans-medium'
                      }`}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View className="mt-auto pb-6">
            <TouchableOpacity
              onPress={handleLogout}
              className="flex-row items-center py-4 px-4 rounded-2xl mb-4 bg-red-500/10"
            >
              <FontAwesomeIcon icon={faRightFromBracket} color={colors.danger} size={18} />
              <Text style={{ color: colors.danger }} className="ml-4 text-base font-redditsans-bold">
                {t('common.logout')}
              </Text>
            </TouchableOpacity>

            <Text style={{ color: colors.textMuted }} className="text-center text-xs font-redditsans-light opacity-50">
              GrowDay v1.0.0
            </Text>
          </View>
        </View>
      </Animated.View>


      <View className="flex-row justify-between items-center mb-4 px-4">
        <TouchableOpacity
          onPress={toggleMenu}
          style={{ backgroundColor: colors.card }}
          className="w-10 h-10 rounded-lg items-center justify-center"
        >
          <FontAwesomeIcon icon={faBars} color={colors.text} size={20} />
        </TouchableOpacity>

        <View className="relative">
          <TouchableOpacity onPress={() => navigation.navigate('Notification')} style={{ backgroundColor: colors.card }} className="w-10 h-10 rounded-full items-center justify-center">
            <FontAwesomeIcon icon={faBell} color={colors.text} size={18} />
          </TouchableOpacity>
          {unreadNotificationCount > 0 && (
            <View style={{ backgroundColor: colors.danger, borderColor: colors.card }} className="absolute -top-1 -right-1 w-5 h-5 rounded-full items-center justify-center border-2">
              <Text className="text-white text-xs font-redditsans-bold">{unreadNotificationCount}</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View className="pt-12 flex-row justify-between items-center gap-2 px-4">
          <Text style={{ color: colors.text }} className="text-2xl font-redditsans-bold mb-1">
            {t('home.greeting', { name: firstName || 'User' })}
          </Text>
          <View style={{ backgroundColor: colors.primary }} className="w-10 h-10 rounded-full items-center justify-center">
            <Text className="text-white text-lg">😇</Text>
          </View>
        </View>
        <Text style={{ color: colors.text }} className="text-base font-redditsans-regular px-4 mb-4">
          {t('home.subtitle')}
        </Text>

        {/* Premium "Quote of the Day" Widget — only for Motivation Pack owners */}
        {accountData?.hasMotivationPack && dailyQuote && (
          <View style={{ marginHorizontal: 16, marginBottom: 14 }}>
            <LinearGradient
              colors={isDark ? ['#1e293b', '#0f172a'] : ['#f0f9ff', '#e0f2fe']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 18,
                padding: 18,
                borderWidth: 1,
                borderColor: isDark ? '#334155' : '#bae6fd',
              }}
            >
              {/* Header row */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <View style={{
                  width: 32, height: 32, borderRadius: 10,
                  backgroundColor: isDark ? '#6366f120' : '#818cf820',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <FontAwesomeIcon icon={faQuoteRight} size={14} color={isDark ? '#a5b4fc' : '#6366f1'} />
                </View>
                <Text style={{
                  marginLeft: 10, fontSize: 13, fontFamily: 'RedditSans-Bold',
                  color: isDark ? '#a5b4fc' : '#6366f1',
                  letterSpacing: 0.5,
                }}>
                  {t('home.quote_of_the_day', '✨ Günün Sitatı')}
                </Text>

              </View>

              {/* Quote text */}
              <Text style={{
                fontSize: 15, lineHeight: 23,
                fontFamily: 'RedditSans-MediumItalic',
                color: isDark ? '#e2e8f0' : '#1e293b',
                marginBottom: 8,
              }}>
                "{dailyQuote.text}"
              </Text>

              {/* Author */}
              <Text style={{
                fontSize: 12, fontFamily: 'RedditSans-Bold',
                color: isDark ? '#94a3b8' : '#64748b',
                textAlign: 'right',
              }}>
                — {dailyQuote.author}
              </Text>
            </LinearGradient>
          </View>
        )}

        <AIMentorCard totalExperiencePoints={accountData?.totalExperiencePoints} />

        <CalendarSelector
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
        />

        {isInitialLoading ? (
          <View className="px-4 py-12 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ color: colors.textSecondary }} className="mt-4 text-base font-redditsans-regular">
              {t('common.loading')}
            </Text>
          </View>
        ) : error ? (
          <View className="px-4 py-12 items-center justify-center">
            <Text style={{ color: colors.danger }} className="text-center font-redditsans-medium mb-6">
              {t('common.failed_load')}
            </Text>
            <TouchableOpacity
              onPress={fetchAllData}
              className="px-8 py-3 rounded-full"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-white font-redditsans-bold">{t('common.retry')}</Text>
            </TouchableOpacity>
          </View>
        ) : (userHabitCount === 0) ? (
          <HomeEmptyState />
        ) : (
          <>


            <View className="px-4 mb-4 ">
              <View className="flex-row justify-between items-center mb-3">
                <View>
                  <Text style={{ color: colors.text }} className="text-xl font-redditsans-bold">
                    {(() => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const selected = selectedDateObject ? new Date(selectedDateObject) : today;
                      selected.setHours(0, 0, 0, 0);
                      const isToday = selected.getTime() === today.getTime();

                      if (isToday) return t('home.todays_habits');
                      const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                      return t('home.days_habits', { day: t(`home.day_names.${dayKeys[selected.getDay()]}`) });
                    })()}
                  </Text>
                  {(() => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const selected = selectedDateObject ? new Date(selectedDateObject) : today;
                    selected.setHours(0, 0, 0, 0);
                    if (selected.getTime() > today.getTime()) {
                      return (
                        <Text style={{ color: colors.textMuted }} className="text-xs font-redditsans-regular italic">
                          {t('home.upcoming_habits')}
                        </Text>
                      );
                    }
                    return null;
                  })()}
                </View>
                <TouchableOpacity
                  onPress={() => navigation.navigate('UserHabits', { initialFilter: 'Today' })}
                  className="flex-row items-center gap-1"
                >
                  <Text style={{ color: colors.primary }} className="text-base font-redditsans-medium">
                    {t('home.view_all')}
                  </Text>
                  <FontAwesomeIcon icon={faChevronRight} color={colors.primary} size={14} />
                </TouchableOpacity>
              </View>

              {todaysUserHabit && Array.isArray(todaysUserHabit) && todaysUserHabit.map((habit, index) => (
                <HabitCard
                  key={habit.userHabitId || `habit-${index}`}
                  habit={habit}
                  index={index}
                  selectedDate={getLocalDateString(selectedDateObject)}
                />
              ))}
            </View>

            <View className="px-4 mb-4 flex-row justify-between items-center">
              <Text style={{ color: colors.text }} className="text-xl font-redditsans-bold">
                {(() => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const selected = selectedDateObject ? new Date(selectedDateObject) : today;
                  selected.setHours(0, 0, 0, 0);
                  const isToday = selected.getTime() === today.getTime();

                  if (isToday) return t('home.progress_today');
                  const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                  const dayName = t(`home.day_names.${dayKeys[selected.getDay()]}`);
                  return `${dayName} - ${t('common.progress', { defaultValue: 'Progress' })}`;
                })()}
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Statistics')}
                className="flex-row items-center gap-1"
              >
                <Text style={{ color: colors.primary }} className="text-sm font-redditsans-medium">
                  {t('home.view_all')}
                </Text>
                <FontAwesomeIcon icon={faChevronRight} color={colors.primary} size={12} />
              </TouchableOpacity>
            </View>
            <ProgressSummary dailyStatistics={dailyStatistics} />
            <AdBanner />
          </>
        )}
      </ScrollView>
    </LinearGradient >
  );
};

export default Home;