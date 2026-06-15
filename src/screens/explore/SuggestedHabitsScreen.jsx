import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, TextInput } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faArrowLeft, faSearch, faTimes } from "@fortawesome/free-solid-svg-icons";
import { useMMKVString } from "react-native-mmkv";
import { storage } from "../../utils/MMKVStore";
import { getUserSuggestedHabitsFetch, getUserHabitFetch, getCategoriesFetch } from "../../utils/fetch";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { getTranslatedHabit, getTranslatedCategory } from "../../utils/habitTranslations";
import { ICONS } from "../../constants/icons";


const CATEGORY_ICON_MAP = {
  default: "⭐", health: "❤️", fitness: "💪", mindfulness: "🧘",
  productivity: "📈", learning: "📚", social: "👥", finance: "💰",
  nutrition: "🍎", sleep: "😴", creativity: "🎨", selfcare: "💅",
  hydration: "💧", work: "💼", music: "🎵", sports: "⚽",
  nature: "🌱", meditation: "🕊️", coding: "💻", travel: "✈️",
};

const getCategoryIcon = (iconKey) => {
  if (!iconKey) return "";
  if ([...iconKey].length <= 2 && iconKey.codePointAt(0) > 255) return iconKey;
  return CATEGORY_ICON_MAP[iconKey.toLowerCase()] || "";
};

const SuggestedHabitGridCard = ({ habit, onPress, colors, t, language }) => {
  const displayIcon = ICONS[habit.icon] || ICONS.default;
  const displayTitle = getTranslatedHabit(habit, language, t).title;

  const rawFrequency = habit.frequency || "Daily";
  const sanitizedFrequency = rawFrequency.trim();
  const frequencyKey = sanitizedFrequency.toLocaleLowerCase('en-US');

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="rounded-2xl overflow-hidden m-1.5 flex-1"
      style={{
        height: 96,
        backgroundColor: colors.card,
        borderWidth: 1.2,
        borderColor: colors.border + "18", // subtle high-end border outline
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
        elevation: 1,
      }}
    >
      <View className="flex-1 p-3.5 justify-between">
        <View className="flex-row items-center justify-between">
          <View
            className="w-9 h-9 rounded-xl items-center justify-center"
            style={{
              backgroundColor: colors.primary + "12", // tinted theme accent container
              borderWidth: 1,
              borderColor: colors.primary + "25",
            }}
          >
            <Text style={{ fontSize: 18 }}>{displayIcon}</Text>
          </View>
          
          <View 
            className="px-2 py-0.5 rounded-full items-center justify-center"
            style={{ 
              backgroundColor: colors.cardSecondary,
              borderWidth: 0.8,
              borderColor: colors.border + "12"
            }}
          >
            <Text className="text-[9px] font-redditsans-bold" style={{ color: colors.textSecondary }}>
              {t(`my_habits.filters.${frequencyKey}`, { defaultValue: sanitizedFrequency })}
            </Text>
          </View>
        </View>
        <View>
          <Text 
            className="text-[13px] font-redditsans-bold" 
            style={{ color: colors.text, lineHeight: 17 }}
            numberOfLines={2}
          >
            {displayTitle}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function SuggestedHabitsScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { colors } = theme;
  const { t, i18n } = useTranslation();
  const [token] = useMMKVString("accessToken");

  const [loading, setLoading] = useState(false);
  const [suggestedHabits, setSuggestedHabits] = useState([]);
  const [userHabits, setUserHabits] = useState([]);
  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 20; // Fetch more items per page on full screen
  const [hasMore, setHasMore] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("All");

  const fetchCategories = async () => {
    if (!token) return;
    try {
      const response = await getCategoriesFetch(token);
      if (response) {
        const list = Array.isArray(response) ? response : (response.data || []);
        setCategories(list);
      }
    } catch (error) {
      console.log("Error fetching categories in SuggestedHabitsScreen:", error);
    }
  };

  const fetchUserHabits = async () => {
    if (!token) return;
    try {
      const response = await getUserHabitFetch(token, 0, 100);
      if (response && response.data) {
        setUserHabits(response.data);
      }
    } catch (error) {
      console.log("Error fetching user habits in SuggestedHabitsScreen:", error);
    }
  };

  const getSuggestedHabits = async (page = 0) => {
    if (!token) return;
    try {
      setLoading(true);
      const response = await getUserSuggestedHabitsFetch(token, page, pageSize);
      if (response.data && response.data.length > 0) {
        const newData = response.data;
        setSuggestedHabits(prev => {
          const combined = page === 0 ? newData : [...prev, ...newData];
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
        if (newData.length < pageSize) {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
        if (page === 0) {
          setSuggestedHabits([]);
        }
      }
    } catch (error) {
      console.log("Error fetching suggested habits in SuggestedHabitsScreen:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setPageIndex(0);
      setHasMore(true);
      fetchCategories();
      fetchUserHabits().then(() => {
        getSuggestedHabits(0);
      });
    }, [token])
  );

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      const nextPage = pageIndex + 1;
      setPageIndex(nextPage);
      getSuggestedHabits(nextPage);
    }
  };

  const isHabitAlreadyAdded = (suggestedHabit, currentUserHabits) => {
    if (!currentUserHabits || currentUserHabits.length === 0) return false;

    const normalize = (str) => {
      if (!str) return "";
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

  const handleSuggestedHabitPress = (habit) => {
    // Remove immediately from UI for better feedback
    setSuggestedHabits(prev => prev.filter(h => h.id !== habit.id));

    navigation.navigate("CreateCustomHabit", {
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

      // Filter by Category (match ID or name fallback)
      if (selectedCategoryId !== "All") {
        const habitCatId = h.categoryId || h.categoryDetails?.id;
        const habitCatName = (h.category || h.categoryDetails?.name || "").toLowerCase();
        
        const selectedCatObj = categories.find(c => c.id === selectedCategoryId);
        const selectedCatName = selectedCatObj ? selectedCatObj.name?.toLowerCase() : "";
        
        if (habitCatId !== selectedCategoryId && habitCatName !== selectedCatName) {
          return false;
        }
      }

      // Filter by Search Query
      return title.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [suggestedHabits, userHabits, searchQuery, selectedCategoryId, categories, i18n.language, t]);

  const categoryTabs = useMemo(() => {
    return [{ id: "All", name: t("my_habits.filters.all") }, ...categories];
  }, [categories, t]);

  const renderCategoryItem = ({ item }) => {
    const isSelected = selectedCategoryId === item.id;
    const displayName = item.id === "All" ? item.name : getTranslatedCategory(item, i18n.language, t);
    
    return (
      <TouchableOpacity
        onPress={() => setSelectedCategoryId(item.id)}
        className="px-4 py-2 rounded-full mr-2 flex-row items-center gap-1.5"
        style={{
          backgroundColor: isSelected ? colors.primary : colors.cardSecondary,
        }}
      >
        <Text
          className="font-redditsans-bold text-xs"
          style={{ color: isSelected ? "#fff" : colors.textSecondary }}
        >
          {displayName}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient colors={colors.backgroundGradient} className="flex-1">
      <SafeAreaView className="flex-1" edges={["top", "left", "right"]}>
        {/* Header */}
        <View className="flex-row items-center px-4 py-3">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-10 h-10 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: colors.cardSecondary }}
          >
            <FontAwesomeIcon icon={faArrowLeft} size={18} color={colors.text} />
          </TouchableOpacity>
          <Text className="text-xl font-redditsans-bold" style={{ color: colors.text }}>
            {t("explore.suggested_habits")}
          </Text>
        </View>

        {/* Search Bar */}
        <View
          className="flex-row items-center rounded-2xl px-4 h-12 mx-4 mb-4 border"
          style={{ backgroundColor: colors.card, borderColor: colors.border + "30" }}
        >
          <FontAwesomeIcon icon={faSearch} size={16} color={colors.textSecondary} />
          <TextInput
            className="flex-1 ml-3 font-redditsans-medium text-sm"
            style={{ color: colors.text }}
            placeholder={t("my_habits.search_habits")}
            placeholderTextColor={colors.textSecondary + "80"}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <FontAwesomeIcon icon={faTimes} size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Categories Scroller */}
        <View className="mb-4">
          <FlatList
            data={categoryTabs}
            renderItem={renderCategoryItem}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          />
        </View>

        {/* Habits Grid */}
        <FlatList
          data={
            filteredSuggestedHabits.length % 2 === 0
              ? filteredSuggestedHabits
              : [...filteredSuggestedHabits, { id: "empty-placeholder", isEmptyPlaceholder: true }]
          }
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 40 }}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.2}
          renderItem={({ item }) => {
            if (item.isEmptyPlaceholder) {
              return <View className="m-1.5 flex-1" style={{ height: 96 }} />;
            }
            return (
              <SuggestedHabitGridCard
                habit={item}
                colors={colors}
                t={t}
                language={i18n.language}
                onPress={() => handleSuggestedHabitPress(item)}
              />
            );
          }}
          ListEmptyComponent={
            loading ? (
              <View className="py-12 items-center justify-center">
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : (
              <View className="py-12 items-center justify-center">
                <Text style={{ color: colors.textSecondary }} className="font-redditsans-regular italic text-center px-6">
                  {searchQuery ? t("my_habits.no_habits_search") : t("explore.no_suggestions")}
                </Text>
              </View>
            )
          }
          ListFooterComponent={
            loading && filteredSuggestedHabits.length > 0 ? (
              <View className="py-4 items-center justify-center">
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : null
          }
        />
      </SafeAreaView>
    </LinearGradient>
  );
}
