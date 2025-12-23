import { View, Text, ScrollView, TouchableOpacity, TextInput, Animated, Dimensions, Modal } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { getAllHabitsFetch, getUnreadNotificationCountFetch } from "../../utils/fetch";
import { useEffect } from "react";
import { useMMKVString } from "react-native-mmkv";
import { storage } from "../../utils/MMKVStore";
import { 
  faBars, 
  faBell, 
  faSearch,
  faDroplet,
  faWalking,
  faLeaf,
  faPlus,
  faCircle,
  faHome,
  faCompass,
  faMedal,
  faGear,
  faRightFromBracket
} from '@fortawesome/free-solid-svg-icons';
import { useState, useRef, useContext } from "react";
import Svg, { Circle } from 'react-native-svg';
import { MenuContext } from '../../context/MenuContext';

const Home = () => {
  const [selectedDate, setSelectedDate] = useState(3);
  const [token] = useMMKVString('accessToken');
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0); 
  const [totalPages, setTotalPages] = useState(0); 
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const { isMenuOpen, setIsMenuOpen } = useContext(MenuContext);
  const slideAnim = useRef(new Animated.Value(-Dimensions.get('window').width * 0.7)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  // Generate dates for the next 7 days
  const dates = [];
  const today = new Date();
  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  
  const firstName = storage.getString('firstName');
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push({
      day: date.getDate(),
      dayName: dayNames[date.getDay()],
      isSelected: i === 0
    });
  }
  useEffect(() => {
    getHabits();
    getUnreadNotificationCount();
  }, []);
  const getHabits = async () => {
    setLoading(true);
    try {
      const response = await getAllHabitsFetch(token,pageIndex,3);
      setHabits(response.data);
    } catch (error) {
      console.log(error);
      setError(error);
    } finally {
      setLoading(false);
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
              <TouchableOpacity className="w-10 h-10 bg-white rounded-full items-center justify-center">
                <FontAwesomeIcon icon={faBell} color="#2f6f3f" size={18} />
              </TouchableOpacity>
              <View className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full items-center justify-center border-2 border-white">
                <Text className="text-white text-xs font-redditsans-bold">{unreadNotificationCount}</Text>
              </View>
            </View>
            
          </View>
        </View>
           

        {/* Greeting */}
        <View className="pt-12 flex-row justify-between items-center gap-2 px-4">
            <Text className="text-2xl font-redditsans-bold  text-black mb-1">
              Hi {firstName}!
            </Text>
            <View className="w-10 h-10 bg-green-500 rounded-full items-center justify-center">
                <Text className="text-white text-lg">😇</Text>
            </View>
        </View>
        <Text className="text-base text-black font-redditsans-regular px-4">
          Let's make habits together!
        </Text>

      {/* Main Content */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Date Selector */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          className="px-4 py-4"
          contentContainerStyle={{ gap: 12 }}
        >
          {dates.map((date, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => setSelectedDate(date.day)}
              className={`px-4 py-3 rounded-2xl ${
                date.day === selectedDate ? 'bg-white border-2 border-blue-500' : 'bg-gray-100'
              }`}
              style={{
                shadowColor: date.day === selectedDate ? "#000" : "transparent",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: date.day === selectedDate ? 3 : 0,
              }}
            >
              <Text 
                className={`text-lg font-bold ${
                  date.day === selectedDate ? 'text-blue-500' : 'text-black'
                }`}
                style={{ fontFamily: 'redditsans-bold' }}
              >
                {date.day}
              </Text>
              <Text 
                className={`text-xs ${
                  date.day === selectedDate ? 'text-black' : 'text-gray-500'
                }`}
                style={{ fontFamily: 'redditsans-regular' }}
              >
                {date.dayName}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Search Bar */}
        <View className="px-4 mb-4">
          <View className="flex-row items-center bg-white rounded-xl px-4 py-3 border border-gray-200">
            <FontAwesomeIcon icon={faSearch} color="#9ca3af" size={18} />
            <TextInput
              placeholder="Search habits..."
              placeholderTextColor="#9ca3af"
              className="flex-1 ml-3 text-base"
              style={{ fontFamily: 'redditsans-regular' }}
            />
          </View>
        </View>

        {/* Habits Section */}
        <View className="px-4 mb-4">
          <View className="flex-row justify-between items-center mb-3">
            <Text 
              className="text-xl font-redditsans-bold text-black"
            >
              Habits
            </Text>
            <TouchableOpacity>
              <Text 
                className="text-base text-green-600 font-redditsans-medium"
              >
                VIEW ALL
              </Text>
            </TouchableOpacity>
          </View>

          {habits.map((habit) => (
            <View
              key={habit.id}
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
                  {habit.title}
                </Text>
                <Text 
                  className="text-sm text-gray-500 font-redditsans-regular"
                >
                  {habit.frequency}
                </Text>
              </View>
              
              <TouchableOpacity className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center">
                <FontAwesomeIcon icon={faPlus} color="#000" size={18} />
              </TouchableOpacity>
            </View>
          ))}
          {habits.length === 0 && (
            <View className="flex-1 items-center justify-center">
              <Text className="text-gray-500 font-redditsans-bold">
                No habits found
              </Text>
            </View>
          )}
        </View> 

        {/* Progress Summary */}
        <View className="px-4 mb-6">
          <View className="flex-row gap-3">
            {/* Completed Card */}
            <View 
              className="flex-1 bg-white rounded-xl p-4 flex-row items-center"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <View className="relative w-16 h-16 mr-3 items-center justify-center">
                <Svg width={64} height={64} style={{ position: 'absolute' }}>
                  {/* Background circle */}
                  <Circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                    fill="none"
                  />
                  {/* Progress circle - 75% */}
                  <Circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="#8bc37a"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 28}`}
                    strokeDashoffset={`${2 * Math.PI * 28 * (1 - 0.75)}`}
                    strokeLinecap="round"
                    transform="rotate(-90 32 32)"
                  />
                </Svg>
                <Text 
                  className="text-sm font-redditsans-bold text-black"
                >
                  75%
                </Text>
              </View>
              
              <View className="flex-1">
                <Text 
                  className="text-base font-redditsans-medium text-black mb-1"
                >
                  Completed
                </Text>
                <Text 
                  className="text-xs text-gray-500 font-redditsans-regular"
                >
                  92 Completed
                </Text>
              </View>
            </View>

            {/* Missed Card */}
            <View 
              className="flex-1 bg-white rounded-xl p-4 flex-row items-center"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <View className="relative w-16 h-16 mr-3 items-center justify-center">
                <Svg width={64} height={64} style={{ position: 'absolute' }}>
                  {/* Background circle */}
                  <Circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                    fill="none"
                  />
                  {/* Progress circle - 25% */}
                  <Circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="#ef4444"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 28}`}
                    strokeDashoffset={`${2 * Math.PI * 28 * (1 - 0.25)}`}
                    strokeLinecap="round"
                    transform="rotate(-90 32 32)"
                  />
                </Svg>
                <Text 
                  className="text-sm font-bold text-black"
                  style={{ fontFamily: 'redditsans-bold' }}
                >
                  25%
                </Text>
              </View>
              
              <View className="flex-1">
                <Text 
                  className="text-base font-semibold text-black mb-1"
                  style={{ fontFamily: 'redditsans-medium' }}
                >
                  Missed
                </Text>
                <Text 
                  className="text-xs text-gray-500"
                  style={{ fontFamily: 'redditsans-regular' }}
                >
                  20 Missed
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

export default Home;