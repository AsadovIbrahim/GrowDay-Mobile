import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, TextInput } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faMinus, faChevronRight, faStar, faSearch, faTimes } from '@fortawesome/free-solid-svg-icons';
import { getUserSuggestedHabitsFetch, getUserLearningContentFetch, getUserPreferencesFetch, updateUserPreferencesWithAIFetch } from "../../utils/fetch";
import { useMMKVString } from "react-native-mmkv";
import UserTasksList from "../../components/UserTasksList";
import LearningCard from "../../components/LearningCard";
import SuggestedHabitCard from "../../components/SuggestedHabitCard";
import HabitAddCard from "../../components/HabitAddCard";


import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";

const Explore = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { colors } = theme;
  const { t } = useTranslation();

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

  
  useEffect(() => {
    getUserSuggestedHabits();
    getLearningContent();
  }, [pageIndex]);

  useFocusEffect(
    React.useCallback(() => {
      setPageIndex(0);
      getUserSuggestedHabits();
      getLearningContent();
    }, [])
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
  

  const getUserSuggestedHabits = async (isRetry = false) => {
    if (!hasMore && pageIndex !== 0) return;
    try {
      setLoading(true);
      const response = await getUserSuggestedHabitsFetch(token, pageIndex, pageSize);
      if (response.data && response.data.length > 0) {
        setSuggestedHabits(prev => pageIndex === 0 ? response.data : [...prev, ...response.data]);
        if (response.data.length < pageSize) {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
        setSuggestedHabits([]);
        if (pageIndex === 0 && !isRetry && !searchQuery) {
          await generateNewSuggestedHabits();
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
    try {
      setIsGeneratingHabits(true);
      const prefsResponse = await getUserPreferencesFetch(token);
      if (prefsResponse && prefsResponse.data) {
        const data = prefsResponse.data;
        const payload = {
          wakeUpTime: data.wakeUpTime || "07:00:00",
          sleepTime: data.sleepTime || "22:00:00",
          procrestinateFrequency: data.procrestinateFrequency || data.procrastinationFrequency || "Sometimes",
          focusDifficulty: data.focusDifficulty || "Occasionally",
          motivationalFactors: data.motivationalFactors || "None",
          gender: data.gender || "Male",
          age: data.age || 25,
          mainGoal: data.mainGoal || "Productivity"
        };
        await updateUserPreferencesWithAIFetch(token, payload);
        
        // Re-fetch habits after generation
        const newResponse = await getUserSuggestedHabitsFetch(token, 0, pageSize);
        if (newResponse.data && newResponse.data.length > 0) {
          setSuggestedHabits(newResponse.data);
          setHasMore(newResponse.data.length >= pageSize);
        }
      }
    } catch (error) {
      console.log("Error generating new habits:", error);
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
    setSuggestedHabits(prev => prev.filter(h => h.id !== habit.id));
    
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
        durationInMinutes: habit.durationInMinutes
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
               {t("explore.generating_new_habits", "Generating new suggested habits...")}
             </Text>
          </View>
        ) : (suggestedHabits.filter(h => h.title?.toLowerCase().includes(searchQuery.toLowerCase())).length === 0) ? (
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
              .filter(h => h.title?.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((habit, index) => (
              <SuggestedHabitCard
                key={habit.id || `suggested-${index}`}
                name={habit.title}
                frequency={habit.frequency || "Daily"}
                icon={habit.icon || "🎯"}
                onPress={() => handleSuggestedHabitPress(habit)}
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
            <UserTasksList searchQuery={searchQuery} />
            
            
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

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default Explore;
