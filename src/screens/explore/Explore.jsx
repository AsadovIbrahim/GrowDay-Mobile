import React, { useEffect, useState, useMemo, useRef } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, TextInput, Alert, Modal, TouchableWithoutFeedback } from "react-native";
import { useNavigation, useFocusEffect, useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
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


import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { getTranslatedHabit } from "../../utils/habitTranslations";

const AI_COACH_MIN_LEVEL = 3;
const AI_COACH_DAILY_LIMIT = 3;

const Explore = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
  const { colors } = theme;
  const { t, i18n } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [suggestedHabits, setSuggestedHabits] = useState([]);
  const [learningContent, setLearningContent] = useState([]);
  const [learningLoading, setLearningLoading] = useState(false);
  const [token] = useMMKVString('accessToken');
  const [hasSeenGamesIntro, setHasSeenGamesIntro] = useMMKVBoolean("hasSeenGamesIntro");
  const [showGamesIntroModal, setShowGamesIntroModal] = useState(false);
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

  const fetchXP = async () => {
    try {
      const [xpRes, accountRes] = await Promise.all([
        getUserTotalXPFetch(token),
        getAccountDataFetch(token).catch(() => null)
      ]);
      if (xpRes && xpRes.success) {
        setPoints(xpRes.data ?? 0);
      }
      if (accountRes && accountRes.success) {
        setTotalPoints(accountRes.data?.totalExperiencePoints ?? xpRes.data ?? 0);
      } else {
        setTotalPoints(xpRes.data ?? 0);
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

  useEffect(() => {
    if (token && !hasSeenGamesIntro) {
      const timer = setTimeout(() => {
        setShowGamesIntroModal(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [token, hasSeenGamesIntro]);

  const handleCloseGamesIntro = () => {
    setShowGamesIntroModal(false);
    setHasSeenGamesIntro(true);
    if (mainScrollViewRef.current && gamesLayoutY > 0) {
      setTimeout(() => {
        mainScrollViewRef.current?.scrollTo({ y: gamesLayoutY - 20, animated: true });
      }, 300);
    }
  };

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
                  <Text className="font-redditsans-bold" style={{ color: colors.primary }}>{t("common.cancel")}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text className="text-3xl font-redditsans-bold" style={{ color: colors.text }}>{t("explore.header")}</Text>
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

          {/* Premium AI Coach Level-Locked Action Card */}
          <TouchableOpacity
            onPress={async () => {
              if (userLevel < AI_COACH_MIN_LEVEL) {
                Alert.alert(
                  t("levelup.ai_locked_title"),
                  t("levelup.ai_locked_desc", { userLevel })
                );
              } else if (aiCount >= AI_COACH_DAILY_LIMIT) {
                Alert.alert(t("levelup.ai_limit_title"), t("levelup.ai_limit_desc"));
              } else {
                Alert.alert(
                  t("levelup.ai_confirm_title"),
                  t("levelup.ai_confirm_desc"),
                  [
                    { text: t("common.cancel"), style: "cancel" },
                    {
                      text: t("common.confirm"),
                      onPress: async () => {
                        const status = await generateNewSuggestedHabits();
                        if (status === "different") {
                          Alert.alert(
                            t("levelup.ai_success_title"),
                            t("levelup.ai_success_desc")
                          );
                        } else if (status === "same") {
                          Alert.alert(
                            t("levelup.ai_same_title"),
                            t("levelup.ai_same_desc")
                          );
                        }
                      },
                    },
                  ]
                );
              }
            }}
            className="p-4 rounded-3xl mb-6 flex-row items-center justify-between shadow-sm border"
            style={{
              backgroundColor: colors.card,
              borderColor: userLevel >= AI_COACH_MIN_LEVEL ? (aiCount >= AI_COACH_DAILY_LIMIT ? colors.danger + '30' : colors.primary + '30') : colors.border,
              marginHorizontal: 16,
            }}
            activeOpacity={0.8}
          >
            <View className="flex-row items-center flex-1">
              <View
                className="w-10 h-10 rounded-2xl items-center justify-center mr-3"
                style={{ backgroundColor: userLevel >= AI_COACH_MIN_LEVEL ? (aiCount >= AI_COACH_DAILY_LIMIT ? colors.danger + '15' : colors.primary + '15') : '#d9770615' }}
              >
                <FontAwesomeIcon
                  icon={userLevel >= AI_COACH_MIN_LEVEL ? faBrain : faLock}
                  color={userLevel >= AI_COACH_MIN_LEVEL ? (aiCount >= AI_COACH_DAILY_LIMIT ? colors.danger : colors.primary) : '#d97706'}
                  size={18}
                />
              </View>
              <View className="flex-1 pr-2">
                <Text style={{ color: colors.text }} className="text-sm font-redditsans-bold">
                  {t("levelup.ai_coach_title", "AI Fərdi Vərdiş Məşqçisi")}
                </Text>
                <Text style={{ color: colors.textSecondary }} className="text-[11px] font-redditsans-regular mt-0.5">
                  {userLevel >= AI_COACH_MIN_LEVEL
                    ? `${t("levelup.ai_coach_unlocked")} ${t("levelup.ai_coach_limit_remaining", { remaining: AI_COACH_DAILY_LIMIT - aiCount })}`
                    : t("levelup.ai_coach_locked")
                  }
                </Text>
              </View>
            </View>
            <View className="px-2.5 py-1 rounded-full" style={{ backgroundColor: userLevel >= AI_COACH_MIN_LEVEL ? (aiCount >= AI_COACH_DAILY_LIMIT ? colors.danger + '20' : colors.primary + '20') : '#d9770620' }}>
              <Text style={{ color: userLevel >= AI_COACH_MIN_LEVEL ? (aiCount >= AI_COACH_DAILY_LIMIT ? colors.danger : colors.primary) : '#d97706' }} className="text-[9px] font-redditsans-bold">
                {userLevel >= AI_COACH_MIN_LEVEL
                  ? (aiCount >= AI_COACH_DAILY_LIMIT ? t('levelup.ai_badge_limit') : t('levelup.ai_badge_active'))
                  : t('levelup.ai_badge_level')}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Suggested Habits Section */}
          <View className="px-4">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-redditsans-bold" style={{ color: colors.text }}>{t("explore.suggested_habits")}</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('SuggestedHabits')}
                className="flex-row items-center gap-1"
              >
                <Text className="text-sm text-green-600 font-redditsans-medium">{t("explore.view_all")}</Text>
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
                <Text style={{ color: colors.textSecondary }} className="font-redditsans-medium">
                  {t("levelup.generating_new_habits", "Generating new suggested habits...")}
                </Text>
              </View>
            ) : (filteredSuggestedHabits.length === 0) ? (
              <View className="py-6 px-4 mb-4 rounded-2xl mx-4 items-center justify-center" style={{ backgroundColor: colors.cardSecondary }}>
                <Text style={{ color: colors.textSecondary }} className="font-redditsans-regular italic">
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

          {/* Tasks Section */}
          <View className="px-4">
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-row items-center gap-2">
                <Text className="text-lg font-redditsans-bold" style={{ color: colors.text }}>{t("explore.tasks")}</Text>
                <FontAwesomeIcon icon={faStar} color="#FBBF24" size={16} />
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate('UserTasks')}
                className="flex-row items-center gap-1"
              >
                <Text className="text-green-600 font-redditsans-medium text-sm">{t("explore.view_all")}</Text>
                <FontAwesomeIcon icon={faChevronRight} color="#16a34a" size={14} />
              </TouchableOpacity>
            </View>
            <UserTasksList searchQuery={searchQuery} t={t} />


          </View>

          {/* Brain Games Section */}
          <View onLayout={(event) => {
            const layout = event.nativeEvent.layout;
            setGamesLayoutY(layout.y);
          }}>
            <View className="px-4 mb-4">
              <Text className="text-lg font-redditsans-bold" style={{ color: colors.text }}>🧠 {t("games.title")}</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="px-4 mb-4"
              contentContainerStyle={{ paddingRight: 40 }}
            >
              {/* Memory Game Card */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => navigation.navigate('MemoryGame')}
                className="mr-3 rounded-2xl p-4 justify-between"
                style={{
                  width: 250,
                  height: 160,
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 2
                }}
              >
                <View>
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-base font-redditsans-bold flex-1 mr-2" style={{ color: colors.text }} numberOfLines={1}>
                      🧩 {t("games.memory_match")}
                    </Text>
                    <View className="w-8 h-8 rounded-xl bg-green-100 dark:bg-green-900/30 items-center justify-center">
                      <Text className="text-base">🧩</Text>
                    </View>
                  </View>
                  <Text className="text-xs font-redditsans-regular mb-3" style={{ color: colors.textSecondary }} numberOfLines={2}>
                    {t("games.memory_match_desc")}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => navigation.navigate('GameLeaderboard', { gameType: 'MemoryMatch' })}
                  className="flex-row items-center gap-1 bg-yellow-100 dark:bg-yellow-950/20 py-1 px-3 rounded-full self-start"
                >
                  <Text className="text-[10px] text-yellow-600 font-redditsans-bold">🏆 {t("games.leaderboard")}</Text>
                </TouchableOpacity>
              </TouchableOpacity>

              {/* Sequence Game Card */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => navigation.navigate('SequenceGame')}
                className="mr-3 rounded-2xl p-4 justify-between"
                style={{
                  width: 250,
                  height: 160,
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 2
                }}
              >
                <View>
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-base font-redditsans-bold flex-1 mr-2" style={{ color: colors.text }} numberOfLines={1}>
                      ⚡ {t("games.sequence_memory")}
                    </Text>
                    <View className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 items-center justify-center">
                      <Text className="text-base">⚡</Text>
                    </View>
                  </View>
                  <Text className="text-xs font-redditsans-regular mb-3" style={{ color: colors.textSecondary }} numberOfLines={2}>
                    {t("games.sequence_memory_desc")}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => navigation.navigate('GameLeaderboard', { gameType: 'SequenceMemory' })}
                  className="flex-row items-center gap-1 bg-yellow-100 dark:bg-yellow-950/20 py-1 px-3 rounded-full self-start"
                >
                  <Text className="text-[10px] text-yellow-600 font-redditsans-bold">🏆 {t("games.leaderboard")}</Text>
                </TouchableOpacity>
              </TouchableOpacity>

              {/* Stroop Game Card */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => navigation.navigate('StroopGame')}
                className="mr-3 rounded-2xl p-4 justify-between"
                style={{
                  width: 250,
                  height: 160,
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 2
                }}
              >
                <View>
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-base font-redditsans-bold flex-1 mr-2" style={{ color: colors.text }} numberOfLines={1}>
                      🎨 {t("games.stroop_test")}
                    </Text>
                    <View className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/30 items-center justify-center">
                      <Text className="text-base">🎨</Text>
                    </View>
                  </View>
                  <Text className="text-xs font-redditsans-regular mb-3" style={{ color: colors.textSecondary }} numberOfLines={2}>
                    {t("games.stroop_test_desc")}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => navigation.navigate('GameLeaderboard', { gameType: 'StroopTest' })}
                  className="flex-row items-center gap-1 bg-yellow-100 dark:bg-yellow-950/20 py-1 px-3 rounded-full self-start"
                >
                  <Text className="text-[10px] text-yellow-600 font-redditsans-bold">🏆 {t("games.leaderboard")}</Text>
                </TouchableOpacity>
              </TouchableOpacity>

              {/* Reaction Game Card */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => navigation.navigate('ReactionGame')}
                className="mr-3 rounded-2xl p-4 justify-between"
                style={{
                  width: 250,
                  height: 160,
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 2
                }}
              >
                <View>
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-base font-redditsans-bold flex-1 mr-2" style={{ color: colors.text }} numberOfLines={1}>
                      ⏱️ {t("games.reaction_game")}
                    </Text>
                    <View className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/30 items-center justify-center">
                      <Text className="text-base">⏱️</Text>
                    </View>
                  </View>
                  <Text className="text-xs font-redditsans-regular mb-3" style={{ color: colors.textSecondary }} numberOfLines={2}>
                    {t("games.reaction_game_desc")}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => navigation.navigate('GameLeaderboard', { gameType: 'ReactionTime' })}
                  className="flex-row items-center gap-1 bg-yellow-100 dark:bg-yellow-950/20 py-1 px-3 rounded-full self-start"
                >
                  <Text className="text-[10px] text-yellow-600 font-redditsans-bold">🏆 {t("games.leaderboard")}</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Learning Section */}
          <View className="mb-6">
            <View className="px-4 mb-4">
              <Text className="text-lg font-redditsans-bold" style={{ color: colors.text }}>{t("explore.learning")}</Text>
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
          <AdBanner />
        </ScrollView>
      </SafeAreaView>

      {/* Games Introduction Bottom Sheet Modal */}
      <Modal
        visible={showGamesIntroModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseGamesIntro}
      >
        <TouchableWithoutFeedback onPress={handleCloseGamesIntro}>
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              justifyContent: 'flex-end',
            }}
          >
            <TouchableWithoutFeedback onPress={() => { }}>
              <View
                style={{
                  backgroundColor: colors.card,
                  borderTopLeftRadius: 30,
                  borderTopRightRadius: 30,
                  padding: 24,
                  paddingBottom: 40,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                {/* Drag Handle */}
                <View
                  style={{
                    width: 40,
                    height: 5,
                    backgroundColor: colors.textSecondary + '33',
                    borderRadius: 3,
                    alignSelf: 'center',
                    marginBottom: 20,
                  }}
                />

                {/* Title */}
                <Text
                  style={{
                    fontSize: 22,
                    fontFamily: 'RedditSans-Bold',
                    fontWeight: '800',
                    color: colors.text,
                    textAlign: 'center',
                    marginBottom: 10,
                  }}
                >
                  {t("explore.games_intro_title", "Discover Brain Games! 🧠")}
                </Text>

                {/* Description */}
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'RedditSans-Medium',
                    color: colors.textSecondary,
                    textAlign: 'center',
                    lineHeight: 20,
                    marginBottom: 20,
                  }}
                >
                  {t("explore.games_intro_desc", "Welcome to the Explore section! While GrowDay's main goal is to build strong habits, you can also play cognitive games here. Train your focus, memory, and reaction speed to earn extra XP and level up faster!")}
                </Text>

                {/* Games List Showcase */}
                <View style={{ gap: 10, marginBottom: 24 }}>
                  {/* Memory Match */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: colors.cardSecondary || 'rgba(0,0,0,0.03)',
                      padding: 12,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        backgroundColor: 'rgba(76, 175, 102, 0.15)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                      }}
                    >
                      <Text style={{ fontSize: 20 }}>🧩</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: colors.text,
                          fontFamily: 'RedditSans-Bold',
                          fontWeight: '700',
                          fontSize: 14,
                        }}
                      >
                        {t("games.memory_match")}
                      </Text>
                      <Text
                        style={{
                          color: colors.textSecondary,
                          fontFamily: 'RedditSans-Regular',
                          fontSize: 11,
                          marginTop: 2,
                        }}
                        numberOfLines={1}
                      >
                        {t("games.memory_match_desc")}
                      </Text>
                    </View>
                  </View>

                  {/* Sequence Memory */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: colors.cardSecondary || 'rgba(0,0,0,0.03)',
                      padding: 12,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        backgroundColor: 'rgba(99, 102, 241, 0.15)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                      }}
                    >
                      <Text style={{ fontSize: 20 }}>⚡</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: colors.text,
                          fontFamily: 'RedditSans-Bold',
                          fontWeight: '700',
                          fontSize: 14,
                        }}
                      >
                        {t("games.sequence_memory")}
                      </Text>
                      <Text
                        style={{
                          color: colors.textSecondary,
                          fontFamily: 'RedditSans-Regular',
                          fontSize: 11,
                          marginTop: 2,
                        }}
                        numberOfLines={1}
                      >
                        {t("games.sequence_memory_desc")}
                      </Text>
                    </View>
                  </View>

                  {/* Stroop Test */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: colors.cardSecondary || 'rgba(0,0,0,0.03)',
                      padding: 12,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        backgroundColor: 'rgba(168, 85, 247, 0.15)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                      }}
                    >
                      <Text style={{ fontSize: 20 }}>🎨</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: colors.text,
                          fontFamily: 'RedditSans-Bold',
                          fontWeight: '700',
                          fontSize: 14,
                        }}
                      >
                        {t("games.stroop_test")}
                      </Text>
                      <Text
                        style={{
                          color: colors.textSecondary,
                          fontFamily: 'RedditSans-Regular',
                          fontSize: 11,
                          marginTop: 2,
                        }}
                        numberOfLines={1}
                      >
                        {t("games.stroop_test_desc")}
                      </Text>
                    </View>
                  </View>

                  {/* Reaction Time */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: colors.cardSecondary || 'rgba(0,0,0,0.03)',
                      padding: 12,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        backgroundColor: 'rgba(59, 130, 246, 0.15)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                      }}
                    >
                      <Text style={{ fontSize: 20 }}>⏱️</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: colors.text,
                          fontFamily: 'RedditSans-Bold',
                          fontWeight: '700',
                          fontSize: 14,
                        }}
                      >
                        {t("games.reaction_game")}
                      </Text>
                      <Text
                        style={{
                          color: colors.textSecondary,
                          fontFamily: 'RedditSans-Regular',
                          fontSize: 11,
                          marginTop: 2,
                        }}
                        numberOfLines={1}
                      >
                        {t("games.reaction_game_desc")}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Confirm/Play Button */}
                <TouchableOpacity onPress={handleCloseGamesIntro} activeOpacity={0.8}>
                  <LinearGradient
                    colors={[colors.primaryLight || '#4caf66', colors.primary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      borderRadius: 20,
                      paddingVertical: 15,
                      shadowColor: colors.primary,
                      shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: 0.25,
                      shadowRadius: 8,
                      elevation: 5,
                    }}
                  >
                    <Text
                      style={{
                        color: 'white',
                        textAlign: 'center',
                        fontFamily: 'RedditSans-Bold',
                        fontWeight: '800',
                        fontSize: 16,
                      }}
                    >
                      {t("explore.games_intro_button", "Let's Play!")}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      <TournamentClaimPopup colors={colors} onRewardClaimed={fetchXP} />
    </LinearGradient>
  );
};

export default Explore;
