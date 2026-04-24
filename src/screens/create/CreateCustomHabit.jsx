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
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faArrowLeft, faChevronRight, faCalendarAlt, faClock, faLayerGroup } from "@fortawesome/free-solid-svg-icons";
import { useMMKVString } from "react-native-mmkv";
import { addCustomUserHabitFetch, addUserHabitFetch } from "../../utils/fetch";
import { ICONS } from "../../constants/icons";
import { useTheme } from "../../constants/theme";

const CATEGORIES = [
  "General",
  "Health",
  "Fitness",
  "Mindset",
  "Productivity",
  "Finance",
  "Wellness",
  "Social",
];

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
  "kcal",
  "tasks",
  "Other",
];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
const MINUTES = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, "0")); // 5-min intervals

const CreateCustomHabit = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { habitData = null, isCustom = true } = route.params || {};
  const [accessToken] = useMMKVString("accessToken");
  const { colors, spacing, typography, radius } = useTheme();

  // Core Fields
  const [title, setTitle] = useState(habitData?.title || "");
  const [description, setDescription] = useState(habitData?.description || (habitData?.title || ""));
  const [icon, setIcon] = useState(habitData?.icon || "star");
  const [category, setCategory] = useState("General");
  const [showCustomUnitInput, setShowCustomUnitInput] = useState(false);
  const [tempCustomUnit, setTempCustomUnit] = useState("");

  // Goal & Tracking
  const [targetValue, setTargetValue] = useState("1");
  const [unit, setUnit] = useState("times");
  const [frequency, setFrequency] = useState("Daily");
  const [selectedDays, setSelectedDays] = useState(["Mon"]);
  const [trackDuration, setTrackDuration] = useState(false);
  const [durationInMinutes, setDurationInMinutes] = useState("10");

  // Schedule
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState("");

  // Reminders
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState("09:30");

  const [isLoading, setIsLoading] = useState(false);
  const [showIconModal, setShowIconModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);

  // Time Picker Temp State
  const [tempHours, setTempHours] = useState("09");
  const [tempMinutes, setTempMinutes] = useState("30");

  useEffect(() => {
    if (habitData) {
      setTitle(habitData.title || "");
      setDescription(habitData.description || habitData.title || "");
      setIcon(habitData.icon || "star");
      if (habitData.category) setCategory(habitData.category);
    }
  }, [habitData]);

  const handleConfirmTime = () => {
    setReminderTime(`${tempHours}:${tempMinutes}`);
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

    try {
      if (!isCustom && habitData?.id) {
        // Shared Habit
        const payload = {
          habitId: habitData.id,
          category,
          notificationTime: reminderEnabled ? reminderTime : null,
          durationInMinutes: trackDuration ? (parseInt(durationInMinutes) || 0) : 0,
          startDate: new Date(startDate).toISOString(),
          endDate: endDate ? new Date(endDate).toISOString() : null,
        };
        const response = await addUserHabitFetch(accessToken, payload);
        if (response) {
          navigation.navigate("HomeScreen");
        }
      } else {
        // Custom Habit
        const payload = {
          title,
          description,
          icon,
          category,
          frequency,
          startDate: new Date(startDate).toISOString(),
          endDate: endDate ? new Date(endDate).toISOString() : null,
          targetValue: parseFloat(targetValue) || 1,
          incrementValue: 1, // Default to 1 as requested
          unit,
          notificationTime: reminderEnabled ? reminderTime : null,
          durationInMinutes: trackDuration ? (parseInt(durationInMinutes) || 0) : 0,
          // If needed, we could pass selectedDays to backend if the API supports it
        };
        const response = await addCustomUserHabitFetch(accessToken, payload);
        if (response) {
          navigation.navigate("HomeScreen");
        }
      }
    } catch (error) {
      console.error("Error creating habit:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryChip,
        { backgroundColor: colors.surface, borderColor: colors.border },
        category === item && { backgroundColor: colors.primaryLight, borderColor: colors.primary },
      ]}
      onPress={() => setCategory(item)}
    >
      <Text
        style={[
          styles.categoryText,
          { color: colors.textSecondary },
          category === item && { color: colors.primaryDark, fontWeight: "bold" },
        ]}
      >
        {item}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => navigation.goBack()}
        >
          <FontAwesomeIcon icon={faArrowLeft} size={18} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary, ...typography.h1 }]}>
          {isCustom ? "Create Custom Habit" : "Setup Popular Habit"}
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
          {isCustom && (
            <View style={styles.fieldSection}>
              <Text style={styles.label}>NAME</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Walk"
                placeholderTextColor="#9ca3af"
              />
            </View>
          )}

          {/* Description Section */}
          {isCustom && (
            <View style={styles.fieldSection}>
              <Text style={styles.label}>DESCRIPTION</Text>
              <TextInput
                style={styles.input}
                value={description}
                onChangeText={setDescription}
                placeholder="e.g. Daily morning walk"
                placeholderTextColor="#9ca3af"
              />
            </View>
          )}

          {/* Category Section */}
          <View style={styles.fieldSection}>
            <Text style={styles.label}>CATEGORY</Text>
            <View>
              <FlatList
                data={CATEGORIES}
                renderItem={renderCategoryItem}
                keyExtractor={(item) => item}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryList}
              />
            </View>
          </View>

          {/* Icon and Color Section - UPDATED: Removed Color, kept Icon */}
          {isCustom && (
            <View style={styles.row}>
              <View style={[styles.fieldSection, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.label}>ICON</Text>
                <TouchableOpacity
                  style={styles.selectionBox}
                  onPress={() => setShowIconModal(true)}
                >
                  <View style={styles.iconCircle}>
                    <Text style={{ fontSize: 20 }}>{ICONS[icon] || ICONS.default}</Text>
                  </View>
                  <View>
                    <Text style={styles.selectionTitle}>
                      {icon.charAt(0).toUpperCase() + icon.slice(1)}
                    </Text>
                    <Text style={styles.selectionSubtitle}>Icon</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Goal & Tracking Section - PRODUCTION REFACTOR */}
          <View style={styles.fieldSection}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>GOAL & TRACKING</Text>
            <View style={[styles.goalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              
              {isCustom && <Text style={[styles.introText, { color: colors.textSecondary }]}>I want to do this</Text>}
              
              {isCustom && (
                <>
                  <View style={styles.sentenceRow}>
                    <TextInput
                      style={[styles.sentenceInput, { color: colors.primary, borderBottomColor: colors.primary }]}
                      value={targetValue}
                      onChangeText={setTargetValue}
                      keyboardType="numeric"
                      placeholder="1"
                      placeholderTextColor={colors.textSecondary}
                    />
                    
                    <TouchableOpacity 
                      style={styles.unitSelector}
                      onPress={() => setShowUnitModal(true)}
                    >
                      <Text style={[styles.unitText, { color: colors.primary }]}>{unit}</Text>
                      <FontAwesomeIcon icon={faChevronRight} size={10} color={colors.primary} style={{ marginLeft: 4, transform: [{ rotate: '90deg' }] }} />
                    </TouchableOpacity>

                    <Text style={[styles.sentenceLabel, { color: colors.textPrimary }]}>every</Text>
                  </View>

                  {/* Frequency Selection (Chips) */}
                  <View style={styles.frequencyRow}>
                    {["Daily", "Weekly", "Custom"].map((freq) => (
                      <TouchableOpacity
                        key={freq}
                        style={[
                          styles.freqChip,
                          frequency === freq && { backgroundColor: colors.primary, borderColor: colors.primary }
                        ]}
                        onPress={() => setFrequency(freq)}
                      >
                        <Text style={[
                          styles.freqChipText,
                          frequency === freq && { color: colors.white }
                        ]}>
                          {freq}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Weekly Day Picker */}
                  {frequency === "Weekly" && (
                    <View style={styles.dayPickerContainer}>
                      <Text style={[styles.smallLabel, { color: colors.textSecondary, marginBottom: 8 }]}>Repeat on</Text>
                      <View style={styles.daysRow}>
                        {DAYS.map((day) => (
                          <TouchableOpacity
                            key={day}
                            style={[
                              styles.dayChip,
                              selectedDays.includes(day) && { backgroundColor: colors.primaryLight, borderColor: colors.primary }
                            ]}
                            onPress={() => toggleDay(day)}
                          >
                            <Text style={[
                              styles.dayChipText,
                              selectedDays.includes(day) && { color: colors.primary, fontWeight: 'bold' }
                            ]}>
                              {day.substring(0, 1)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}
                </>
              )}

              {/* Duration Toggle */}
              <View style={styles.durationSection}>
                <View style={styles.durationHeader}>
                  <Text style={[styles.sentenceLabel, { color: colors.textPrimary }]}>Track duration</Text>
                  <Switch
                    value={trackDuration}
                    onValueChange={setTrackDuration}
                    trackColor={{ false: "#e2e8f0", true: colors.primary }}
                  />
                </View>
                {trackDuration && (
                  <View style={styles.durationInputRow}>
                    <TextInput
                      style={[styles.compactInput, { flex: 1, marginRight: 10 }]}
                      value={durationInMinutes}
                      onChangeText={setDurationInMinutes}
                      keyboardType="numeric"
                      placeholder="e.g. 10"
                    />
                    <Text style={{ color: colors.textSecondary }}>minutes per session</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Natural Language Preview */}
            {isCustom && (
              <View style={styles.previewContainer}>
                <View style={[styles.previewBadge, { backgroundColor: colors.primaryLight }]}>
                  <Text style={[styles.previewText, { color: colors.primaryDark }]}>
                    ✨ You will {title || "habit"} {targetValue} {unit} every {frequency.toLowerCase() === 'daily' ? 'day' : frequency.toLowerCase()}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Schedule Section */}
          <View style={styles.fieldSection}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>SCHEDULE</Text>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardRow}>
                <View style={[styles.iconBox, { backgroundColor: colors.primaryLight }]}>
                   <FontAwesomeIcon icon={faCalendarAlt} size={16} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                   <Text style={[styles.selectionTitle, { color: colors.textPrimary }]}>Start Date</Text>
                   <Text style={[styles.selectionSubtitle, { color: colors.textSecondary }]}>{startDate}</Text>
                </View>
                <TouchableOpacity 
                   style={[styles.miniButton, { backgroundColor: colors.background }]}
                   onPress={() => setStartDate(new Date().toISOString().split('T')[0])}
                >
                   <Text style={[styles.miniButtonText, { color: colors.textSecondary }]}>Today</Text>
                </TouchableOpacity>
              </View>
              
              <View style={[styles.cardRow, { marginTop: 15, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 15 }]}>
                <View style={[styles.iconBox, { backgroundColor: '#fee2e2' }]}>
                   <FontAwesomeIcon icon={faCalendarAlt} size={16} color={colors.error} />
                </View>
                <View style={{ flex: 1 }}>
                   <Text style={[styles.selectionTitle, { color: colors.textPrimary }]}>End Date</Text>
                   <Text style={[styles.selectionSubtitle, { color: colors.textSecondary }]}>{endDate || "No end date"}</Text>
                </View>
                <TouchableOpacity 
                   style={[styles.miniButton, { backgroundColor: colors.background }]}
                   onPress={() => setEndDate("")}
                >
                   <Text style={[styles.miniButtonText, { color: colors.textSecondary }]}>Clear</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Reminders Section */}
          <View style={styles.fieldSection}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>REMINDERS</Text>
            <View style={[styles.reminderCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.reminderRow}>
                <Text style={[styles.reminderText, { color: colors.textSecondary }]}>
                  Send me a notification to stay on track.
                </Text>
                <Switch
                  value={reminderEnabled}
                  onValueChange={setReminderEnabled}
                  trackColor={{ false: colors.border, true: colors.primary }}
                />
              </View>
              <TouchableOpacity
                style={[styles.reminderTimeRow, { backgroundColor: colors.background }]}
                onPress={() => setShowTimeModal(true)}
              >
                <View style={[styles.badge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.badgeText, { color: colors.textPrimary }]}>🕒 {reminderTime}</Text>
                </View>
                <View style={[styles.badge, { marginLeft: 10, backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.badgeText, { color: colors.textPrimary }]}>📋 Every day</Text>
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
            <Text style={[styles.addButtonText, { color: colors.white }]}>
              {isLoading ? "Saving..." : "Create Habit"}
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
          <View style={styles.bottomSheetContent}>
            <View style={styles.bottomSheetHandle} />
            <Text style={styles.modalTitle}>
              {showCustomUnitInput ? "Custom Unit" : "Select Unit"}
            </Text>

            {showCustomUnitInput ? (
              <View style={{ paddingBottom: 20 }}>
                <TextInput
                  style={[styles.input, { marginBottom: 20 }]}
                  value={tempCustomUnit}
                  onChangeText={setTempCustomUnit}
                  placeholder="e.g. sketches"
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
                  <Text style={[styles.addButtonText, { color: colors.white }]}>
                    Confirm Unit
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
                      unit === u && { backgroundColor: colors.primaryLight },
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
                      style={[
                        styles.unitOptionText,
                        unit === u && { color: colors.primary, fontWeight: "bold" },
                      ]}
                    >
                      {u}
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
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Icon</Text>
            <View style={styles.iconGrid}>
              {Object.keys(ICONS).map((key) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.gridIconBox,
                    icon === key && styles.gridIconBoxSelected,
                  ]}
                  onPress={() => {
                    setIcon(key);
                    setShowIconModal(false);
                  }}
                >
                  <Text style={{ fontSize: 28 }}>{ICONS[key]}</Text>
                  <Text style={styles.gridIconLabel}>{key}</Text>
                </TouchableOpacity>
              ))}
            </View>
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
          <View style={[styles.modalContent, { paddingBottom: 30 }]}>
            <Text style={styles.modalTitle}>Set Reminder Time</Text>
            <View style={styles.timePickerContainer}>
              <View style={styles.timeColumn}>
                <Text style={styles.pickerLabel}>Hour</Text>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {HOURS.map((h) => (
                    <TouchableOpacity
                      key={h}
                      style={[
                        styles.timeSlot,
                        tempHours === h && styles.timeSlotSelected,
                      ]}
                      onPress={() => setTempHours(h)}
                    >
                      <Text
                        style={[
                          styles.timeSlotText,
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
                <Text style={styles.pickerLabel}>Minute</Text>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {MINUTES.map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[
                        styles.timeSlot,
                        tempMinutes === m && styles.timeSlotSelected,
                      ]}
                      onPress={() => setTempMinutes(m)}
                    >
                      <Text
                        style={[
                          styles.timeSlotText,
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
              style={styles.confirmButton}
              onPress={handleConfirmTime}
            >
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
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
    fontSize: 22,
    fontWeight: "800",
    marginLeft: 15,
    fontFamily: "redditsans-bold",
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  fieldSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#94a3b8",
    marginBottom: 10,
    fontFamily: "redditsans-bold",
    letterSpacing: 1,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingVertical: 10,
    fontSize: 18,
    color: "#1e293b",
    fontFamily: "redditsans-medium",
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
  },
  categoryText: {
    fontSize: 14,
    fontFamily: "redditsans-medium",
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
    fontWeight: "bold",
    color: "#1e293b",
    fontFamily: "redditsans-bold",
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
     fontWeight: 'bold',
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
    fontWeight: "600",
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
    fontWeight: "bold",
    fontFamily: "redditsans-bold",
  },
  // Refactor Styles
  introText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'redditsans-medium',
  },
  sentenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  sentenceInput: {
    fontSize: 24,
    fontWeight: 'bold',
    borderBottomWidth: 2,
    minWidth: 50,
    textAlign: 'center',
    marginRight: 10,
    fontFamily: 'redditsans-bold',
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
    fontWeight: 'bold',
    fontFamily: 'redditsans-bold',
  },
  sentenceLabel: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'redditsans-medium',
  },
  frequencyRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  freqChip: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 8,
    backgroundColor: '#fff',
  },
  freqChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    fontFamily: 'redditsans-medium',
  },
  dayPickerContainer: {
    marginBottom: 20,
  },
  smallLabel: {
    fontSize: 12,
    fontWeight: 'bold',
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
    fontFamily: 'redditsans-medium',
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
    fontFamily: 'redditsans-medium',
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
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 20,
    textAlign: "center",
    fontFamily: "redditsans-bold",
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
    fontFamily: "redditsans-medium",
  },
  timeSlotTextSelected: {
    color: "#22c55e",
    fontWeight: "bold",
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
    fontWeight: "bold",
  },
});

export default CreateCustomHabit;
