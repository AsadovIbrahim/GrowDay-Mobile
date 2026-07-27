import React, { useEffect, useState, useMemo, useRef } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, TextInput, Alert, Modal, TouchableWithoutFeedback } from "react-native";
import { useNavigation, useFocusEffect, useRoute } from "@react-navigation/native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faMinus, faChevronRight, faStar, faSearch, faTimes, faBrain, faLock } from '@fortawesome/free-solid-svg-icons';
import { getUserSuggestedHabitsFetch, getUserLearningContentFetch, regenerateSuggestedHabitsFetch, getUserTotalXPFetch, getUserHabitFetch, getAccountDataFetch } from "../../utils/fetch";
import { useMMKVString, useMMKVBoolean } from "react-native-mmkv";
import { storage } from "../../utils/MMKVStore";
import {
  loadCachedSuggestedHabits,
  saveSuggestedHabitsCache,
  aiCoachCountKey,
  aiCoachDateKey,
} from "../../utils/suggestedHabitsCache";
import UserTasksList from "../../components/UserTasksList";
import LearningCard from "../../components/LearningCard";
import SuggestedHabitCard from "../../components/SuggestedHabitCard";
import HabitAddCard from "../../components/HabitAddCard";
import AdBanner from "../../components/AdBanner";
import TournamentClaimPopup from "../../components/TournamentClaimPopup";
import LifeBalanceGrid from "../../components/LifeBalanceGrid";
import MyGoalsAiQuests from "../../components/MyGoalsAiQuests";


import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { getTranslatedHabit } from "../../utils/habitTranslations";

const AI_COACH_MIN_LEVEL = 3;
const AI_COACH_DAILY_LIMIT = 3;

const getExploreTabTitle = (tabKey, lang) => {
  const langKey = lang ? lang.split('-')[0].toLowerCase() : 'en';
  const translations = {
    quests: {
      az: '🎯 Tapşırıqlar',
      tr: '🎯 Görevler',
      ru: '🎯 Квесты',
      en: '🎯 Quests',
      es: '🎯 Misiones',
      de: '🎯 Quests',
      fr: '🎯 Quêtes',
      it: '🎯 Missioni',
      ar: '🎯 المهام',
      zh: '🎯 任务',
    },
    life_balance: {
      az: '📊 Həyat Balansı',
      tr: '📊 Yaşam Dengesi',
      ru: '📊 Баланс жизни',
      en: '📊 Life Balance',
      es: '📊 Equilibrio de vida',
      de: '📊 Lebensbalance',
      fr: '📊 Équilibre de vie',
      it: '📊 Equilibrio di vita',
      ar: '📊 توازن الحياة',
      zh: '📊 生活平衡',
    },
    games: {
      az: '🧠 Oyunlar',
      tr: '🧠 Oyunlar',
      ru: '🧠 Игры',
      en: '🧠 Games',
      es: '🧠 Juegos',
      de: '🧠 Spiele',
      fr: '🧠 Jeux',
      it: '🧠 Giochi',
      ar: '🧠 الألعاب',
      zh: '🧠 游戏',
    },
  };

  const tabDict = translations[tabKey];
  return (tabDict && tabDict[langKey]) || (tabDict && tabDict.en) || tabKey;
};

const getGamePlayBtnText = (lang) => {
  const langKey = lang ? lang.split('-')[0].toLowerCase() : 'en';
  const translations = {
    az: 'Oyna 🎮',
    tr: 'Oyna 🎮',
    ru: 'Играть 🎮',
    en: 'Play 🎮',
    es: 'Jugar 🎮',
    de: 'Spielen 🎮',
    fr: 'Jouer 🎮',
    it: 'Gioca 🎮',
    ar: 'العب 🎮',
    zh: '开始游戏 🎮',
  };
  return translations[langKey] || translations.en;
};

const Explore = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme, isDark } = useTheme();
  const { colors } = theme;
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('life_balance'); // 'quests', 'life_balance', 'games'
  const [suggestedHabits, setSuggestedHabits] = useState([]);
  const [learningContent, setLearningContent] = useState([]);
  const [learningLoading, setLearningLoading] = useState(false);
  const [token] = useMMKVString('accessToken');
  const mainScrollViewRef = useRef(null);
  const [gamesLayoutY, setGamesLayoutY] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [hasMore, setHasMore] = useState(true);
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isGeneratingHabits, setIsGeneratingHabits] = useState(false);
  const [points, setPoints] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [aiCount, setAiCount] = useState(0);
  const [userHabits, setUserHabits] = useState([]);
  const calculationPoints = totalPoints > 0 ? totalPoints : points;
  const userLevel = Math.floor(Math.sqrt(calculationPoints / 50)) + 1;

  const fetchXP = async (earnedXP = 0) => {
    try {
      if (typeof earnedXP === 'number' && earnedXP > 0) {
        const currentSaved = storage.getNumber('user.totalPoints') || 0;
        const newLocal = currentSaved + earnedXP;
        storage.set('user.totalPoints', newLocal);
        setPoints(newLocal);
        setTotalPoints(newLocal);
      }
      const [xpRes, accountRes] = await Promise.all([
        getUserTotalXPFetch(token).catch(() => null),
        getAccountDataFetch(token).catch(() => null)
      ]);
      const serverXP = xpRes?.data ?? 0;
      const accountXP = accountRes?.data?.totalExperiencePoints ?? 0;
      const cachedLocalXP = storage.getNumber('user.totalPoints') || 0;
      const finalXP = Math.max(serverXP, accountXP, cachedLocalXP);

      if (finalXP > 0) {
        setPoints(finalXP);
        setTotalPoints(finalXP);
        storage.set('user.totalPoints', finalXP);
      }
    } catch (err) {
      console.log("Error loading XP in Explore:", err);
    }
  };

  const fetchUserHabits = async () => {
    if (!token) return;
    try {
      const response = await getUserHabitFetch(token, 0, 100);
      if (response && response.data) {
        setUserHabits(response.data);
        return response.data;
      }
    } catch (error) {
      console.log("Error fetching user habits in Explore:", error);
    }
    return [];
  };

  const isHabitAlreadyAdded = (suggestedHabit, currentUserHabits) => {
    if (!currentUserHabits || currentUserHabits.length === 0) return false;

    const normalize = (str) => {
      if (!str) return "";
      // Convert to lowercase and remove common punctuation/symbols and whitespace
      // This is more universal for multiple languages than stripping everything but specific letters
      return str.toString()
        .toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()\s]/g, "")
        .trim();
    };

    const { title: suggestedTitle } = getTranslatedHabit(suggestedHabit, i18n.language, t);
    const normalizedSuggested = normalize(suggestedTitle);
    const normalizedSuggestedRaw = normalize(suggestedHabit.title);
    const suggestedId = String(suggestedHabit.id);

    return currentUserHabits.some(userHabit => {
      if (
        String(userHabit.suggestedHabitId) === suggestedId ||
        String(userHabit.habitId) === suggestedId ||
        String(userHabit.id) === suggestedId
      ) {
        return true;
      }

      const { title: userHabitTitle } = getTranslatedHabit(userHabit, i18n.language, t);
      const normalizedUserHabit = normalize(userHabitTitle);
      const normalizedUserHabitRaw = normalize(userHabit.title);

      if (normalizedSuggested && normalizedUserHabit && normalizedSuggested === normalizedUserHabit) return true;
      if (normalizedSuggestedRaw && normalizedUserHabitRaw && normalizedSuggestedRaw === normalizedUserHabitRaw) return true;
      if (normalizedSuggested && normalizedUserHabitRaw && normalizedSuggested === normalizedUserHabitRaw) return true;
      if (normalizedSuggestedRaw && normalizedUserHabit && normalizedSuggestedRaw === normalizedUserHabit) return true;

      if (userHabit.habit) {
        const nestedHabitTitle = normalize(userHabit.habit.title);
        if (nestedHabitTitle && (nestedHabitTitle === normalizedSuggested || nestedHabitTitle === normalizedSuggestedRaw)) return true;
      }

      return false;
    });
  };

  const filteredSuggestedHabits = useMemo(() => {
    const seenIds = new Set();
    const seenTitles = new Set();
    return suggestedHabits.filter(h => {
      if (!h) return false;

      // Deduplicate by ID
      if (h.id) {
        if (seenIds.has(h.id)) return false;
        seenIds.add(h.id);
      }

      if (isHabitAlreadyAdded(h, userHabits)) return false;

      const { title } = getTranslatedHabit(h, i18n.language, t);
      const normalizedTitle = title ? title.trim().toLowerCase() : "";

      // Deduplicate by normalized Title to catch duplicate names
      if (normalizedTitle) {
        if (seenTitles.has(normalizedTitle)) return false;
        seenTitles.add(normalizedTitle);
      }

      return title.toLowerCase().includes(searchQuery.toLowerCase());
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestedHabits, userHabits, searchQuery, i18n.language, t]);

  const syncAiCoachLimitFromStorage = () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const lastDate = storage.getString(aiCoachDateKey());
      let count = storage.getNumber(aiCoachCountKey()) || 0;
      if (lastDate !== today) {
        count = 0;
        storage.set(aiCoachCountKey(), 0);
        storage.set(aiCoachDateKey(), today);
      }
      setAiCount(count);
    } catch (e) {
      console.log("Error loading AI count:", e);
    }
  };

  const recordAiCoachGeneration = () => {
    const today = new Date().toISOString().split('T')[0];
    const nextCount = aiCount + 1;
    storage.set(aiCoachCountKey(), nextCount);
    storage.set(aiCoachDateKey(), today);
    setAiCount(nextCount);
  };

  const showAiCoachError = (errorCode, fallbackMessage) => {
    if (errorCode === 'AI_COACH_LEVEL_LOCKED') {
      Alert.alert(
        t('levelup.ai_locked_title'),
        t('levelup.ai_locked_desc', { userLevel })
      );
      return;
    }
    if (errorCode === 'AI_COACH_DAILY_LIMIT_REACHED') {
      Alert.alert(t('levelup.ai_limit_title'), t('levelup.ai_limit_desc'));
      return;
    }
    Alert.alert(
      t('preferences.alerts.error_title', 'Error'),
      fallbackMessage || t('levelup.ai_generate_failed')
    );
  };

  useEffect(() => {
    fetchXP();
    syncAiCoachLimitFromStorage();
    if (token) {
      fetchUserHabits().then(() => {
        getUserSuggestedHabits();
      });
    }
    if (token) getLearningContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex, token]);

  useFocusEffect(
    React.useCallback(() => {
      if (!token) return;
      fetchXP();
      syncAiCoachLimitFromStorage();
      setPageIndex(0);
      setHasMore(true);
      fetchUserHabits().then(() => {
        getUserSuggestedHabits();
      });
      getLearningContent();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token])
  );

  useEffect(() => {
    if (route.params?.scrollToGames && mainScrollViewRef.current && gamesLayoutY > 0) {
      const timer = setTimeout(() => {
        mainScrollViewRef.current?.scrollTo({ y: gamesLayoutY - 20, animated: true });
        navigation.setParams({ scrollToGames: undefined });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [route.params?.scrollToGames, gamesLayoutY, navigation]);

  const getLearningContent = async () => {
    try {
      setLearningLoading(true);
      const response = await getUserLearningContentFetch(token);
      if (response && response.data) {
        setLearningContent(response.data);
      } else {
        // Fallback to static items if API fails or returns no data
        setLearningContent([
          {
            id: 1,
            title: "Why should we drink water often?",
            image: "https://images.unsplash.com/photo-1523362628745-0c100150b504?w=400"
          },
          {
            id: 2,
            title: "Benefits of regular walking",
            image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400"
          },
        ]);
      }
    } catch (error) {
      console.log("Error fetching learning content:", error);
    } finally {
      setLearningLoading(false);
    }
  };


  const getUserSuggestedHabits = async () => {
    if (!token) return;
    if (!hasMore && pageIndex !== 0) return;

    if (pageIndex === 0) {
      const cached = loadCachedSuggestedHabits();
      if (cached?.length) {
        setSuggestedHabits(cached);
      }
    }
    try {
      setLoading(true);
      const response = await getUserSuggestedHabitsFetch(token, pageIndex, pageSize);
      if (response.data && response.data.length > 0) {
        const newData = response.data;

        setSuggestedHabits(prev => {
          const combined = pageIndex === 0 ? newData : [...prev, ...newData];
          const unique = [];
          const seen = new Set();
          for (const item of combined) {
            if (item && item.id && !seen.has(item.id)) {
              seen.add(item.id);
              unique.push(item);
            }
          }
          return unique;
        });
        if (pageIndex === 0) {
          saveSuggestedHabitsCache(newData);
        }
        if (response.data.length < pageSize) {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
        if (pageIndex === 0) {
          setSuggestedHabits([]);
          saveSuggestedHabitsCache([]);
        }
      }
    } catch (error) {
      console.log(error);
    }
    finally {
      setLoading(false);
    }
  }

  const generateNewSuggestedHabits = async () => {
    if (!token) return false;
    try {
      setIsGeneratingHabits(true);

      await fetchUserHabits();

      const response = await regenerateSuggestedHabitsFetch(token);
      if (!response?.success) {
        showAiCoachError(response?.message, response?.message);
        return false;
      }
      const habits = response?.data;
      if (!habits?.length) {
        showAiCoachError('AI_GENERATION_FAILED');
        return false;
      }

      // Check if new habits are different from current suggestedHabits
      const currentIdsSet = new Set(suggestedHabits.map(h => String(h.id)).filter(Boolean));

      const currentTitlesSet = new Set();
      suggestedHabits.forEach(h => {
        if (h.title) currentTitlesSet.add(h.title.trim().toLowerCase());
        const { title: translated } = getTranslatedHabit(h, i18n.language, t);
        if (translated) currentTitlesSet.add(translated.trim().toLowerCase());
      });

      const isDifferent = habits.some(h => {
        const id = h.id ? String(h.id) : null;
        const idExists = id ? currentIdsSet.has(id) : false;
        if (idExists) return false;

        const title = h.title?.trim().toLowerCase() || "";
        const { title: translated } = getTranslatedHabit(h, i18n.language, t);
        const translatedTitle = translated?.trim().toLowerCase() || "";

        const titleExists = title ? currentTitlesSet.has(title) : false;
        const translatedTitleExists = translatedTitle ? currentTitlesSet.has(translatedTitle) : false;

        return !titleExists && !translatedTitleExists;
      });

      setSuggestedHabits(habits);
      saveSuggestedHabitsCache(habits);
      setHasMore(habits.length >= pageSize);

      if (isDifferent) {
        recordAiCoachGeneration();
        return "different";
      } else {
        return "same";
      }
    } catch (error) {
      console.log("Error generating new habits:", error);
      showAiCoachError(null);
      return false;
    } finally {
      setIsGeneratingHabits(false);
    }
  };

  const handleHorizontalScroll = (event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isEndReached = layoutMeasurement.width + contentOffset.x >= contentSize.width - 50;

    if (isEndReached && !loading && hasMore) {
      setPageIndex(prev => prev + 1);
    }
  };




  const handleSuggestedHabitPress = (habit) => {
    // Remove immediately from UI for better feedback
    setSuggestedHabits(prev => {
      const next = prev.filter(h => h.id !== habit.id);
      saveSuggestedHabitsCache(next);
      return next;
    });

    navigation.navigate('CreateCustomHabit', {
      habitData: {
        id: habit.id,
        title: habit.title,
        description: habit.description || habit.title,
        icon: habit.icon || "star",
        category: habit.category || "General",
        categoryId: habit.categoryId || null,
        frequency: habit.frequency || "Daily",
        targetValue: habit.targetValue || 1,
        unit: habit.unit || "times",
        incrementValue: habit.incrementValue || 1,
        durationInMinutes: habit.durationInMinutes,
        notificationTime: habit.notificationTime || habit.NotificationTime,
        titleTranslations: habit.titleTranslations || habit.TitleTranslations,
        descriptionTranslations: habit.descriptionTranslations || habit.DescriptionTranslations,
      },
      isCustom: false,
      isSuggested: true
    });
  };


  return (
    <LinearGradient colors={colors.backgroundGradient} className="flex-1">
      <SafeAreaView className="flex-1">
        <ScrollView
          ref={mainScrollViewRef}
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Header Section */}
          <View className="flex-row items-center justify-between px-4 pt-4 mb-6">
            {isSearching ? (
              <View
                className="flex-1 flex-row items-center rounded-2xl px-4 h-12 mr-2"
                style={{ backgroundColor: colors.cardSecondary }}
              >
                <FontAwesomeIcon icon={faSearch} size={16} color={colors.textSecondary} />
                <TextInput
                  className="flex-1 ml-3 font-redditsans-medium text-base"
                  style={{ color: colors.text }}
                  placeholder={t("explore.search_placeholder")}
                  placeholderTextColor={colors.textSecondary + '80'}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery("")}>
                    <FontAwesomeIcon icon={faTimes} size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => { setIsSearching(false); setSearchQuery(""); }}
                  className="ml-4"
                >
                  <Text className="font-redditsans-bold" style={{ color: colors.primary, fontFamily: 'RedditSans-Bold' }}>{t("common.cancel")}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text className="text-3xl font-redditsans-bold" style={{ color: colors.text, fontFamily: 'RedditSans-Bold' }}>{t("explore.header")}</Text>
                <TouchableOpacity
                  onPress={() => setIsSearching(true)}
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: colors.cardSecondary }}
                >
                  <FontAwesomeIcon icon={faSearch} size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Sub-navigation Segmented Control Tabs: Quests, Life Balance, Games */}
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(226, 232, 240, 0.8)',
              borderRadius: 24,
              padding: 4,
              marginHorizontal: 16,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
            }}
          >
            {/* Quests Tab */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('quests')}
              style={{
                flex: 1,
                paddingVertical: 10,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 20,
                overflow: 'hidden',
              }}
            >
              {activeTab === 'quests' && (
                <LinearGradient
                  colors={['#3B82F6', '#2563EB']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: 20,
                  }}
                />
              )}
              <Text
                style={{
                  fontFamily: 'RedditSans-Bold',
                  fontSize: 13,
                  color: activeTab === 'quests' ? '#FFFFFF' : colors.textSecondary,
                }}
              >
                {getExploreTabTitle('quests', i18n?.language)}
              </Text>
            </TouchableOpacity>

            {/* Life Balance Tab */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('life_balance')}
              style={{
                flex: 1,
                paddingVertical: 10,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 20,
                overflow: 'hidden',
              }}
            >
              {activeTab === 'life_balance' && (
                <LinearGradient
                  colors={['#6366F1', '#4F46E5']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: 20,
                  }}
                />
              )}
              <Text
                style={{
                  fontFamily: 'RedditSans-Bold',
                  fontSize: 13,
                  color: activeTab === 'life_balance' ? '#FFFFFF' : colors.textSecondary,
                }}
              >
                {getExploreTabTitle('life_balance', i18n?.language)}
              </Text>
            </TouchableOpacity>

            {/* Games Tab */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('games')}
              style={{
                flex: 1,
                paddingVertical: 10,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 20,
                overflow: 'hidden',
              }}
            >
              {activeTab === 'games' && (
                <LinearGradient
                  colors={['#8B5CF6', '#7C3AED']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: 20,
                  }}
                />
              )}
              <Text
                style={{
                  fontFamily: 'RedditSans-Bold',
                  fontSize: 13,
                  color: activeTab === 'games' ? '#FFFFFF' : colors.textSecondary,
                }}
              >
                {getExploreTabTitle('games', i18n?.language)}
              </Text>
            </TouchableOpacity>
          </View>

          {/* TAB 1: LIFE BALANCE (AI Mandala Matrix & Trends) */}
          {activeTab === 'life_balance' && (
            <View style={{ paddingHorizontal: 16 }}>
              <LifeBalanceGrid colors={colors} isDark={isDark} t={t} searchQuery={searchQuery} />
            </View>
          )}

          {/* TAB 2: QUESTS (Suggested Habits & Daily User Tasks) */}
          {activeTab === 'quests' && (
            <>
              {/* Suggested Habits Section */}
              <View className="px-4">
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-lg font-redditsans-bold" style={{ color: colors.text, fontFamily: 'RedditSans-Bold' }}>{t("explore.suggested_habits")}</Text>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('SuggestedHabits')}
                    className="flex-row items-center gap-1"
                  >
                    <Text className="text-sm text-green-600 font-redditsans-medium" style={{ fontFamily: 'RedditSans-Medium' }}>{t("explore.view_all")}</Text>
                    <FontAwesomeIcon icon={faChevronRight} color="#16a34a" size={14} />
                  </TouchableOpacity>
                </View>

                {loading && pageIndex === 0 ? (
                  <View className="py-10 items-center justify-center">
                    <ActivityIndicator size="small" color={colors.primary} />
                  </View>
                ) : isGeneratingHabits ? (
                  <View className="py-6 px-4 mb-4 rounded-2xl mx-4 items-center justify-center" style={{ backgroundColor: colors.cardSecondary }}>
                    <ActivityIndicator size="small" color={colors.primary} style={{ marginBottom: 8 }} />
                    <Text style={{ color: colors.textSecondary, fontFamily: 'RedditSans-Medium' }} className="font-redditsans-medium">
                      {t("levelup.generating_new_habits", "Generating new suggested habits...")}
                    </Text>
                  </View>
                ) : (filteredSuggestedHabits.length === 0) ? (
                  <View className="py-6 px-4 mb-4 rounded-2xl mx-4 items-center justify-center" style={{ backgroundColor: colors.cardSecondary }}>
                    <Text style={{ color: colors.textSecondary, fontFamily: 'RedditSans-Regular' }} className="font-redditsans-regular italic">
                      {searchQuery ? t("my_habits.no_habits_search") : t("explore.no_suggestions")}
                    </Text>
                  </View>
                ) : (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="mb-6"
                    contentContainerStyle={{ paddingRight: 40 }}
                  >
                    {filteredSuggestedHabits
                      .slice(0, 5)
                      .map((habit, index) => (
                        <SuggestedHabitCard
                          key={habit.id || `suggested-${index}`}
                          name={habit.title}
                          frequency={habit.frequency || "Daily"}
                          icon={habit.icon || "🎯"}
                          onPress={() => handleSuggestedHabitPress(habit)}
                          habit={habit}
                        />
                      ))}
                  </ScrollView>
                )}
              </View>

              {/* My Goals & AI Quests Section */}
              <View className="px-4">
                <MyGoalsAiQuests colors={colors} isDark={isDark} t={t} searchQuery={searchQuery} onTaskComplete={fetchXP} />
              </View>

              {/* Learning Section */}
              <View className="mb-6">
                <View className="px-4 mb-4">
                  <Text className="text-lg font-redditsans-bold" style={{ color: colors.text, fontFamily: 'RedditSans-Bold' }}>{t("explore.learning")}</Text>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 16, gap: 16 }}
                >
                  {learningLoading && learningContent.length === 0 ? (
                    <View className="items-center justify-center py-10" style={{ width: 220 }}>
                      <ActivityIndicator color={colors.primary} />
                    </View>
                  ) : (
                    learningContent
                      .filter(l => l.title?.toLowerCase().includes(searchQuery.toLowerCase()) || l.category?.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((item) => (
                        <View key={item.id} style={{ width: 220 }}>
                          <LearningCard
                            title={item.title}
                            image={item.imageUrl || item.image}
                            category={item.category}
                            onPress={() => navigation.navigate("ArticleDetail", { article: item })}
                          />
                        </View>
                      ))
                  )}
                </ScrollView>
              </View>
            </>
          )}

          {/* TAB 3: BRAIN GAMES */}
          {activeTab === 'games' && (
            <View onLayout={(event) => {
              const layout = event.nativeEvent.layout;
              setGamesLayoutY(layout.y);
            }}>
              <View className="px-4 mb-4">
                <Text className="text-lg font-redditsans-bold" style={{ color: colors.text, fontFamily: 'RedditSans-Bold' }}>{t("games.title")}</Text>
              </View>

              <View style={{ paddingHorizontal: 16, gap: 14, marginBottom: 24 }}>
                {/* 1. Memory Game Card */}
                {(!searchQuery || t("games.memory_match").toLowerCase().includes(searchQuery.toLowerCase()) || t("games.memory_match_desc").toLowerCase().includes(searchQuery.toLowerCase()) || "memory match".includes(searchQuery.toLowerCase())) && (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate('MemoryGame')}
                    style={{
                      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.75)' : '#FFFFFF',
                      borderRadius: 24,
                      padding: 18,
                      borderWidth: 1,
                      borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)',
                      shadowColor: '#10B981',
                      shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: isDark ? 0.25 : 0.08,
                      shadowRadius: 12,
                      elevation: 5,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                      <LinearGradient
                        colors={['#10B981', '#059669']}
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: 18,
                          alignItems: 'center',
                          justifyContent: 'center',
                          shadowColor: '#10B981',
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.3,
                          shadowRadius: 6,
                        }}
                      >
                        <Text style={{ fontSize: 24 }}>🧩</Text>
                      </LinearGradient>

                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 17, fontFamily: 'RedditSans-Bold', color: colors.text }}>
                          {t("games.memory_match")}
                        </Text>
                        <Text
                          style={{ fontSize: 12, color: colors.textSecondary, fontFamily: 'RedditSans-Regular', marginTop: 3 }}
                          numberOfLines={2}
                        >
                          {t("games.memory_match_desc")}
                        </Text>
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)' }}>
                      <TouchableOpacity
                        onPress={() => navigation.navigate('GameLeaderboard', { gameType: 'MemoryMatch' })}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                          backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.1)',
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: 'rgba(16, 185, 129, 0.25)',
                        }}
                      >
                        <Text style={{ fontSize: 12, fontFamily: 'RedditSans-Bold', color: '#10B981' }}>
                          🏆 {t("games.leaderboard")}
                        </Text>
                      </TouchableOpacity>

                      <View
                        style={{
                          backgroundColor: '#10B981',
                          paddingHorizontal: 18,
                          paddingVertical: 8,
                          borderRadius: 14,
                          alignItems: 'center',
                          justifyContent: 'center',
                          shadowColor: '#10B981',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.3,
                          shadowRadius: 4,
                          elevation: 3,
                        }}
                      >
                        <Text style={{ color: '#FFFFFF', fontSize: 13, fontFamily: 'RedditSans-Bold', includeFontPadding: false }}>
                          {getGamePlayBtnText(i18n?.language)}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                )}

                {/* 2. Sequence Game Card */}
                {(!searchQuery || t("games.sequence_memory").toLowerCase().includes(searchQuery.toLowerCase()) || t("games.sequence_memory_desc").toLowerCase().includes(searchQuery.toLowerCase()) || "sequence memory".includes(searchQuery.toLowerCase())) && (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate('SequenceGame')}
                    style={{
                      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.75)' : '#FFFFFF',
                      borderRadius: 24,
                      padding: 18,
                      borderWidth: 1,
                      borderColor: isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)',
                      shadowColor: '#3B82F6',
                      shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: isDark ? 0.25 : 0.08,
                      shadowRadius: 12,
                      elevation: 5,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                      <LinearGradient
                        colors={['#3B82F6', '#1D4ED8']}
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: 18,
                          alignItems: 'center',
                          justifyContent: 'center',
                          shadowColor: '#3B82F6',
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.3,
                          shadowRadius: 6,
                        }}
                      >
                        <Text style={{ fontSize: 24 }}>⚡</Text>
                      </LinearGradient>

                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 17, fontFamily: 'RedditSans-Bold', color: colors.text }}>
                          {t("games.sequence_memory")}
                        </Text>
                        <Text
                          style={{ fontSize: 12, color: colors.textSecondary, fontFamily: 'RedditSans-Regular', marginTop: 3 }}
                          numberOfLines={2}
                        >
                          {t("games.sequence_memory_desc")}
                        </Text>
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)' }}>
                      <TouchableOpacity
                        onPress={() => navigation.navigate('GameLeaderboard', { gameType: 'SequenceMemory' })}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                          backgroundColor: isDark ? 'rgba(59, 130, 246, 0.12)' : 'rgba(59, 130, 246, 0.1)',
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: 'rgba(59, 130, 246, 0.25)',
                        }}
                      >
                        <Text style={{ fontSize: 12, fontFamily: 'RedditSans-Bold', color: '#3B82F6' }}>
                          🏆 {t("games.leaderboard")}
                        </Text>
                      </TouchableOpacity>

                      <View
                        style={{
                          backgroundColor: '#3B82F6',
                          paddingHorizontal: 18,
                          paddingVertical: 8,
                          borderRadius: 14,
                          alignItems: 'center',
                          justifyContent: 'center',
                          shadowColor: '#3B82F6',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.3,
                          shadowRadius: 4,
                          elevation: 3,
                        }}
                      >
                        <Text style={{ color: '#FFFFFF', fontSize: 13, fontFamily: 'RedditSans-Bold', includeFontPadding: false }}>
                          {getGamePlayBtnText(i18n?.language)}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                )}

                {/* 3. Stroop Game Card */}
                {(!searchQuery || t("games.stroop_test").toLowerCase().includes(searchQuery.toLowerCase()) || t("games.stroop_test_desc").toLowerCase().includes(searchQuery.toLowerCase()) || "stroop test".includes(searchQuery.toLowerCase())) && (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate('StroopGame')}
                    style={{
                      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.75)' : '#FFFFFF',
                      borderRadius: 24,
                      padding: 18,
                      borderWidth: 1,
                      borderColor: isDark ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.2)',
                      shadowColor: '#8B5CF6',
                      shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: isDark ? 0.25 : 0.08,
                      shadowRadius: 12,
                      elevation: 5,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                      <LinearGradient
                        colors={['#8B5CF6', '#6D28D9']}
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: 18,
                          alignItems: 'center',
                          justifyContent: 'center',
                          shadowColor: '#8B5CF6',
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.3,
                          shadowRadius: 6,
                        }}
                      >
                        <Text style={{ fontSize: 24 }}>🎨</Text>
                      </LinearGradient>

                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 17, fontFamily: 'RedditSans-Bold', color: colors.text }}>
                          {t("games.stroop_test")}
                        </Text>
                        <Text
                          style={{ fontSize: 12, color: colors.textSecondary, fontFamily: 'RedditSans-Regular', marginTop: 3 }}
                          numberOfLines={2}
                        >
                          {t("games.stroop_test_desc")}
                        </Text>
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)' }}>
                      <TouchableOpacity
                        onPress={() => navigation.navigate('GameLeaderboard', { gameType: 'StroopTest' })}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                          backgroundColor: isDark ? 'rgba(139, 92, 246, 0.12)' : 'rgba(139, 92, 246, 0.1)',
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: 'rgba(139, 92, 246, 0.25)',
                        }}
                      >
                        <Text style={{ fontSize: 12, fontFamily: 'RedditSans-Bold', color: '#8B5CF6' }}>
                          🏆 {t("games.leaderboard")}
                        </Text>
                      </TouchableOpacity>

                      <View
                        style={{
                          backgroundColor: '#8B5CF6',
                          paddingHorizontal: 18,
                          paddingVertical: 8,
                          borderRadius: 14,
                          alignItems: 'center',
                          justifyContent: 'center',
                          shadowColor: '#8B5CF6',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.3,
                          shadowRadius: 4,
                          elevation: 3,
                        }}
                      >
                        <Text style={{ color: '#FFFFFF', fontSize: 13, fontFamily: 'RedditSans-Bold', includeFontPadding: false }}>
                          {getGamePlayBtnText(i18n?.language)}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                )}

                {/* 4. Reaction Game Card */}
                {(!searchQuery || t("games.reaction_game").toLowerCase().includes(searchQuery.toLowerCase()) || t("games.reaction_game_desc").toLowerCase().includes(searchQuery.toLowerCase()) || "reaction time".includes(searchQuery.toLowerCase())) && (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate('ReactionGame')}
                    style={{
                      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.75)' : '#FFFFFF',
                      borderRadius: 24,
                      padding: 18,
                      borderWidth: 1,
                      borderColor: isDark ? 'rgba(249, 115, 22, 0.3)' : 'rgba(249, 115, 22, 0.2)',
                      shadowColor: '#F97316',
                      shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: isDark ? 0.25 : 0.08,
                      shadowRadius: 12,
                      elevation: 5,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                      <LinearGradient
                        colors={['#F97316', '#C2410C']}
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: 18,
                          alignItems: 'center',
                          justifyContent: 'center',
                          shadowColor: '#F97316',
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.3,
                          shadowRadius: 6,
                        }}
                      >
                        <Text style={{ fontSize: 24 }}>⏱️</Text>
                      </LinearGradient>

                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 17, fontFamily: 'RedditSans-Bold', color: colors.text }}>
                          {t("games.reaction_game")}
                        </Text>
                        <Text
                          style={{ fontSize: 12, color: colors.textSecondary, fontFamily: 'RedditSans-Regular', marginTop: 3 }}
                          numberOfLines={2}
                        >
                          {t("games.reaction_game_desc")}
                        </Text>
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)' }}>
                      <TouchableOpacity
                        onPress={() => navigation.navigate('GameLeaderboard', { gameType: 'ReactionTime' })}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                          backgroundColor: isDark ? 'rgba(249, 115, 22, 0.12)' : 'rgba(249, 115, 22, 0.1)',
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: 'rgba(249, 115, 22, 0.25)',
                        }}
                      >
                        <Text style={{ fontSize: 12, fontFamily: 'RedditSans-Bold', color: '#F97316' }}>
                          🏆 {t("games.leaderboard")}
                        </Text>
                      </TouchableOpacity>

                      <View
                        style={{
                          backgroundColor: '#F97316',
                          paddingHorizontal: 18,
                          paddingVertical: 8,
                          borderRadius: 14,
                          alignItems: 'center',
                          justifyContent: 'center',
                          shadowColor: '#F97316',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.3,
                          shadowRadius: 4,
                          elevation: 3,
                        }}
                      >
                        <Text style={{ color: '#FFFFFF', fontSize: 13, fontFamily: 'RedditSans-Bold', includeFontPadding: false }}>
                          {getGamePlayBtnText(i18n?.language)}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
          <AdBanner />
        </ScrollView>
      </SafeAreaView>

      <TournamentClaimPopup colors={colors} onRewardClaimed={fetchXP} />
    </LinearGradient>
  );
};

export default Explore;
