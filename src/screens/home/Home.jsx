import { View, Text, ScrollView, TouchableOpacity, TextInput, Animated, Dimensions, Modal } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { getUserHabitFetch,getUnreadNotificationCountFetch, getUserHabitCountFetch, getDailyStatisticsFetch } from "../../utils/fetch";
import { useEffect } from "react";
import { useMMKVString } from "react-native-mmkv";
import { storage } from "../../utils/MMKVStore";
import { 
  faBars, 
  faBell, 
  faSearch,
  faWalking,
  faHome,
  faCompass,
  faMedal,
  faGear,
  faRightFromBracket
} from '@fortawesome/free-solid-svg-icons';
import { useState, useRef, useContext } from "react";
import { MenuContext } from '../../context/MenuContext';
import HomeEmptyState from './HomeEmptyState';
import CalendarSelector from './CalendarSelector';
import ProgressSummary from './ProgressSummary';
import { useNavigation } from '@react-navigation/native';
const Home = () => {
  const navigation = useNavigation();
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today.getDate());
  const [selectedDateObject, setSelectedDateObject] = useState(today);
  const [token] = useMMKVString('accessToken');
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
    // Refresh daily statistics when date changes
    if (userHabitCount > 0) {
      getDailyStatistics();
    }
  };
  useEffect(() => {
    getUserHabit();
    getUserHabitCount();
    getUnreadNotificationCount();
    getDailyStatistics();
  }, []);
  const getDailyStatistics = async () => {
    try {
      const response = await getDailyStatisticsFetch(token);
      console.log('Daily statistics response:', response);
      setDailyStatistics(response.data);
    } catch (error) {
      console.log('Error fetching daily statistics:', error);
      setError(error);
    }
  }
  const getUserHabit = async () => {
    try {
      const response = await getUserHabitFetch(token,pageIndex,3);
      console.log(response);
      setUserHabits(response.data || []);
    } catch (error) {
      console.log(error);
      setError(error);
    }
  }
  const getUserHabitCount = async () => {
    try {
      setIsInitialLoading(true);
      const response = await getUserHabitCountFetch(token);
      console.log('getUserHabitCount response =>', response);

      // Backend-dən gələn cavabı həqiqi ədədə çevirək (0, "0", { data: 0 } və s.)
      let count = 0;
      if (typeof response === 'number') {
        count = response;
      } else if (typeof response === 'string') {
        const parsed = parseInt(response, 10);
        count = isNaN(parsed) ? 0 : parsed;
      } else if (response && typeof response === 'object') {
        // Ən çox rast gəlinən struktur: { data: 0 } və ya { count: 0 }
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
      // Close menu
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
      // Open menu
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
      {/* Overlay */}
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

      {/* Offcanvas Menu */}
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
          {/* Hamburger Icon */}
          <TouchableOpacity
            onPress={toggleMenu}
            className="w-10 h-10 items-center justify-center mb-6"
          >
            <FontAwesomeIcon icon={faBars} color="#2f6f3f" size={20} />
          </TouchableOpacity>

          {/* Menu Items */}
          <View className="flex-1">
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => {
                  closeMenu();
                  // Add navigation logic here if needed
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

          {/* Logout */}
          <TouchableOpacity
            onPress={() => {
              closeMenu();
              // Add logout logic here
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

      {/* Header Section */}
        {/* Top Bar */}
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

      {/* Main Content */}
      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Greeting */}
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
        {/* Habits / Empty State Section */}
        {isInitialLoading ? (
          <View className="px-4 py-8 items-center justify-center">
            <Text className="text-base text-gray-600 font-redditsans-regular">
              Loading...
            </Text>
          </View>
        ) : (userHabitCount === 0) ? (
          <HomeEmptyState />
        ) : (
          <>
            {/* Calendar Selector */}
            <CalendarSelector 
              selectedDate={selectedDate} 
              onDateSelect={handleDateSelect}
            />

            
            {/* Habits Section */}
            <View className="px-4 mb-4">
              <View className="flex-row justify-between items-center mb-3">
                <Text 
                  className="text-xl font-redditsans-bold text-black"
                >
                 Your Habits
                </Text>
                <TouchableOpacity>
                  <Text 
                    className="text-base text-green-600 font-redditsans-medium"
                  >
                    VIEW ALL
                  </Text>
                </TouchableOpacity>
              </View>

              {userHabits && Array.isArray(userHabits) && userHabits.map((userHabit, index) => (
                <View
                  key={userHabit.id || `habit-${index}`}
                  className="bg-white rounded-xl p-4 mb-3 flex-row items-center"
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                >
                  <View className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center mr-3">
                  </View>
                  
                  <View className="flex-1">
                    <Text 
                      className="text-base font-redditsans-medium text-black mb-1"
                    >
                      {userHabit.title}
                    </Text>
                    <Text 
                      className="text-sm text-gray-500 font-redditsans-regular"
                    >
                      {userHabit.frequency}
                    </Text>
                  </View>
                  
                  
                </View>
              ))}
            </View> 

            {/* Progress Summary */}
            <ProgressSummary dailyStatistics={dailyStatistics} />
          </>
        )}
      </ScrollView>
    </LinearGradient>
  );
};

export default Home;