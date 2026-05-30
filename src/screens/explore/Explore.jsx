import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, TextInput, Alert } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faMinus, faChevronRight, faStar, faSearch, faTimes, faBrain, faLock } from '@fortawesome/free-solid-svg-icons';
import { getUserSuggestedHabitsFetch, getUserLearningContentFetch, regenerateSuggestedHabitsFetch, getUserTotalXPFetch } from "../../utils/fetch";
import { useMMKVString } from "react-native-mmkv";
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


import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { getTranslatedHabit } from "../../utils/habitTranslations";

const AI_COACH_MIN_LEVEL = 3;
const AI_COACH_DAILY_LIMIT = 3;

const Explore = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { colors } = theme;
  const { t, i18n } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [suggestedHabits, setSuggestedHabits] = useState([]);
  const [learningContent, setLearningContent] = useState([]);
  const [learningLoading, setLearningLoading] = useState(false);
  const [token] = useMMKVString('accessToken');
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [hasMore, setHasMore] = useState(true);
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isGeneratingHabits, setIsGeneratingHabits] = useState(false);
  const [points, setPoints] = useState(0);
  const [aiCount, setAiCount] = useState(0);
  const userLevel = Math.floor(Math.sqrt(points / 50)) + 1;

  const fetchXP = async () => {
    try {
      const xpRes = await getUserTotalXPFetch(token);
      if (xpRes && xpRes.success) {
        setPoints(xpRes.data ?? 0);
      }
    } catch (err) {
      console.log("Error loading XP in Explore:", err);
    }
  };

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
    if (token) getUserSuggestedHabits();
    if (token) getLearningContent();
  }, [pageIndex, token]);

  useFocusEffect(
    React.useCallback(() => {
      if (!token) return;
      fetchXP();
      syncAiCoachLimitFromStorage();
      setPageIndex(0);
      setHasMore(true);
      getUserSuggestedHabits();
      getLearningContent();
    }, [token])
  );

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
        setSuggestedHabits(prev => pageIndex === 0 ? response.data : [...prev, ...response.data]);
        if (pageIndex === 0) {
          saveSuggestedHabitsCache(response.data);
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
      setSuggestedHabits(habits);
      saveSuggestedHabitsCache(habits);
      setHasMore(habits.length >= pageSize);
      recordAiCoachGeneration();
      return true;
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
        frequency: habit.frequency || "Daily",
        targetValue: habit.targetValue || 1,
        unit: habit.unit || "times",
        incrementValue: habit.incrementValue || 1,
        durationInMinutes: habit.durationInMinutes,
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
                        const ok = await generateNewSuggestedHabits();
                        if (ok) {
                          Alert.alert(
                            t("levelup.ai_success_title"),
                            t("levelup.ai_success_desc")
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
          <View className="px-4 mb-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-redditsans-bold" style={{ color: colors.text }}>{t("explore.suggested_habits")}</Text>
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
        ) : (suggestedHabits.filter(h => getTranslatedHabit(h, i18n.language, t).title.toLowerCase().includes(searchQuery.toLowerCase())).length === 0) ? (
          <View className="py-6 px-4 mb-4 rounded-2xl mx-4 items-center justify-center" style={{ backgroundColor: colors.cardSecondary }}>
             <Text style={{ color: colors.textSecondary }} className="font-redditsans-regular italic">
               {searchQuery ? t("my_habits.no_habits_search") : t("explore.no_suggestions")}
             </Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="px-4 mb-6"
            contentContainerStyle={{ paddingRight: 40 }}
            onScroll={handleHorizontalScroll}
            scrollEventThrottle={16}
          >
            {suggestedHabits
              .filter(h => getTranslatedHabit(h, i18n.language, t).title.toLowerCase().includes(searchQuery.toLowerCase()))
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
            {loading && pageIndex !== 0 && (
              <View className="justify-center items-center px-4">
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            )}
          </ScrollView>
        )}
          </View>

          {/* Tasks Section */}
          <View className="px-4 mb-6">
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-row items-center gap-2">
                <Text className="text-xl font-redditsans-bold" style={{ color: colors.text }}>{t("explore.tasks")}</Text>
                <FontAwesomeIcon icon={faStar} color="#FBBF24" size={16} />
              </View>
              <TouchableOpacity 
                onPress={() => navigation.navigate('UserTasks')}
                className="flex-row items-center gap-1"
              >
                <Text className="text-base text-green-600 font-redditsans-medium">{t("explore.view_all")}</Text>
                <FontAwesomeIcon icon={faChevronRight} color="#16a34a" size={14} />
              </TouchableOpacity>
            </View>
            <UserTasksList searchQuery={searchQuery} t={t} />
            
            
          </View>

          {/* Brain Games Section */}
          <View className="mb-6">
            <View className="px-4 mb-4">
              <Text className="text-xl font-redditsans-bold" style={{ color: colors.text }}>🧠 {t("games.title")}</Text>
            </View>
            
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="px-4 mb-6"
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
                  backgroundColor: colors.cardSecondary,
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
                  backgroundColor: colors.cardSecondary,
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
                  backgroundColor: colors.cardSecondary,
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
                  backgroundColor: colors.cardSecondary,
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
              <Text className="text-xl font-redditsans-bold" style={{ color: colors.text }}>{t("explore.learning")}</Text>
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
    </LinearGradient>
  );
};

export default Explore;
