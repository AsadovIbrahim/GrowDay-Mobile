import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Switch,
  StyleSheet,
  Modal,
  FlatList,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faArrowLeft, faChevronRight, faCalendarAlt, faClock, faLayerGroup, faCircleExclamation } from "@fortawesome/free-solid-svg-icons";
import LinearGradient from "react-native-linear-gradient";
import { useMMKVString } from "react-native-mmkv";
import { addCustomUserHabitFetch, addSuggestedHabitFetch, addUserHabitFetch, updateUserHabitFetch, getAccountDataFetch, getCategoriesFetch, createCategoryFetch } from "../../utils/fetch";
import { ICONS, PREMIUM_ICONS } from "../../constants/icons";
import { useTheme as useThemeConstants } from "../../constants/theme";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { getTranslatedHabit, getTranslatedCategory } from "../../utils/habitTranslations";



const UNITS = [
  "times",
  "reps",
  "steps",
  "minutes",
  "hours",
  "km",
  "m",
  "miles",
  "ml",
  "liters",
  "cups",
  "glasses",
  "pages",
  "chapters",
  "tasks",
  "Other",
];


const CATEGORY_ICONS = [
  { key: 'default', icon: '⭐' },
  { key: 'health', icon: '❤️' },
  { key: 'fitness', icon: '💪' },
  { key: 'mindfulness', icon: '🧘' },
  { key: 'productivity', icon: '📈' },
  { key: 'learning', icon: '📚' },
  { key: 'social', icon: '👥' },
  { key: 'finance', icon: '💰' },
  { key: 'nutrition', icon: '🍎' },
  { key: 'sleep', icon: '😴' },
  { key: 'creativity', icon: '🎨' },
  { key: 'selfcare', icon: '💅' },
  { key: 'hydration', icon: '💧' },
  { key: 'work', icon: '💼' },
  { key: 'music', icon: '🎵' },
  { key: 'sports', icon: '⚽' },
  { key: 'nature', icon: '🌱' },
  { key: 'meditation', icon: '🕊️' },
  { key: 'coding', icon: '💻' },
  { key: 'travel', icon: '✈️' },
];
// CATEGORY_ICONS array-inin altına bu funksiyanı əlavə edin
const getCategoryIcon = (iconKey) => {
  if (!iconKey) return '⭐';
  // User-in seçdiyi birbaşa emoji-dirsə (📦, 💧 kimi)
  if ([...iconKey].length <= 2 && iconKey.codePointAt(0) > 255) return iconKey;
  // Key-ə görə tap
  const found = CATEGORY_ICONS.find(i => i.key === iconKey.toLowerCase());
  return found ? found.icon : '⭐';
};

const PRESET_COLORS = [
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
  '#ec4899', '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#14b8a6', '#06b6d4', '#0ea5e9',
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));

const getLocalDateString = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const CreateCustomHabit = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { habitData = null, isCustom = true, isSuggested = false, isEditMode = false } = route.params || {};
  const [accessToken] = useMMKVString("accessToken");
  const { spacing, typography, radius } = useThemeConstants();
  const { theme, isDark } = useTheme();
  const { colors } = theme;
  const { t, i18n } = useTranslation();

  const navigateOnSuccess = () => {
    navigation.navigate("Home", { screen: "HomeScreen" });
  };

  // Core Fields
  const [title, setTitle] = useState(habitData?.title || "");
  const [description, setDescription] = useState(habitData?.description || "");
  const [icon, setIcon] = useState(habitData?.icon || "star");
  const [category, setCategory] = useState("General");
  const [categoryId, setCategoryId] = useState(habitData?.categoryId || null);
  const [categories, setCategories] = useState([]);
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryIcon, setNewCategoryIcon] = useState("📦");
  const [newCategoryColor, setNewCategoryColor] = useState("#3b82f6");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [showCustomUnitInput, setShowCustomUnitInput] = useState(false);
  const [tempCustomUnit, setTempCustomUnit] = useState("");

  // Goal & Tracking
  const [targetValue, setTargetValue] = useState(habitData?.targetValue?.toString() || "1");
  const [unit, setUnit] = useState(habitData?.unit || "times");
  const [frequency, setFrequency] = useState(habitData?.frequency || "Daily");
  const [selectedDays, setSelectedDays] = useState(["Mon"]);

  // Schedule
  const startDate = isEditMode && habitData?.startDate
    ? habitData.startDate.split('T')[0]
    : getLocalDateString();
  const endDate = isEditMode && habitData?.endDate
    ? habitData.endDate.split('T')[0]
    : "";

  // Reminders
  const [reminderEnabled, setReminderEnabled] = useState(!!habitData?.notificationTime);
  const [reminderTime, setReminderTime] = useState(habitData?.notificationTime || "09:30");

  const [isLoading, setIsLoading] = useState(false);
  const [showIconModal, setShowIconModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);

  const [tempDay, setTempDay] = useState(new Date().getDate().toString().padStart(2, '0'));
  const [tempMonth, setTempMonth] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [tempYear, setTempYear] = useState(new Date().getFullYear().toString());

  // Time Picker Temp State
  const [tempHours, setTempHours] = useState("09");
  const [tempMinutes, setTempMinutes] = useState("30");
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorModalTitle, setErrorModalTitle] = useState("");
  const [errorModalMessage, setErrorModalMessage] = useState("");

  const [hasCustomHabitIcon, setHasCustomHabitIcon] = useState(false);

  useEffect(() => {
    const checkPerks = async () => {
      if (accessToken) {
        try {
          const res = await getAccountDataFetch(accessToken);
          if (res?.success) {
            setHasCustomHabitIcon(res.data?.hasCustomHabitIcon ?? false);
          }
        } catch (e) {
          console.log("Error checking custom habit icon perk:", e);
        }
      }
    };
    checkPerks();
  }, [accessToken]);

  const fetchCategories = async () => {
    if (!accessToken) return;
    try {
      const response = await getCategoriesFetch(accessToken);
      if (response) {
        const list = Array.isArray(response) ? response : (response.data || []);
        setCategories(list);

        // Auto-match categoryId if editing/suggested with only category name
        if (habitData && !categoryId) {
          const matched = list.find(c => {
            const translatedName = getTranslatedCategory(c, i18n.language, t).toLowerCase();
            const originalName = c.name.toLowerCase();
            const habitCat = habitData.category?.toLowerCase();
            return translatedName === habitCat || originalName === habitCat;
          });
          if (matched) {
            setCategoryId(matched.id);
            setCategory(matched.name);
          }
        } else if (!categoryId && list.length > 0) {
          const general = list.find(c => c.name.toLowerCase() === "general" || getTranslatedCategory(c, i18n.language, t).toLowerCase() === "general") || list[0];
          setCategoryId(general.id);
          setCategory(general.name);
        }
      }
    } catch (e) {
      console.log("Error loading categories:", e);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [accessToken]);

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert(t("common.error"), "Category name is required.");
      return;
    }

    setIsCreatingCategory(true);
    try {
      const payload = {
        name: newCategoryName.trim(),
        icon: "📦",
        color: "#3b82f6"
      };

      const response = await createCategoryFetch(accessToken, payload);
      const newCat = response && response.data ? response.data : response;

      if (newCat && newCat.id) {
        setCategories(prev => [...prev, newCat]);
        setCategoryId(newCat.id);
        setCategory(newCat.name);
        setNewCategoryName("");
        setNewCategoryIcon("📦");
        setNewCategoryColor("#3b82f6");
        setShowNewCategoryModal(false);
      } else {
        const errorMsg = response?.message || "Failed to create category.";
        Alert.alert(t("common.error"), errorMsg);
      }
    } catch (error) {
      console.log("Error creating category:", error);
      Alert.alert(t("common.error"), "An error occurred while creating category.");
    } finally {
      setIsCreatingCategory(false);
    }
  };

  useEffect(() => {
    if (habitData) {
      const { title: translatedTitle } = getTranslatedHabit(habitData, i18n.language, t);

      setTitle(translatedTitle);
      setIcon(habitData.icon || "star");
      if (habitData.categoryId) setCategoryId(habitData.categoryId);
      if (habitData.category) setCategory(habitData.category);
      if (habitData.targetValue) setTargetValue(habitData.targetValue.toString());
      if (habitData.unit) setUnit(habitData.unit);
      if (habitData.frequency) setFrequency(habitData.frequency);
      if (habitData.notificationTime) {
        setReminderTime(habitData.notificationTime.substring(0, 5));
        setReminderEnabled(true);
      }
      if (habitData.frequency === "Weekly" && habitData.selectedDays) {
        setSelectedDays(habitData.selectedDays.split(",").map(d => d.trim()));
      }
      if (habitData.frequency === "Custom" && habitData.selectedDays) {
        setCustomInterval(habitData.selectedDays);
      }
    }
  }, [habitData, t, isEditMode, i18n.language]);

  const [customInterval, setCustomInterval] = useState("1");

  const handleConfirmTime = () => {
    setReminderTime(`${tempHours}:${tempMinutes}`);
    setReminderEnabled(true);
    setShowTimeModal(false);
  };

  const toggleDay = (day) => {
    if (selectedDays.includes(day)) {
      if (selectedDays.length > 1) {
        setSelectedDays(selectedDays.filter((d) => d !== day));
      }
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleCreateHabit = async () => {
    if (!accessToken) return;

    // Validation
    if (parseFloat(targetValue) <= 0) {
      alert("Please set a goal greater than 0");
      return;
    }
    if (frequency === "Weekly" && selectedDays.length === 0) {
      alert("Please select at least one day for weekly frequency");
      return;
    }

    setIsLoading(true);
    const resolvedId = habitData?.userHabitId || habitData?.id;

    try {
      let response;
      if (!isEditMode && !isCustom && resolvedId) {
        if (isSuggested) {
          // Suggested Habit (from Explore)
          const payload = {
            suggestedHabitId: resolvedId,
            category,
            categoryId,
            title: title, // Use customized title
            description: description,
            targetValue: parseFloat(targetValue) || 1,
            unit,
            incrementValue: 1,
            frequency,
            notificationTime: reminderEnabled ? reminderTime : "",
            durationInMinutes: 0,
            startDate: new Date(startDate).toISOString(),
            endDate: endDate ? new Date(endDate).toISOString() : null,
            selectedDays: frequency === "Weekly" ? selectedDays.join(",") : (frequency === "Custom" ? customInterval : null),
          };
          response = await addSuggestedHabitFetch(accessToken, payload);
        } else {
          // Popular Habit (Shared Habit)
          const payload = {
            habitId: resolvedId,
            category,
            categoryId,
            title: title, // Use customized title
            description: description,
            targetValue: parseFloat(targetValue) || 1,
            unit,
            incrementValue: 1,
            frequency,
            notificationTime: reminderEnabled ? reminderTime : "",
            durationInMinutes: 0,
            startDate: new Date(startDate).toISOString(),
            endDate: endDate ? new Date(endDate).toISOString() : null,
            selectedDays: frequency === "Weekly" ? selectedDays.join(",") : (frequency === "Custom" ? customInterval : null),
          };
          response = await addUserHabitFetch(accessToken, payload);
        }
      } else {
        const payload = {
          title,
          description: description,
          icon,
          category,
          categoryId,
          frequency,
          startDate: new Date(startDate).toISOString(),
          endDate: endDate ? new Date(endDate).toISOString() : null,
          targetValue: parseFloat(targetValue) || 1,
          incrementValue: 1, // Default to 1 as requested
          unit,
          notificationTime: reminderEnabled ? reminderTime : "",
          durationInMinutes: 0,
          selectedDays: frequency === "Weekly" ? selectedDays.join(",") : (frequency === "Custom" ? customInterval : null),
        };

        if (isEditMode && resolvedId) {
          response = await updateUserHabitFetch(accessToken, resolvedId, payload);
        } else {
          response = await addCustomUserHabitFetch(accessToken, payload);
        }
      }

      if (response?.success || response?.ok) {
        navigateOnSuccess();
      } else {
        let errorMsg = response?.message;
        const isDuplicate = errorMsg === "User habit already exists." || 
                            errorMsg === "User habit with the same title already exists." ||
                            errorMsg === "User already has this habit.";
        if (isDuplicate) {
          errorMsg = t("create_habit.already_exists", "This habit already exists in your list.");
          setErrorModalTitle(t("common.oops", "Oops!"));
        } else {
          errorMsg = errorMsg || t("common.failed_load");
          setErrorModalTitle(t("common.error", "Error"));
        }
        setErrorModalMessage(errorMsg);
        setErrorModalVisible(true);
      }
    } catch (error) {
      console.error("Error creating habit:", error);
      setErrorModalTitle(t("common.error", "Error"));
      setErrorModalMessage(t("common.failed_load"));
      setErrorModalVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => navigation.goBack()}
        >
          <FontAwesomeIcon icon={faArrowLeft} size={18} color={colors.text} />
        </TouchableOpacity>
        <Text className="font-redditsans-bold" style={[styles.headerTitle, { color: colors.text }]}>
          {isEditMode ? t("create_habit.update_habit") : (isCustom ? t("create_habit.header") : (isSuggested ? t("create_habit.setup_suggested_habit") : t("create_habit.setup_popular_habit")))}
        </Text>

      </View>

      <KeyboardAvoidingView
        key={isCustom ? "custom-habit" : "popular-habit"}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Name Section */}
          <View style={styles.fieldSection}>
            <Text className="font-redditsans-bold" style={styles.label}>{t("create_habit.name_label")}</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderBottomColor: colors.textGray }]}
              className="font-redditsans-medium"
              value={title}
              onChangeText={setTitle}
              placeholder={t("create_habit.name_placeholder")}
              placeholderTextColor={colors.textSecondary}
              autoFocus={!isEditMode}
            />
          </View>

          {/* Description Section */}
          <View style={[styles.fieldSection, { marginBottom: 12 }]}>
            <Text className="font-redditsans-bold" style={styles.label}>{t("create_habit.desc_label")}</Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderBottomColor: colors.textGray,
                  minHeight: 40,
                  paddingVertical: 2,
                  textAlignVertical: "top",
                }
              ]}
              value={description}
              onChangeText={setDescription}
              placeholder={t("create_habit.desc_placeholder")}
              placeholderTextColor={colors.textSecondary}
              multiline={true}
            />
          </View>


          {/* Category Section */}
          <View style={styles.fieldSection}>
            <Text className="font-redditsans-bold" style={styles.label}>{t("create_habit.category_label")}</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center" }}>
              <TouchableOpacity
                onPress={() => setShowNewCategoryModal(true)}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderStyle: "dashed",
                    borderWidth: 1.5,
                    marginRight: 8,
                    marginBottom: 8,
                    paddingHorizontal: 12
                  }
                ]}
              >
                <Text style={{ color: colors.primary, fontWeight: "bold", fontSize: 15 }}>+ {t("create_habit.new_category", "New")}</Text>
              </TouchableOpacity>
              {categories.map((item) => {
                const isSelected = categoryId === item.id;
                let catColor = "#3b82f6";
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.categoryChip,
                      { backgroundColor: colors.card, borderColor: colors.border, marginRight: 8, marginBottom: 8 },
                      isSelected && { backgroundColor: catColor + '15', borderColor: catColor, borderWidth: 1.5 },
                    ]}
                    onPress={() => {
                      setCategoryId(item.id);
                      setCategory(item.name);
                    }}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        { color: colors.textSecondary },
                        isSelected && { color: catColor, fontWeight: "bold" },
                      ]}
                    >
                      {getTranslatedCategory(item, i18n.language, t)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Icon and Color Section - UPDATED: Removed Color, kept Icon */}
          <View style={styles.row}>
            <View style={[styles.fieldSection, { flex: 1, marginRight: 10 }]}>
              <Text className="font-redditsans-bold" style={styles.label}>{t("create_habit.icon_label")}</Text>
              <TouchableOpacity
                style={[styles.selectionBox, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => setShowIconModal(true)}
              >
                <View style={[styles.iconCircle, { backgroundColor: colors.cardSecondary }]}>
                  <Text style={{ fontSize: 20 }}>{ICONS[icon] || PREMIUM_ICONS[icon] || ICONS.default}</Text>
                </View>
                <View>
                  <Text className="font-redditsans-bold" style={[styles.selectionTitle, { color: colors.text }]}>
                    {t(`icons.${icon}`, { defaultValue: icon.charAt(0).toUpperCase() + icon.slice(1) })}
                  </Text>
                  <Text className="font-redditsans-medium" style={[styles.selectionSubtitle, { color: colors.textSecondary }]}>{t("create_habit.icon_subtitle")}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Goal & Tracking Section - PRODUCTION REFACTOR */}
          <View style={styles.fieldSection}>
            <Text className="font-redditsans-bold" style={[styles.label, { color: colors.textSecondary }]}>{t("create_habit.goal_label")}</Text>
            <View style={[styles.goalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>

              <Text className="font-redditsans-medium" style={[styles.introText, { color: colors.textSecondary }]}>{t("create_habit.goal_sub")}</Text>

              <>
                <View style={styles.sentenceRow}>
                  <TextInput
                    style={[styles.sentenceInput, { color: colors.primary, borderBottomColor: colors.primary }]}
                    className="font-redditsans-bold"
                    value={targetValue}
                    onChangeText={setTargetValue}
                    keyboardType="numeric"
                    placeholder="1"
                    placeholderTextColor={colors.textSecondary}
                  />

                  <TouchableOpacity
                    style={[styles.unitSelector, { backgroundColor: colors.primarySurface }]}
                    onPress={() => setShowUnitModal(true)}
                  >
                    <Text className="font-redditsans-bold" style={[styles.unitText, { color: colors.primary }]}>{t(`units.${unit.toLowerCase()}`, { defaultValue: unit })}</Text>
                    <FontAwesomeIcon icon={faChevronRight} size={10} color={colors.primary} style={{ marginLeft: 4, transform: [{ rotate: '90deg' }] }} />
                  </TouchableOpacity>
                  <Text className="font-redditsans-bold" style={[styles.sentenceLabel, { color: colors.text }]}>{t("create_habit.every")}</Text>
                </View>

                {/* Frequency Selection (Chips) */}
                <View style={styles.frequencyRow}>
                  {["Daily", "Weekly", "Monthly", "Custom"].map((freq) => (
                    <TouchableOpacity
                      key={freq}
                      style={[
                        styles.freqChip,
                        { backgroundColor: colors.card, borderColor: colors.border },
                        frequency === freq && { backgroundColor: colors.primary, borderColor: colors.primary }
                      ]}
                      onPress={() => setFrequency(freq)}
                    >
                      <Text
                        style={[
                          styles.freqChipText,
                          { color: colors.text },
                          frequency === freq && { color: colors.white }
                        ]}
                        className="font-redditsans-medium"
                        numberOfLines={1}
                        adjustsFontSizeToFit
                      >
                        {t(`my_habits.filters.${freq.toLowerCase()}`)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Weekly Day Picker */}
                {frequency === "Weekly" && (
                  <View style={styles.dayPickerContainer}>
                    <Text className="font-redditsans-bold" style={[styles.smallLabel, { color: colors.textSecondary, marginBottom: 8 }]}>{t("create_habit.repeat_on")}</Text>
                    <View style={styles.daysRow}>
                      {DAYS.map((day) => (
                        <TouchableOpacity
                          key={day}
                          style={[
                            styles.dayChip,
                            { backgroundColor: colors.card, borderColor: colors.border },
                            selectedDays.includes(day) && { backgroundColor: colors.primarySurface, borderColor: colors.primary }
                          ]}
                          onPress={() => toggleDay(day)}
                        >
                          <Text className="font-redditsans-bold" style={[
                            styles.dayChipText,
                            { color: colors.textSecondary },
                            selectedDays.includes(day) && { color: colors.primary }
                          ]}>
                            {day.substring(0, 1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {frequency === "Custom" && (
                  <View style={styles.dayPickerContainer}>
                    <Text className="font-redditsans-bold" style={[styles.smallLabel, { color: colors.textSecondary, marginBottom: 8 }]}>{t("create_habit.repeat_interval")}</Text>
                    <View style={styles.sentenceRow}>
                      <Text className="font-redditsans-bold" style={[styles.sentenceLabel, { color: colors.text, marginRight: 10 }]}>{t("create_habit.every_custom")}</Text>
                      <TextInput
                        style={[styles.sentenceInput, { color: colors.primary, borderBottomColor: colors.primary, minWidth: 40 }]}
                        className="font-redditsans-bold"
                        value={customInterval}
                        onChangeText={setCustomInterval}
                        keyboardType="numeric"
                        placeholder="1"
                      />
                      <Text className="font-redditsans-bold" style={[styles.sentenceLabel, { color: colors.text }]}>{t("create_habit.days_custom")}</Text>
                    </View>
                  </View>
                )}

                {frequency === "Monthly" && (
                  <View style={styles.dayPickerContainer}>
                    <Text className="font-redditsans-bold" style={[styles.smallLabel, { color: colors.textSecondary, marginBottom: 8 }]}>{t("create_habit.repeat_schedule")}</Text>
                    <Text className="font-redditsans-medium" style={{ color: colors.textSecondary }}>
                      {t("create_habit.monthly_repeat_note", { day: (new Date(startDate)).getDate() })}
                    </Text>
                  </View>
                )}
              </>
            </View>

          </View>

          {/* Reminders Section */}
          <View style={styles.fieldSection}>
            <Text className="font-redditsans-bold" style={[styles.label, { color: colors.textSecondary }]}>{t("create_habit.reminders_label")}</Text>
            <View style={[styles.reminderCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.reminderRow}>
                <Text className="font-redditsans-medium" style={[styles.reminderText, { color: colors.textSecondary }]}>
                  {t("create_habit.reminders_sub")}
                </Text>
                <Switch
                  value={reminderEnabled}
                  onValueChange={setReminderEnabled}
                  trackColor={{ false: colors.border, true: colors.primary }}
                />
              </View>
              <TouchableOpacity
                style={[
                  styles.reminderTimeRow,
                  { backgroundColor: colors.background, opacity: reminderEnabled ? 1 : 0.5 }
                ]}
                onPress={() => reminderEnabled && setShowTimeModal(true)}
                disabled={!reminderEnabled}
              >
                <View style={[styles.badge, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text className="font-redditsans-bold" style={[styles.badgeText, { color: colors.text }]}>🕒 {reminderTime}</Text>
                </View>
                <View style={[styles.badge, { marginLeft: 10, backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text className="font-redditsans-bold" style={[styles.badgeText, { color: colors.text }]}>
                    📋 {frequency === "Daily" ? t("create_habit.every_day") : (frequency === "Weekly" ? t("create_habit.on_scheduled_days") : t("create_habit.selected_days"))}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.addButton,
              { backgroundColor: colors.primary, shadowColor: colors.primary },
              isLoading && { opacity: 0.7 }
            ]}
            onPress={handleCreateHabit}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <Text className="font-redditsans-bold" style={[styles.addButtonText, { color: colors.white }]}>
              {isLoading ? t("common.saving") : (isEditMode ? t("create_habit.update_habit") : t("create_habit.save_habit"))}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Unit Bottom Sheet Modal */}
      <Modal
        visible={showUnitModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowUnitModal(false);
          setShowCustomUnitInput(false);
        }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            setShowUnitModal(false);
            setShowCustomUnitInput(false);
          }}
        >
          <View style={[styles.bottomSheetContent, { backgroundColor: colors.card }]}>
            <View style={[styles.bottomSheetHandle, { backgroundColor: colors.border }]} />
            <Text className="font-redditsans-bold" style={[styles.modalTitle, { color: colors.text }]}>
              {showCustomUnitInput ? t("units.custom_header") : t("units.header")}
            </Text>

            {showCustomUnitInput ? (
              <View style={{ paddingBottom: 20 }}>
                <TextInput
                  style={[styles.input, { marginBottom: 20, color: colors.text, borderBottomColor: colors.border }]}
                  value={tempCustomUnit}
                  onChangeText={setTempCustomUnit}
                  placeholder="e.g. sketches"
                  placeholderTextColor={colors.textSecondary}
                  autoFocus
                />
                <TouchableOpacity
                  style={[styles.addButton, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    if (tempCustomUnit.trim()) {
                      setUnit(tempCustomUnit.trim());
                      setShowCustomUnitInput(false);
                      setShowUnitModal(false);
                      setTempCustomUnit("");
                    }
                  }}
                >
                  <Text className="font-redditsans-bold" style={[styles.addButtonText, { color: colors.white }]}>
                    {t("units.confirm")}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView style={styles.unitList} showsVerticalScrollIndicator={false}>
                {UNITS.map((u) => (
                  <TouchableOpacity
                    key={u}
                    style={[
                      styles.unitOption,
                      unit === u && { backgroundColor: colors.primarySurface },
                    ]}
                    onPress={() => {
                      if (u === "Other") {
                        setShowCustomUnitInput(true);
                      } else {
                        setUnit(u);
                        setShowUnitModal(false);
                      }
                    }}
                  >
                    <Text
                      className="font-redditsans-medium"
                      style={[
                        styles.unitOptionText,
                        { color: colors.text },
                        unit === u && { color: colors.primary, fontWeight: "bold" },
                      ]}
                    >
                      {t(`units.${u.toLowerCase()}`)}
                    </Text>
                    {unit === u && (
                      <FontAwesomeIcon icon={faClock} size={14} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Icon Selector Modal */}
      <Modal
        visible={showIconModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowIconModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowIconModal(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card, maxHeight: '80%' }]}>
            <Text className="font-redditsans-bold" style={[styles.modalTitle, { color: colors.text, marginBottom: 8 }]}>{t("create_habit.select_icon", "İkon Seçin")}</Text>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>

              {/* Standard Icons Section */}
              <Text className="font-redditsans-bold" style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 10, marginTop: 10 }}>
                {t("create_habit.standard_icons", "Standart İkonlar")}
              </Text>
              <View style={styles.iconGrid}>
                {Object.keys(ICONS).filter(k => k !== 'lock' && k !== 'default').map((key) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.gridIconBox,
                      { backgroundColor: colors.cardSecondary, borderColor: colors.border },
                      icon === key && { borderColor: colors.primary, backgroundColor: colors.primarySurface },
                    ]}
                    onPress={() => {
                      setIcon(key);
                      setShowIconModal(false);
                    }}
                  >
                    <Text style={{ fontSize: 28 }}>{ICONS[key]}</Text>
                    <Text style={[styles.gridIconLabel, { color: colors.textSecondary }]} numberOfLines={1}>
                      {t(`icons.${key}`, { defaultValue: key })}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Premium Icons Section */}
              <Text className="font-redditsans-bold" style={{ fontSize: 13, color: colors.primary, marginBottom: 10, marginTop: 20 }}>
                {t("create_habit.premium_icons", "Premium İkonlar 🌟")}
              </Text>
              <View style={styles.iconGrid}>
                {Object.keys(PREMIUM_ICONS).map((key) => {
                  const isLocked = !hasCustomHabitIcon;
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.gridIconBox,
                        { backgroundColor: colors.cardSecondary, borderColor: colors.border },
                        icon === key && { borderColor: colors.primary, backgroundColor: colors.primarySurface }
                      ]}
                      activeOpacity={0.8}
                      onPress={() => {
                        if (isLocked) {
                          Alert.alert(
                            t('store.icon_locked_title', 'İkon Kilidlidir 🔒'),
                            t('store.icon_locked_desc', "Bu premium ikonu seçmək üçün XP Mağazasından 'Xüsusi Vərdiş İkonu' məhsulunu satın almalısınız!"),
                            [
                              { text: t('common.cancel', 'Ləğv et'), style: 'cancel' },
                              { text: t('store.header_title', 'Mağazaya Get'), onPress: () => { setShowIconModal(false); navigation.navigate('StoreScreen'); } }
                            ]
                          );
                        } else {
                          setIcon(key);
                          setShowIconModal(false);
                        }
                      }}
                    >
                      <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 28, opacity: isLocked ? 0.35 : 1 }}>{PREMIUM_ICONS[key]}</Text>
                        {isLocked && (
                          <View style={{ position: 'absolute', top: 4, right: -4, backgroundColor: '#f97316', borderRadius: 6, paddingHorizontal: 3, paddingVertical: 1 }}>
                            <Text style={{ fontSize: 8, color: '#fff' }}>🔒</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.gridIconLabel, { color: colors.textSecondary }]} numberOfLines={1}>
                        {t(`icons.${key}`, { defaultValue: key })}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Time Picker Modal */}
      <Modal
        visible={showTimeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTimeModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowTimeModal(false)}
        >
          <View style={[styles.modalContent, { paddingBottom: 30, backgroundColor: colors.card }]}>
            <Text className="font-redditsans-bold" style={[styles.modalTitle, { color: colors.text }]}>Set Reminder Time</Text>
            <View style={styles.timePickerContainer}>
              <View style={styles.timeColumn}>
                <Text style={[styles.pickerLabel, { color: colors.textSecondary }]}>Hour</Text>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {HOURS.map((h) => (
                    <TouchableOpacity
                      key={h}
                      style={[
                        styles.timeSlot,
                        tempHours === h && { backgroundColor: colors.primarySurface },
                      ]}
                      onPress={() => setTempHours(h)}
                    >
                      <Text
                        className="font-redditsans-medium"
                        style={[
                          styles.timeSlotText,
                          { color: colors.textSecondary },
                          tempHours === h && styles.timeSlotTextSelected,
                        ]}
                      >
                        {h}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.timeColumn}>
                <Text style={[styles.pickerLabel, { color: colors.textSecondary }]}>Minute</Text>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {MINUTES.map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[
                        styles.timeSlot,
                        tempMinutes === m && { backgroundColor: colors.primarySurface },
                      ]}
                      onPress={() => setTempMinutes(m)}
                    >
                      <Text
                        className="font-redditsans-medium"
                        style={[
                          styles.timeSlotText,
                          { color: colors.textSecondary },
                          tempMinutes === m && styles.timeSlotTextSelected,
                        ]}
                      >
                        {m}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.confirmButton, { backgroundColor: colors.primary }]}
              onPress={handleConfirmTime}
            >
              <Text className="font-redditsans-bold" style={styles.confirmButtonText}>{t('common.confirm')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
      {/* Start Date Picker Modal */}


      {/* Custom Error Alert Modal */}
      <Modal
        visible={errorModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setErrorModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.alertOverlay}
          activeOpacity={1}
          onPress={() => setErrorModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.alertContent, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <LinearGradient
              colors={["#ef4444", "#dc2626"]}
              style={styles.alertIconContainer}
            >
              <FontAwesomeIcon icon={faCircleExclamation} size={28} color="#fff" />
            </LinearGradient>

            <Text className="font-redditsans-bold" style={[styles.alertTitle, { color: colors.text }]}>
              {errorModalTitle}
            </Text>

            <Text className="font-redditsans-regular" style={[styles.alertMessage, { color: colors.textSecondary }]}>
              {errorModalMessage}
            </Text>

            <TouchableOpacity
              style={[styles.alertButton, { backgroundColor: colors.primary }]}
              onPress={() => setErrorModalVisible(false)}
              activeOpacity={0.85}
            >
              <Text className="font-redditsans-bold" style={styles.alertButtonText}>
                {t("common.confirm", { defaultValue: "OK" })}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Create Custom Category Modal */}
      <Modal
        visible={showNewCategoryModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowNewCategoryModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: colors.card, borderRadius: 24, width: '100%', maxWidth: 360, padding: 24 }}>
            <Text style={{ color: colors.text, fontSize: 20, fontWeight: '700', marginBottom: 16 }}>
              {t("create_habit.create_category_title", "New Category")}
            </Text>

            {/* Input Name */}
            <Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
              {t("create_habit.category_name", "Category Name")}
            </Text>
            <TextInput
              style={{
                backgroundColor: colors.cardSecondary,
                color: colors.text,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 16,
                marginBottom: 24,
                borderWidth: 1,
                borderColor: colors.border
              }}
              placeholder={t("create_habit.category_name_placeholder", "e.g. Reading")}
              placeholderTextColor={colors.textSecondary}
              value={newCategoryName}
              onChangeText={setNewCategoryName}
            />

            {/* Action Buttons */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => setShowNewCategoryModal(false)}
                style={{
                  flex: 1,
                  backgroundColor: colors.cardSecondary,
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: 'center'
                }}
              >
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>
                  {t("common.cancel")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateCategory}
                disabled={isCreatingCategory}
                style={{
                  flex: 1,
                  backgroundColor: colors.primary,
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: 'center',
                  opacity: isCreatingCategory ? 0.7 : 1
                }}
              >
                {isCreatingCategory ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
                    {t("common.create", "Create")}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  headerTitle: {
    marginLeft: 15,
    fontSize: 20,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 120,
  },
  fieldSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: 10,
    letterSpacing: 1,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingVertical: 10,
    fontSize: 18,
    color: "#1e293b",
  },
  categoryList: {
    paddingLeft: 0,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  categoryText: {
    fontSize: 14,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  selectionBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  selectionTitle: {
    fontSize: 14,
    color: "#1e293b",
  },
  selectionSubtitle: {
    fontSize: 11,
    color: "#94a3b8",
  },
  goalCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  card: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  miniButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  miniButtonText: {
    fontSize: 12,
  },
  reminderCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
  },
  reminderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 15,
  },
  reminderText: {
    flex: 1,
    fontSize: 14,
    marginRight: 10,
    lineHeight: 20,
  },
  reminderTimeRow: {
    flexDirection: "row",
    padding: 8,
    borderRadius: 12,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 13,
  },
  addButton: {
    paddingVertical: 18,
    borderRadius: 20,
    marginTop: 10,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  addButtonText: {
    textAlign: "center",
    fontSize: 18,
  },
  // Refactor Styles
  introText: {
    fontSize: 14,
    marginBottom: 8,
  },
  sentenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  sentenceInput: {
    fontSize: 24,
    borderBottomWidth: 2,
    minWidth: 50,
    textAlign: 'center',
    marginRight: 10,
    paddingBottom: 2,
  },
  unitSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 10,
  },
  unitText: {
    fontSize: 18,
  },
  sentenceLabel: {
    fontSize: 18,
  },
  frequencyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  freqChip: {
    width: '48%',
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  freqChipText: {
    fontSize: 14,
    color: '#64748b',
  },
  dayPickerContainer: {
    marginBottom: 20,
  },
  smallLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayChip: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  dayChipText: {
    fontSize: 12,
    color: '#64748b',
  },
  durationSection: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 15,
  },
  durationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  durationInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  previewContainer: {
    marginTop: 16,
  },
  previewBadge: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  previewText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  bottomSheetContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    width: "100%",
    position: 'absolute',
    bottom: 0,
    maxHeight: '80%',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  bottomSheetHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 20,
  },
  unitList: {
    marginTop: 10,
  },
  unitOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 15,
    marginBottom: 8,
  },
  unitOptionText: {
    fontSize: 16,
    color: '#1e293b',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 30,
    padding: 24,
    width: "100%",
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    color: "#1e293b",
    marginBottom: 20,
    textAlign: "center",
  },
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gridIconBox: {
    width: "30%",
    aspectRatio: 1,
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  gridIconBoxSelected: {
    borderColor: "#22c55e",
    backgroundColor: "#f0fdf4",
  },
  gridIconLabel: {
    fontSize: 10,
    color: "#64748b",
    marginTop: 4,
  },
  timePickerContainer: {
    flexDirection: "row",
    height: 250,
  },
  timeColumn: {
    flex: 1,
    alignItems: "center",
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#94a3b8",
    marginBottom: 10,
  },
  timeSlot: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 5,
  },
  timeSlotSelected: {
    backgroundColor: "#f0fdf4",
  },
  timeSlotText: {
    fontSize: 20,
    color: "#64748b",
  },
  timeSlotTextSelected: {
    color: "#22c55e",
  },
  confirmButton: {
    backgroundColor: "#22c55e",
    paddingVertical: 15,
    borderRadius: 15,
    marginTop: 20,
  },
  confirmButtonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
  },
  alertOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  alertContent: {
    width: "100%",
    borderRadius: 28,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  alertIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  alertTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  alertMessage: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  alertButton: {
    width: "100%",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  alertButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default CreateCustomHabit;
