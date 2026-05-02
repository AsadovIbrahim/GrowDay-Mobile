import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faMinus, faChevronRight, faStar, faSearch } from '@fortawesome/free-solid-svg-icons';
import { getUserSuggestedHabitsFetch, getUserLearningContentFetch } from "../../utils/fetch";
import { useMMKVString } from "react-native-mmkv";
import UserTasksList from "../../components/UserTasksList";
import LearningCard from "../../components/LearningCard";
import SuggestedHabitCard from "../../components/SuggestedHabitCard";
import HabitAddCard from "../../components/HabitAddCard";
import HabitAddModal from "../../components/HabitAddModal";

import { useTheme } from "../../context/ThemeContext";

const Explore = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { colors } = theme;

  const [loading, setLoading] = useState(false);
  const [suggestedHabits, setSuggestedHabits] = useState([]);
  const [learningContent, setLearningContent] = useState([]);
  const [learningLoading, setLearningLoading] = useState(false);
  const [token] = useMMKVString('accessToken');
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(3);
  const [hasMore, setHasMore] = useState(true);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState(null);
  
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
  

  const getUserSuggestedHabits = async () => {
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
      }
    } catch (error) {
      console.log(error);
    }
    finally {
      setLoading(false);
    }
  }

  const handleHorizontalScroll = (event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isEndReached = layoutMeasurement.width + contentOffset.x >= contentSize.width - 50;

    if (isEndReached && !loading && hasMore) {
      setPageIndex(prev => prev + 1);
    }
  };

  const handleOpenAddModal = (habit) => {
    setSelectedHabit(habit);
    setIsAddModalVisible(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalVisible(false);
    setSelectedHabit(null);
  };

  const handleSubmitHabit = (payload) => {
    console.log("Add habit payload", payload);
    handleCloseAddModal();
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
        frequency: habit.frequency || "Daily"
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
              <Text className="text-3xl font-redditsans-bold" style={{ color: colors.text }}>Explore</Text>
            <TouchableOpacity 
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.cardSecondary }}
            >
              <FontAwesomeIcon icon={faSearch} size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Suggested Habits Section */}
          <View className="px-4 mb-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-redditsans-bold" style={{ color: colors.text }}>Suggested Habits</Text>
             
            </View>
            
            {loading && pageIndex === 0 ? (
          <View className="py-10 items-center justify-center">
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : suggestedHabits.length === 0 ? (
          <View className="py-6 px-4 mb-4 rounded-2xl mx-4 items-center justify-center" style={{ backgroundColor: colors.cardSecondary }}>
             <Text style={{ color: colors.textSecondary }} className="font-redditsans-regular italic">
               No suggestions available right now.
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
            {suggestedHabits.map((habit, index) => (
              <SuggestedHabitCard
                key={habit.id || `suggested-${index}`}
                name={habit.title}
                frequency={habit.frequency || "Daily"}
                icon={habit.icon || "🎯"}
                onPress={() => {
                  setSelectedHabit(habit);
                  setIsAddModalVisible(true);
                }}
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
                <Text className="text-xl font-redditsans-bold" style={{ color: colors.text }}>Tasks</Text>
                <FontAwesomeIcon icon={faStar} color="#FBBF24" size={16} />
              </View>
              <TouchableOpacity 
                onPress={() => navigation.navigate('UserTasks')}
                className="flex-row items-center gap-1"
              >
                <Text className="text-base text-green-600 font-redditsans-medium">VIEW ALL</Text>
                <FontAwesomeIcon icon={faChevronRight} color="#16a34a" size={14} />
              </TouchableOpacity>
            </View>
            <UserTasksList />
            
            
          </View>

          {/* Learning Section */}
          <View className="mb-6">
            <View className="px-4 mb-4">
              <Text className="text-xl font-redditsans-bold" style={{ color: colors.text }}>Learning</Text>
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
                learningContent.map((item) => (
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
        <HabitAddModal
          visible={isAddModalVisible}
          habit={selectedHabit}
          onClose={handleCloseAddModal}
          onSubmit={handleSubmitHabit}
        />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default Explore;
