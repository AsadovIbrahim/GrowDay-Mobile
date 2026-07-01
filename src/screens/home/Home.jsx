import { View, Text, ScrollView, TouchableOpacity, TextInput, Animated, Dimensions, Modal, ActivityIndicator, Alert, Image, StyleSheet as RNStyleSheet, StatusBar } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { getUserHabitFetch, getAccountDataFetch, getTodaysUserHabitFetch, getUnreadNotificationCountFetch, getUserHabitCountFetch, getDailyStatisticsFetch, submitMoodFetch, updateAccountFetch, getMoodHistoryFetch } from "../../utils/fetch";
import { useEffect, useState, useRef, useContext, useCallback, useMemo } from "react";
import { useMMKVString } from "react-native-mmkv";
import { storage, clearUserSession } from "../../utils/MMKVStore";
import { saveLocalMood } from "../../utils/MoodLocalStore";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  faStore,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import { MenuContext } from '../../context/MenuContext';
import HomeEmptyState from './HomeEmptyState';
import GettingStartedChecklist from './components/GettingStartedChecklist';
import CalendarSelector from './components/CalendarSelector';
import ProgressSummary from './components/ProgressSummary';
import HabitCard from '../../components/HabitCard';
import AdBanner from '../../components/AdBanner';
import AvatarWithBorder from '../../components/AvatarWithBorder';
import { faChartLine } from '@fortawesome/free-solid-svg-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AIMentorCard from '../../components/AIMentorCard';
import VirtualPlant from '../../components/VirtualPlant';
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
  const insets = useSafeAreaInsets();
  const today = new Date();
  const todayStr = getLocalDateString(today);
  const cachedDate = storage.getString("home.cached.date");
  const isCacheValid = cachedDate === todayStr;

  const [selectedDate, setSelectedDate] = useState(today.getDate());
  const [selectedDateObject, setSelectedDateObject] = useState(today);
  const [token] = useMMKVString('accessToken');
  
  const [todaysUserHabit, setTodaysUserHabit] = useState(() => {
    if (isCacheValid) {
      const cached = storage.getString("home.cached.todaysUserHabit");
      return cached ? JSON.parse(cached) : [];
    }
    return [];
  });
  
  const [userHabitCount, setUserHabitCount] = useState(() => {
    return storage.getNumber("home.cached.userHabitCount") || 0;
  });
  
  const [userHabits, setUserHabits] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [isInitialLoading, setIsInitialLoading] = useState(() => {
    const cachedAcc = storage.getString("home.cached.accountData");
    const cachedCount = storage.getNumber("home.cached.userHabitCount") || 0;
    return !cachedAcc || cachedCount === 0;
  });
  
  const [error, setError] = useState(null);
  const [pageIndex, setPageIndex] = useState(0);
  
  const [dailyStatistics, setDailyStatistics] = useState(() => {
    if (isCacheValid) {
      const cached = storage.getString("home.cached.dailyStatistics");
      return cached ? JSON.parse(cached) : null;
    }
    return null;
  });
  
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(() => {
    return storage.getNumber("home.cached.unreadNotificationCount") || 0;
  });
  
  const { isMenuOpen, setIsMenuOpen } = useContext(MenuContext);
  const slideAnim = useRef(new Animated.Value(-Dimensions.get('window').width * 0.7)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const { theme, isDark } = useTheme();
  const { colors } = theme;
  const { t } = useTranslation();

  const [accountData, setAccountData] = useState(() => {
    const cached = storage.getString("home.cached.accountData");
    return cached ? JSON.parse(cached) : null;
  });
  
  const firstName = accountData?.firstName;
  const email = accountData?.email;

  // Mood Tracking States & Functions
  const [userMoodEmoji, setUserMoodEmoji] = useMMKVString('user.moodEmoji');
  const [lastMoodDate, setLastMoodDate] = useMMKVString('user.lastMoodDate');
  const [moodModalVisible, setMoodModalVisible] = useState(false);
  const [moodToastMsg, setMoodToastMsg] = useState("");
  const moodFadeAnim = useRef(new Animated.Value(0)).current;
  const moodScaleAnim = useRef(new Animated.Value(0.3)).current;

  const activeEmoji = lastMoodDate === todayStr ? (userMoodEmoji || '😊') : '😊';
  const [isSyncingMood, setIsSyncingMood] = useState(lastMoodDate !== todayStr);

  const moods = [
    { emoji: "😄", label: t("home.mood_labels.energetic"), key: "energetic", color: "#F59E0B" },
    { emoji: "😊", label: t("home.mood_labels.happy"), key: "happy", color: "#EC4899" },
    { emoji: "😌", label: t("home.mood_labels.peaceful"), key: "peaceful", color: "#10B981" },
    { emoji: "😐", label: t("home.mood_labels.neutral"), key: "neutral", color: "#6B7280" },
    { emoji: "😔", label: t("home.mood_labels.sad"), key: "sad", color: "#8B5CF6" },
    { emoji: "😫", label: t("home.mood_labels.tired"), key: "tired", color: "#3B82F6" },
    { emoji: "😡", label: t("home.mood_labels.stressed"), key: "stressed", color: "#EF4444" },
  ];

  const handleMoodSelect = (mood) => {
    const isFirstTimeToday = lastMoodDate !== todayStr;

    // Save to local MMKV history (last 30 entries)
    saveLocalMood(token, mood.key, mood.emoji);

    // Save to active daily MMKV keys
    setUserMoodEmoji(mood.emoji);
    setLastMoodDate(todayStr);
    storage.set('user.lastMoodTimestamp', Date.now());
    setMoodModalVisible(false);

    // Attempt API submission
    submitMoodFetch(token, mood.key, mood.emoji)
      .then(res => {
        console.log('Successfully submitted mood to API:', res);
      })
      .catch(err => {
        console.log('API mood submission failed/skipped (hosted DB fallback active):', err);
      });

    if (isFirstTimeToday) {
      if (accountData) {
        setAccountData(prev => ({
          ...prev,
          totalExperiencePoints: (prev.totalExperiencePoints || 0) + 5
        }));
      }
      showMoodToast(`${t('home.mood_toast_saved')}\n${t('home.mood_toast_xp')}`);
    } else {
      showMoodToast(t('home.mood_saved'));
    }
  };

  const showMoodToast = (message) => {
    setMoodToastMsg(message);
    moodFadeAnim.setValue(0);
    moodScaleAnim.setValue(0.5);

    Animated.sequence([
      Animated.parallel([
        Animated.timing(moodFadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(moodScaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(2000),
      Animated.parallel([
        Animated.timing(moodFadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(moodScaleAnim, {
          toValue: 0.8,
          duration: 250,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      setMoodToastMsg("");
    });
  };

  const handleAwardBonusXP = async (xp, serverStorageKey) => {
    if (serverStorageKey && storage.getString(serverStorageKey) === "true") {
      return;
    }

    if (accountData) {
      setAccountData(prev => ({
        ...prev,
        totalExperiencePoints: (prev.totalExperiencePoints || 0) + xp
      }));
    }
    showMoodToast(`${t("home.checklist_success_title")}\n+${xp} XP`);

    try {
      const payload = {
        firstName: accountData?.firstName || '',
        lastName: accountData?.lastName || '',
        username: accountData?.username || accountData?.email || '',
        email: accountData?.email || '',
        profilePicture: accountData?.profilePicture || '',
        pushNotificationsEnabled: accountData?.pushNotificationsEnabled,
        soundAlertsEnabled: accountData?.soundAlertsEnabled,
        emailUpdatesEnabled: accountData?.emailUpdatesEnabled,
        dailyRemindersEnabled: accountData?.dailyRemindersEnabled,
        addExperiencePoints: xp
      };

      const response = await updateAccountFetch(token, payload);
      if (response && response.success) {
        console.log(`Successfully added ${xp} XP to server database.`);
        if (serverStorageKey) {
          storage.set(serverStorageKey, "true");
        }
        await fetchAccountData();
      } else {
        console.error("Failed to update account XP on server:", response?.message);
      }
    } catch (err) {
      console.error("Error updating account XP on server:", err);
    }
  };

  const handleAwardPlantXP = async (xp, message = null) => {
    if (accountData) {
      setAccountData(prev => ({
        ...prev,
        totalExperiencePoints: (prev.totalExperiencePoints || 0) + xp
      }));
    }
    showMoodToast(message || `+${xp} XP`);

    try {
      const payload = {
        firstName: accountData?.firstName || '',
        lastName: accountData?.lastName || '',
        username: accountData?.username || accountData?.email || '',
        email: accountData?.email || '',
        profilePicture: accountData?.profilePicture || '',
        pushNotificationsEnabled: accountData?.pushNotificationsEnabled,
        soundAlertsEnabled: accountData?.soundAlertsEnabled,
        emailUpdatesEnabled: accountData?.emailUpdatesEnabled,
        dailyRemindersEnabled: accountData?.dailyRemindersEnabled,
        addExperiencePoints: xp
      };

      const response = await updateAccountFetch(token, payload);
      if (response && response.success) {
        console.log(`Successfully added ${xp} XP from virtual plant to server database.`);
        await fetchAccountData();
      } else {
        console.error("Failed to update virtual plant XP on server:", response?.message);
      }
    } catch (err) {
      console.error("Error updating virtual plant XP on server:", err);
    }
  };

  // Sort today's habits so that uncompleted habits are bubbled to the top, and completed ones are placed at the bottom
  const sortedTodaysHabits = useMemo(() => {
    if (!todaysUserHabit || !Array.isArray(todaysUserHabit)) return [];
    return [...todaysUserHabit].sort((a, b) => {
      const aCompleted = a.status?.toLowerCase() === 'completed' || a.status?.toLowerCase() === 'done';
      const bCompleted = b.status?.toLowerCase() === 'completed' || b.status?.toLowerCase() === 'done';
      if (aCompleted && !bCompleted) return 1;
      if (!aCompleted && bCompleted) return -1;
      return 0;
    });
  }, [todaysUserHabit]);

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
      storage.set("home.cached.accountData", JSON.stringify(accountData.data));
      return accountData.data;
    } catch (error) {
      console.error("Failed to fetch account data", error);
      return null;
    }
  };
  const syncOnboardingStateWithServer = async (todaysHabits, fetchedAccountData) => {
    if (!token) return;
    try {
      // 1. Sync Onboarding Checklist Completion from virtualPlantState if stored on server
      const account = fetchedAccountData || accountData;
      if (account?.virtualPlantState) {
        try {
          const plantStateObj = JSON.parse(account.virtualPlantState);
          if (plantStateObj && plantStateObj.onboardingChecklistCompleted === true) {
            storage.set("user.checklist.habit_completed", "true");
            storage.set("user.checklist.create_habit_xp_awarded", "true");
            storage.set("user.checklist.create_habit_xp_awarded_server", "true");
            storage.set("user.checklist.complete_habit_xp_awarded", "true");
            storage.set("user.checklist.complete_habit_xp_awarded_server", "true");
            storage.set("user.onboarding_checklist_completed", "true");
            storage.set("user.onboarding_checklist_bonus_awarded", "true");
            storage.set("user.onboarding_checklist_bonus_awarded_server", "true");
          }
        } catch (e) {
          console.log("Error parsing virtualPlantState for onboarding checklist sync:", e);
        }
      }

      // 2. Sync Mood Today
      const moodHistoryRes = await getMoodHistoryFetch(token, 7);
      if (moodHistoryRes && moodHistoryRes.success && Array.isArray(moodHistoryRes.data)) {
        const todayEntry = moodHistoryRes.data.find(entry => {
          const entryDate = entry.date ? entry.date.split('T')[0] : '';
          return entryDate === todayStr;
        });
        if (todayEntry) {
          if (lastMoodDate !== todayStr) {
            setLastMoodDate(todayStr);
          }
          if (userMoodEmoji !== todayEntry.emoji) {
            setUserMoodEmoji(todayEntry.emoji);
          }
        }
      }

      // 3. Sync Habit Completion
      const habitCompletedCheck = storage.getString("user.checklist.habit_completed");
      const checklistCompleted = storage.getString("user.onboarding_checklist_completed");

      let hasCompletedToday = false;
      if (todaysHabits && Array.isArray(todaysHabits)) {
        hasCompletedToday = todaysHabits.some(habit => {
          const status = habit.status?.toLowerCase();
          return status === 'completed' || status === 'done';
        });
      }

      if (hasCompletedToday && habitCompletedCheck !== "true") {
        storage.set("user.checklist.habit_completed", "true");
      }

      if (checklistCompleted !== "true") {
        const habitsRes = await getUserHabitFetch(token, 0, 50);
        const habitsList = habitsRes && habitsRes.data ? (Array.isArray(habitsRes.data) ? habitsRes.data : []) : [];

        const hasAnyCompletedHabitPast = habitsList.some(habit => {
          return (habit.longestStreak || 0) > 0 || habit.lastCompletedDate !== null;
        });

        if (hasAnyCompletedHabitPast || hasCompletedToday) {
          storage.set("user.checklist.habit_completed", "true");
          storage.set("user.checklist.create_habit_xp_awarded", "true");
          storage.set("user.checklist.create_habit_xp_awarded_server", "true");
          storage.set("user.checklist.complete_habit_xp_awarded", "true");
          storage.set("user.checklist.complete_habit_xp_awarded_server", "true");
          storage.set("user.onboarding_checklist_completed", "true");
          storage.set("user.onboarding_checklist_bonus_awarded", "true");
          storage.set("user.onboarding_checklist_bonus_awarded_server", "true");
        }
      }
    } catch (err) {
      console.log("Error syncing onboarding state with server:", err);
    } finally {
      setIsSyncingMood(false);
    }
  };

  const fetchAllData = async () => {
    if (!token) return;
    setError(null);
    const isFirstLoad = !accountData || userHabitCount === 0;
    if (isFirstLoad) {
      setIsInitialLoading(true);
    }
    try {
      const results = await Promise.all([
        getUserHabitCount(),
        fetchAccountData(),
        getUnreadNotificationCount(),
        getDailyStatistics(),
        getTodaysUserHabit()
      ]);
      const todaysHabits = results[4];
      await syncOnboardingStateWithServer(todaysHabits, results[1]);
    } catch (err) {
      setError(err);
      setIsSyncingMood(false);
    } finally {
      if (isFirstLoad) {
        setIsInitialLoading(false);
      }
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAllData();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, selectedDateObject])
  );

  useEffect(() => {
    const { AppState } = require('react-native');
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        fetchAllData();
      }
    });
    return () => subscription.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, selectedDateObject]);

  useEffect(() => {
    const lastMoodTime = storage.getNumber('user.lastMoodTimestamp') || 0;
    const eighteenHoursPassed = Date.now() - lastMoodTime >= 18 * 60 * 60 * 1000;
    if (token && lastMoodDate !== todayStr && eighteenHoursPassed && !isSyncingMood) {
      const timer = setTimeout(() => {
        setMoodModalVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [token, lastMoodDate, todayStr, isSyncingMood]);

  const getTodaysUserHabit = async (pageIndex = 0, pageSize = 100) => {
    try {
      const dateStr = getLocalDateString(selectedDateObject);
      const response = await getTodaysUserHabitFetch(token, dateStr, pageIndex, pageSize);
      console.log('Todays user habit response:', response);
      setTodaysUserHabit(response.data);
      // Save to cache only if we are querying today's date
      const todayStr = getLocalDateString(new Date());
      if (dateStr === todayStr) {
        storage.set("home.cached.todaysUserHabit", JSON.stringify(response.data));
        storage.set("home.cached.date", todayStr);
      }
      // Run the sync utility to auto-complete background-completed timers
      import('../../utils/HabitTimerSync').then(({ syncActiveHabitTimers }) => {
        syncActiveHabitTimers(response.data, token, dateStr, navigation, () => {
          fetchAllData();
        });
      });
      return response.data;
    } catch (error) {
      console.log('Error fetching todays user habit:', error);
      setError(error);
      return [];
    }
  }
  const getDailyStatistics = async () => {
    try {
      const dateStr = getLocalDateString(selectedDateObject);
      const response = await getDailyStatisticsFetch(token, dateStr);
      setDailyStatistics(response.data);
      const todayStr = getLocalDateString(new Date());
      if (dateStr === todayStr) {
        storage.set("home.cached.dailyStatistics", JSON.stringify(response.data));
      }
    } catch (error) {
      setError(error);
    }
  }

  const getUserHabitCount = async () => {
    try {
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
      storage.set("home.cached.userHabitCount", count);
    } catch (error) {
      setError(error);
    }
  }
  const getUnreadNotificationCount = async () => {
    try {
      const response = await getUnreadNotificationCountFetch(token);
      console.log(response);
      setUnreadNotificationCount(response);
      storage.set("home.cached.unreadNotificationCount", response || 0);
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
    { id: 'statistics', label: t('statistics.header'), icon: faChartLine, route: 'Statistics' },
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
    <LinearGradient
      colors={colors.backgroundGradient}
      style={{ flex: 1, paddingTop: insets.top > 0 ? insets.top : 16 }}
      className="flex-1 px-1"
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />
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
        contentContainerStyle={{ paddingBottom: 160 }}
      >
        <View className="pt-4 flex-row justify-between items-center gap-2 px-4">
          <Text style={{ color: colors.text }} className="text-2xl font-redditsans-bold mb-1">
            {t('home.greeting', { name: firstName || 'User' })}
          </Text>
          <TouchableOpacity
            onPress={() => setMoodModalVisible(true)}
            style={{ backgroundColor: colors.primary }}
            className="w-10 h-10 rounded-full items-center justify-center active:scale-90"
          >
            <Text className="text-white text-lg">{activeEmoji}</Text>
          </TouchableOpacity>
        </View>
        <Text style={{ color: colors.text }} className="text-base font-redditsans-regular px-4 mb-3">
          {t('home.subtitle')}
        </Text>

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
          <HomeEmptyState
            accountData={accountData}
            onLogMoodPress={() => setMoodModalVisible(true)}
            onAwardBonusXP={handleAwardBonusXP}
          />
        ) : (
          <>
            <GettingStartedChecklist
              accountData={accountData}
              onLogMoodPress={() => setMoodModalVisible(true)}
              userHabitCount={userHabitCount}
              onAwardBonusXP={handleAwardBonusXP}
              todaysUserHabit={todaysUserHabit}
            />

            {accountData?.email ? (
              <VirtualPlant
                key={accountData.email.toLowerCase()}
                userId={accountData.email.toLowerCase()}
                virtualPlantState={accountData?.virtualPlantState}
                onSyncState={async (stateJson) => {
                  try {
                    const payload = {
                      firstName: accountData?.firstName || '',
                      lastName: accountData?.lastName || '',
                      username: accountData?.username || accountData?.email || '',
                      email: accountData?.email || '',
                      profilePicture: accountData?.profilePicture || '',
                      pushNotificationsEnabled: accountData?.pushNotificationsEnabled,
                      soundAlertsEnabled: accountData?.soundAlertsEnabled,
                      emailUpdatesEnabled: accountData?.emailUpdatesEnabled,
                      dailyRemindersEnabled: accountData?.dailyRemindersEnabled,
                      virtualPlantState: stateJson
                    };
                    const response = await updateAccountFetch(token, payload);
                    if (response && response.success) {
                      setAccountData(prev => prev ? { ...prev, virtualPlantState: stateJson } : null);
                    }
                  } catch (e) {
                    console.error("Error syncing Virtual Plant state:", e);
                  }
                }}
                totalExperiencePoints={accountData?.totalExperiencePoints}
                todaysUserHabit={todaysUserHabit}
                onRefresh={fetchAllData}
                onAwardXP={handleAwardPlantXP}
              />
            ) : null}

            {/* 1. Today's Habits Section */}
            <View className="px-4  mt-2">
              <View className="flex-row justify-between items-center mb-3">
                <View className="flex-1 mr-2">
                  <Text style={{ color: colors.text }} className="text-lg font-redditsans-bold" numberOfLines={1} ellipsizeMode="tail">
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
                  className="flex-row items-center gap-1 shrink-0"
                >
                  <Text style={{ color: colors.primary }} className="text-sm font-redditsans-medium">
                    {t('home.view_all')}
                  </Text>
                  <FontAwesomeIcon icon={faChevronRight} color={colors.primary} size={14} />
                </TouchableOpacity>
              </View>

              {sortedTodaysHabits && sortedTodaysHabits.slice(0, 4).map((habit, index) => (
                <HabitCard
                  key={habit.userHabitId || `habit-${index}`}
                  habit={habit}
                  index={index}
                  selectedDate={getLocalDateString(selectedDateObject)}
                />
              ))}
            </View>

            {/* 2. Calendar Selector */}
            <CalendarSelector
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
            />

            {/* 3. Progress Today Section */}
            <View className="px-4 mb-3 flex-row justify-between items-center">
              <Text style={{ color: colors.text }} className="text-lg font-redditsans-bold">
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

            {/* 4. AI Mentor Section */}
            <AIMentorCard totalExperiencePoints={accountData?.totalExperiencePoints} />

            {/* 5. Premium "Quote of the Day" Widget */}
            {accountData?.hasMotivationPack && dailyQuote && (
              <View style={{ marginHorizontal: 16, marginBottom: 16, marginTop: 4 }}>
                <LinearGradient
                  colors={isDark ? ['#1e293b', '#0f172a'] : ['#f0f9ff', '#e0f2fe']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    borderRadius: 18,
                    padding: 14, // Reduced padding from 18
                    borderWidth: 1,
                    borderColor: isDark ? '#334155' : '#bae6fd',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <View style={{
                      width: 24, height: 24, borderRadius: 8,
                      backgroundColor: isDark ? '#6366f120' : '#818cf820',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <FontAwesomeIcon icon={faQuoteRight} size={12} color={isDark ? '#a5b4fc' : '#6366f1'} />
                    </View>
                    <Text style={{
                      marginLeft: 8, fontSize: 12, fontFamily: 'RedditSans-Bold',
                      color: isDark ? '#a5b4fc' : '#6366f1',
                      letterSpacing: 0.5,
                    }}>
                      {t('home.quote_of_the_day', '✨ Günün Sitatı')}
                    </Text>
                  </View>

                  <Text style={{
                    fontSize: 14, lineHeight: 20,
                    fontFamily: 'RedditSans-MediumItalic',
                    color: isDark ? '#e2e8f0' : '#1e293b',
                    marginBottom: 4,
                  }}>
                    "{dailyQuote.text}"
                  </Text>

                  <Text style={{
                    fontSize: 11, fontFamily: 'RedditSans-Bold',
                    color: isDark ? '#94a3b8' : '#64748b',
                    textAlign: 'right',
                  }}>
                    — {dailyQuote.author}
                  </Text>
                </LinearGradient>
              </View>
            )}

            {/* 6. Ad Banner Section */}
            <AdBanner />
          </>
        )}
      </ScrollView>

      {/* Mood Selector Bottom Sheet */}
      <Modal
        visible={moodModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setMoodModalVisible(false)}
      >
        <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <TouchableOpacity
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            activeOpacity={1}
            onPress={() => setMoodModalVisible(false)}
          />

          <View className="w-full rounded-t-[28px] p-6 shadow-2xl relative" style={{ backgroundColor: colors.card, borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.border, paddingBottom: 36 }}>
            {/* Drag Handle Indicator */}
            <View
              style={{
                width: 40,
                height: 5,
                borderRadius: 2.5,
                backgroundColor: isDark ? '#4b5563' : '#d1d5db',
                alignSelf: 'center',
                marginBottom: 16
              }}
            />

            <TouchableOpacity
              onPress={() => setMoodModalVisible(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full items-center justify-center z-10"
              style={{ backgroundColor: colors.cardSecondary }}
            >
              <FontAwesomeIcon icon={faTimes} size={14} color={colors.textSecondary} />
            </TouchableOpacity>

            <Text className="text-xl font-redditsans-bold mb-1 text-center px-6" style={{ color: colors.text }}>
              {t("home.mood_title")}
            </Text>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginVertical: 20 }}>
              {moods.map((mood) => {
                const isSelected = lastMoodDate === todayStr && userMoodEmoji === mood.emoji;
                return (
                  <TouchableOpacity
                    key={mood.key}
                    onPress={() => handleMoodSelect(mood)}
                    className="items-center justify-center rounded-2xl py-3"
                    style={{
                      width: '21%',
                      aspectRatio: 0.85,
                      backgroundColor: isSelected ? mood.color + "25" : colors.cardSecondary,
                      borderWidth: 1,
                      borderColor: isSelected ? mood.color : colors.border
                    }}
                  >
                    <Text className="text-3xl mb-1">{mood.emoji}</Text>
                    <Text
                      className="text-xxs font-redditsans-bold text-center mt-1"
                      style={{ color: colors.text, fontSize: 10 }}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.7}
                    >
                      {mood.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {lastMoodDate !== todayStr && (
              <Text className="text-center font-redditsans-bold text-sm text-amber-500 mt-2">
                ✨ {t("home.mood_xp_earned")}
              </Text>
            )}
          </View>
        </View>
      </Modal>

      {/* Mood Toast Indicator */}
      {moodToastMsg ? (
        <Animated.View
          className="absolute top-1/4 left-[10%] right-[10%] bg-black/85 py-3 px-6 rounded-full items-center justify-center border shadow-xl z-[9999] pointer-events-none"
          style={{
            opacity: moodFadeAnim,
            transform: [{ scale: moodScaleAnim }],
            borderColor: colors.primary + "40",
          }}
        >
          <Text className="text-white text-sm font-redditsans-bold text-center">
            {moodToastMsg}
          </Text>
        </Animated.View>
      ) : null}

    </LinearGradient >
  );
};

export default Home;