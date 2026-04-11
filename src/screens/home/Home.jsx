import { View, Text, ScrollView, TouchableOpacity, TextInput, Animated, Dimensions, Modal, ActivityIndicator } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { getUserHabitFetch,getTodaysUserHabitFetch,getUnreadNotificationCountFetch, getUserHabitCountFetch, getDailyStatisticsFetch } from "../../utils/fetch";
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
  faChevronRight
} from '@fortawesome/free-solid-svg-icons';
import { MenuContext } from '../../context/MenuContext';
import HomeEmptyState from './HomeEmptyState';
import CalendarSelector from './components/CalendarSelector';
import ProgressSummary from './components/ProgressSummary';
import HabitCard from '../../components/HabitCard';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
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
  
  const firstName = storage.getString('firstName');

  const handleDateSelect = (day, fullDate) => {
    setSelectedDate(day);
    setSelectedDateObject(fullDate);
  };
  useFocusEffect(
    useCallback(() => {
      if (token) {
        getUserHabitCount();
        getUnreadNotificationCount();
        getDailyStatistics();
        getTodaysUserHabit();
      }
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
    { id: 'home', label: 'Home', icon: faHome, active: true, color: '#2f6f3f' },
    { id: 'explore', label: 'Explore', icon: faCompass, active: false, color: '#9ca3af' },
    { id: 'habits', label: 'Your Habits', icon: faWalking, active: false, color: '#9ca3af' },
    { id: 'achievements', label: 'Achievements', icon: faMedal, active: false, color: '#9ca3af' },
    { id: 'settings', label: 'Settings', icon: faGear, active: false, color: '#9ca3af' },
  ];

  return (
    <LinearGradient colors={["#e7f0df", "#2f6f3f"]} className="flex-1 px-1 pt-12">
      {isMenuOpen && (
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
          backgroundColor: '#ffffff',
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
        <View className="flex-1 pt-12 px-4">
          <TouchableOpacity
            onPress={toggleMenu}
            className="w-10 h-10 items-center justify-center mb-6"
          >
            <FontAwesomeIcon icon={faBars} color="#2f6f3f" size={20} />
          </TouchableOpacity>

          <View className="flex-1">
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => {
                  closeMenu();
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 16,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  marginBottom: 8,
                  backgroundColor: item.active ? '#e7f0df' : 'transparent',
                }}
              >
                <FontAwesomeIcon
                  icon={item.icon}
                  color={item.active ? '#2f6f3f' : item.color}
                  size={20}
                />
                <Text
                  className={`ml-4 text-base ${
                    item.active ? 'text-green-700 font-redditsans-bold' : 'text-gray-700 font-redditsans-regular'
                  }`}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={() => {
              closeMenu();
            }}
            className="flex-row items-center py-4 px-3 rounded-xl mb-4"
          >
            <FontAwesomeIcon icon={faRightFromBracket} color="#ef4444" size={20} />
            <Text className="ml-4 text-base text-red-500 font-redditsans-medium">
              Logout
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

     
        <View className="flex-row justify-between items-center mb-4 px-4">
          <TouchableOpacity
            onPress={toggleMenu}
            className="w-10 h-10 bg-white rounded-lg items-center justify-center"
          >
            <FontAwesomeIcon icon={faBars} color="#2f6f3f" size={20} />
          </TouchableOpacity>
          
          <View className="flex-row items-center gap-3">
            <View className="relative">
              <TouchableOpacity onPress={() => navigation.navigate('Notification')} className="w-10 h-10 bg-white rounded-full items-center justify-center">
                <FontAwesomeIcon icon={faBell} color="#2f6f3f" size={18} />
              </TouchableOpacity>
              {unreadNotificationCount > 0 && (
                <View className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full items-center justify-center border-2 border-white">
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
            <Text className="text-2xl font-redditsans-bold  text-black mb-1">
              Hi {firstName}!
            </Text>
            <View className="w-10 h-10 bg-green-500 rounded-full items-center justify-center">
                <Text className="text-white text-lg">😇</Text>
            </View>
        </View>
        <Text className="text-base text-black font-redditsans-regular px-4 mb-4">
          Let's make habits together!
        </Text>
          <CalendarSelector 
            selectedDate={selectedDate} 
            onDateSelect={handleDateSelect}
          />
        
        {isInitialLoading ? (
          <View className="px-4 py-12 items-center justify-center">
            <ActivityIndicator size="large" color="#2f6f3f" />
            <Text className="mt-4 text-base text-gray-600 font-redditsans-regular">
              Loading...
            </Text>
          </View>
        ) : (userHabitCount === 0) ? (
          <HomeEmptyState />
        ) : (
          <>

            
            <View className="px-4 mb-4 ">
              <View className="flex-row justify-between items-center mb-3">
                <View>
                  <Text className="text-xl font-redditsans-bold text-black">
                    {(() => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const selected = selectedDateObject ? new Date(selectedDateObject) : today;
                      selected.setHours(0, 0, 0, 0);
                      const isToday = selected.getTime() === today.getTime();
                      
                      if (isToday) return "Today's Habits";
                      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                      return `${dayNames[selected.getDay()]}'s Habits`;
                    })()}
                  </Text>
                  {(() => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const selected = selectedDateObject ? new Date(selectedDateObject) : today;
                    selected.setHours(0, 0, 0, 0);
                    if (selected.getTime() > today.getTime()) {
                      return (
                        <Text className="text-xs text-gray-500 font-redditsans-regular italic">
                          Viewing upcoming habits
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
                  <Text className="text-base text-green-600 font-redditsans-medium">
                    VIEW ALL
                  </Text>
                  <FontAwesomeIcon icon={faChevronRight} color="#16a34a" size={14} />
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