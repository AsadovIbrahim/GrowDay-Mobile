import { View, Text, ScrollView, TouchableOpacity, TextInput, Animated, Dimensions, Modal, ActivityIndicator, Alert } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { getUserHabitFetch,getAccountDataFetch,getTodaysUserHabitFetch,getUnreadNotificationCountFetch, getUserHabitCountFetch, getDailyStatisticsFetch } from "../../utils/fetch";
import { useEffect, useState, useRef, useContext, useCallback } from "react";
import { useMMKVString } from "react-native-mmkv";
import { storage } from "../../utils/MMKVStore";
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
  faStar as faStarSolid
} from '@fortawesome/free-solid-svg-icons';
import { MenuContext } from '../../context/MenuContext';
import HomeEmptyState from './HomeEmptyState';
import CalendarSelector from './components/CalendarSelector';
import ProgressSummary from './components/ProgressSummary';
import HabitCard from '../../components/HabitCard';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
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
  const firstName=accountData?.firstName;  
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
    }, [token, selectedDateObject])
  );

  const getTodaysUserHabit = async (pageIndex=0,pageSize=4) => {
    try {
      const dateStr = getLocalDateString(selectedDateObject);
      const response = await getTodaysUserHabitFetch(token, dateStr,pageIndex,pageSize);
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
      console.log('Daily statistics response:', response);
      setDailyStatistics(response.data);
    } catch (error) {
      console.log('Error fetching daily statistics:', error);
      setError(error);
    }
  }
  
  const getUserHabitCount = async () => {
    try {
      if (userHabitCount === 0) {
        setIsInitialLoading(true);
      }
      const response = await getUserHabitCountFetch(token);
      console.log('getUserHabitCount response =>', response);
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
      console.log(error);
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
    { id: 'home', label: t('menu.home'), icon: faHome, active: true, route: 'Home' },
    { id: 'explore', label: t('menu.explore'), icon: faCompass, active: false, route: 'Explore' },
    { id: 'habits', label: t('menu.habits'), icon: faWalking, active: false, route: 'UserHabits' },
    { id: 'achievements', label: t('menu.achievements'), icon: faMedal, active: false, route: 'Achievements' },
    { id: 'support', label: t('menu.support'), icon: faQuestionCircle, active: false, route: 'Profile', screen: 'ContactSupport' },
    { id: 'settings', label: t('menu.settings'), icon: faGear, active: false, route: 'Profile' },
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
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          style: "destructive",
          onPress: () => {
            storage.delete('accessToken');
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
            <View 
                style={{ backgroundColor: colors.primary + '20' }} 
                className="w-14 h-14 rounded-2xl items-center justify-center border border-white/10"
            >
                <FontAwesomeIcon icon={faUserCircle} color={colors.primary} size={32} />
            </View>
            <View className="ml-4 flex-1">
                <Text style={{ color: colors.text }} className="text-lg font-redditsans-bold" numberOfLines={1}>
                    {firstName || 'User'}
                </Text>
                <Text style={{ color: colors.textSecondary }} className="text-xs font-redditsans-regular">
                    {t('common.premium_member')}
                </Text>
            </View>
          </View>

          <View className="flex-1">
            {menuItems.map((item) => (
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
                  backgroundColor: item.active ? colors.primary + '15' : 'transparent',
                }}
              >
                <View className={`w-8 h-8 items-center justify-center rounded-lg ${item.active ? '' : ''}`}>
                    <FontAwesomeIcon
                      icon={item.icon}
                      color={item.active ? colors.primary : colors.textSecondary}
                      size={18}
                    />
                </View>
                <Text
                  style={{ color: item.active ? colors.primary : colors.textSecondary }}
                  className={`ml-3 text-base ${
                    item.active ? 'font-redditsans-bold' : 'font-redditsans-medium'
                  }`}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}

            <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 15, opacity: 0.3 }} />
            
            <TouchableOpacity
                onPress={() => {
                    closeMenu();
                    // Link to Privacy Policy
                }}
                className="flex-row items-center py-3 px-4"
            >
                <FontAwesomeIcon icon={faShieldAlt} color={colors.textMuted} size={16} />
                <Text style={{ color: colors.textSecondary }} className="ml-4 text-sm font-redditsans-regular">
                    {t('menu.legal')}
                </Text>
            </TouchableOpacity>
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
          
          <View className="flex-row items-center gap-3">
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

            <ProgressSummary dailyStatistics={dailyStatistics} />
          </>
        )}
      </ScrollView>
    </LinearGradient>
  );
};

export default Home;