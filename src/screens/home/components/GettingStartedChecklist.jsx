import React, { useContext, useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Modal, Animated } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faCheck, faChevronRight, faTrophy } from "@fortawesome/free-solid-svg-icons";
import { MenuContext } from "../../../context/MenuContext";
import { useTheme } from "../../../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { useMMKVString, useMMKVBoolean } from "react-native-mmkv";
import { storage } from "../../../utils/MMKVStore";
import LinearGradient from "react-native-linear-gradient";

const GettingStartedChecklist = ({ accountData, onLogMoodPress, userHabitCount, onAwardBonusXP, todaysUserHabit }) => {
  const { setIsCreateModalOpen } = useContext(MenuContext);
  const { theme } = useTheme();
  const { colors } = theme;
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();

  // MMKV storage variables
  const [lastMoodDate] = useMMKVString("user.lastMoodDate");
  const [habitCompletedCheck] = useMMKVString("user.checklist.habit_completed");
  const [checklistCompleted, setChecklistCompleted] = useMMKVString("user.onboarding_checklist_completed");
  const [isSplashFinished] = useMMKVBoolean("app.is_splash_finished");

  const [showCelebration, setShowCelebration] = useState(false);
  const arrowAnim = useRef(new Animated.Value(0)).current;

  // Layout states for active guided card replication
  const [logMoodLayout, setLogMoodLayout] = useState(null);
  const [createHabitLayout, setCreateHabitLayout] = useState(null);
  const [completeHabitLayout, setCompleteHabitLayout] = useState(null);

  const [absoluteLayout, setAbsoluteLayout] = useState(null);
  const activeCardRef = useRef(null);

  // Measure active card screen-relative coordinates dynamically
  useEffect(() => {
    if (isGuidanceActive && activeGuidedItemId && isSplashFinished === true) {
      const timer = setTimeout(() => {
        if (activeCardRef.current) {
          activeCardRef.current.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
              setAbsoluteLayout({ x, y, width, height });
            }
          });
        }
      }, 150);
      return () => clearTimeout(timer);
    } else {
      setAbsoluteLayout(null);
    }
  }, [activeGuidedItemId, isGuidanceActive, logMoodLayout, createHabitLayout, completeHabitLayout, isSplashFinished]);

  // Horizontal bounce animation for guiding chevron arrow
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(arrowAnim, {
          toValue: 6,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(arrowAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [arrowAnim]);

  // Local helper to get current local date string (YYYY-MM-DD)
  const getLocalDateString = (d) => {
    if (!d) return "";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getLocalDateString(new Date());

  // Task statuses
  const isMoodLogged = lastMoodDate === todayStr;
  const isHabitCreated = userHabitCount > 0;
  const isHabitCompleted = habitCompletedCheck === "true";

  // Calculate completion
  let completedCount = 0;
  if (isMoodLogged) completedCount++;
  if (isHabitCreated) completedCount++;
  if (isHabitCompleted) completedCount++;

  const progressPercentage = (completedCount / 3) * 100;

  // Active guided item logic (guides step-by-step)
  const activeGuidedItemId = !isMoodLogged
    ? "log_mood"
    : (!isHabitCreated
      ? "create_habit"
      : (!isHabitCompleted ? "complete_habit" : null));

  const isGuidanceActive = checklistCompleted !== "true" && activeGuidedItemId !== null;

  const getGuideTapText = () => {
    const lang = i18n.language || "en";
    switch (lang.substring(0, 2)) {
      case "az": return "👉 Tamamlamaq üçün toxunun!";
      case "tr": return "👉 Tamamlamak için dokunun!";
      case "ru": return "👉 Нажмите здесь, чтобы выполнить!";
      case "de": return "👉 Hier tippen zum Ausfüllen!";
      case "fr": return "👉 Appuyez ici pour compléter!";
      case "es": return "👉 ¡Toca aquí para completar!";
      case "it": return "👉 Tocca qui per completare!";
      case "zh": return "👉 点击此处完成！";
      case "ar": return "👉 اضغط هنا للإكمال!";
      case "en":
      default:
        return "👉 Tap here to complete!";
    }
  };

  // Auto trigger celebration if complete but not yet marked
  useEffect(() => {
    if (completedCount === 3 && checklistCompleted !== "true") {
      setShowCelebration(true);
    }
  }, [completedCount, checklistCompleted]);

  // Auto-award XP for checklist items (creating habit, completing habit)
  useEffect(() => {
    if (!accountData) return;

    // 1. Create habit (15 XP)
    if (isHabitCreated) {
      const keyLocal = "user.checklist.create_habit_xp_awarded";
      const keyServer = "user.checklist.create_habit_xp_awarded_server";
      if (storage.getString(keyLocal) !== "true") {
        storage.set(keyLocal, "true");
      }
      if (storage.getString(keyServer) !== "true") {
        storage.set(keyServer, "true");
        if (onAwardBonusXP) {
          onAwardBonusXP(15, keyServer);
        }
      }
    }

    // 2. Complete habit (20 XP)
    if (isHabitCompleted) {
      const keyLocal = "user.checklist.complete_habit_xp_awarded";
      const keyServer = "user.checklist.complete_habit_xp_awarded_server";
      if (storage.getString(keyLocal) !== "true") {
        storage.set(keyLocal, "true");
      }
      if (storage.getString(keyServer) !== "true") {
        storage.set(keyServer, "true");
        if (onAwardBonusXP) {
          onAwardBonusXP(20, keyServer);
        }
      }
    }
  }, [isHabitCreated, isHabitCompleted, accountData, onAwardBonusXP]);

  const handleCelebrationDismiss = () => {
    // Save checklist completion in MMKV
    setChecklistCompleted("true");

    // Check if bonus has already been awarded to prevent multiple triggers
    const keyLocal = "user.onboarding_checklist_bonus_awarded";
    const keyServer = "user.onboarding_checklist_bonus_awarded_server";
    if (storage.getString(keyLocal) !== "true") {
      storage.set(keyLocal, "true");
    }
    if (storage.getString(keyServer) !== "true") {
      storage.set(keyServer, "true");
      if (onAwardBonusXP) {
        onAwardBonusXP(50, keyServer);
      }
    }
    setShowCelebration(false);
  };

  const handleTaskPress = (id) => {
    setAbsoluteLayout(null);
    if (id === "log_mood") {
      if (onLogMoodPress) onLogMoodPress();
    } else if (id === "create_habit") {
      setIsCreateModalOpen(true);
    } else if (id === "complete_habit") {
      if (userHabitCount === 0) {
        setIsCreateModalOpen(true);
      } else if (todaysUserHabit && todaysUserHabit.length > 0) {
        const firstHabit = todaysUserHabit[0];
        navigation.navigate("UserHabitDetails", {
          habitId: firstHabit.userHabitId || firstHabit.id || firstHabit.UserHabitId,
          date: todayStr,
          isFuture: false
        });
      } else {
        navigation.navigate("UserHabits", { initialFilter: "Today" });
      }
    }
  };

  const checklistItems = [
    {
      id: "log_mood",
      titleKey: "home.checklist_log_mood",
      descKey: "home.checklist_log_mood_desc",
      completed: isMoodLogged,
      xp: "+5 XP"
    },
    {
      id: "create_habit",
      titleKey: "home.checklist_create_habit",
      descKey: "home.checklist_create_habit_desc",
      completed: isHabitCreated,
      xp: "+15 XP"
    },
    {
      id: "complete_habit",
      titleKey: "home.checklist_complete_habit",
      descKey: "home.checklist_complete_habit_desc",
      completed: isHabitCompleted,
      xp: "+20 XP"
    }
  ];

  if (checklistCompleted === "true") {
    return null;
  }

  const renderChecklistCard = (item, isReplica = false, layout = null, isModalReplica = false) => {
    const isActiveGuided = isGuidanceActive && activeGuidedItemId === item.id;
    return (
      <TouchableOpacity
        ref={isActiveGuided && !isReplica && !isModalReplica ? activeCardRef : null}
        key={item.id + (isReplica ? "-replica" : "") + (isModalReplica ? "-modal" : "")}
        activeOpacity={0.7}
        onPress={() => handleTaskPress(item.id)}
        disabled={isGuidanceActive && !isActiveGuided}
        onLayout={(e) => {
          if (isReplica) return;
          const { x, y, width, height } = e.nativeEvent.layout;
          if (item.id === "log_mood") setLogMoodLayout({ x, y, width, height });
          else if (item.id === "create_habit") setCreateHabitLayout({ x, y, width, height });
          else if (item.id === "complete_habit") setCompleteHabitLayout({ x, y, width, height });
        }}
        className="flex-row items-center justify-between p-4 rounded-2xl border mb-3"
        style={(isReplica || isModalReplica) ? {
          position: "absolute",
          left: layout.x,
          top: isModalReplica ? layout.y : layout.y,
          width: layout.width,
          height: layout.height,
          backgroundColor: colors.card,
          borderColor: colors.primary,
          borderWidth: 1.5,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
          zIndex: 100,
        } : {
          backgroundColor: colors.card,
          borderColor: isActiveGuided ? colors.primary : colors.border,
          borderWidth: isActiveGuided ? 1.5 : 1,
          opacity: isGuidanceActive && !isActiveGuided ? 0.4 : 1,
          shadowColor: isActiveGuided ? colors.primary : "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isActiveGuided ? 0.15 : 0.03,
          shadowRadius: isActiveGuided ? 6 : 4,
          elevation: isActiveGuided ? 4 : 2,
        }}
      >
        <View className="flex-row items-center flex-1 mr-3">
          {/* Status Circle Indicator */}
          <View
            className="w-8 h-8 rounded-full items-center justify-center mr-3"
            style={{
              backgroundColor: item.completed ? colors.primarySurface : colors.cardSecondary,
              borderWidth: item.completed ? 0 : 1,
              borderColor: colors.border,
            }}
          >
            {item.completed ? (
              <FontAwesomeIcon icon={faCheck} size={12} color={colors.primary} />
            ) : (
              <View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors.border }} />
            )}
          </View>

          {/* Text content */}
          <View className="flex-1">
            <Text
              style={{
                color: colors.text,
                opacity: item.completed ? 0.55 : 1,
              }}
              className={`text-sm ${item.completed ? "font-redditsans-medium" : "font-redditsans-bold"}`}
            >
              {t(item.titleKey)}
            </Text>
            <Text
              style={{ color: colors.textSecondary }}
              className="text-xs font-redditsans-regular mt-0.5"
            >
              {t(item.descKey)}
            </Text>
            {isActiveGuided && (
              <Text
                style={{ color: colors.primary }}
                className="text-xs font-redditsans-bold mt-1.5"
              >
                {getGuideTapText()}
              </Text>
            )}
          </View>
        </View>

        {/* Right side: XP Badge & Chevron */}
        <View className="flex-row items-center">
          <View
            className="px-2 py-1 rounded-lg mr-2"
            style={{
              backgroundColor: item.completed ? colors.cardSecondary : "#f59e0b15",
            }}
          >
            <Text
              className="text-xs font-bold"
              style={{
                color: item.completed ? colors.textMuted : "#f59e0b",
              }}
            >
              {item.completed ? t("common.completed") : item.xp}
            </Text>
          </View>
          {isActiveGuided ? (
            <Animated.View style={{ transform: [{ translateX: arrowAnim }] }}>
              <FontAwesomeIcon icon={faChevronRight} size={12} color={colors.primary} />
            </Animated.View>
          ) : (
            <FontAwesomeIcon icon={faChevronRight} size={12} color={colors.textMuted} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="mb-6 px-4">
      {/* Title with progress indicator */}
      <View className="flex-row justify-between items-center mb-1">
        <Text style={{ color: colors.text }} className="text-lg font-redditsans-bold">
          {t("home.checklist_title")} ({completedCount}/3 {t("common.completed")})
        </Text>
      </View>

      {/* Unlock AI Mentor message / Subtitle */}
      <Text style={{ color: colors.textSecondary }} className="text-xs font-redditsans-regular mb-3">
        {t("home.checklist_subtitle")}
      </Text>

      {/* Progress Bar */}
      <View style={{ backgroundColor: colors.border + "30" }} className="w-full h-2 rounded-full overflow-hidden mb-4">
        <LinearGradient
          colors={[colors.primary, colors.primaryLight || colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ width: `${progressPercentage}%` }}
          className="h-full rounded-full"
        />
      </View>

      {/* Checklist items */}
      <View style={{ position: "relative" }}>
        {checklistItems.map((item) => renderChecklistCard(item))}

        {/* Full-Screen Dark Mask & Focused Card Modal (covers headers and tabs) */}
        <Modal
          visible={isGuidanceActive && absoluteLayout !== null && isSplashFinished === true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => { }}
        >
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.72)" }}>
            {(() => {
              const activeItem = checklistItems.find((i) => i.id === activeGuidedItemId);
              if (!activeItem || !absoluteLayout) return null;
              return renderChecklistCard(activeItem, false, absoluteLayout, true);
            })()}
          </View>
        </Modal>
      </View>

      {/* Success / Celebration Modal */}
      <Modal
        visible={showCelebration}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCelebrationDismiss}
      >
        <View className="flex-1 justify-center items-center px-6" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
          <View
            style={{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }}
            className="w-full rounded-[32px] p-6 items-center shadow-2xl"
          >
            {/* Trophy Icon */}
            <View style={{ backgroundColor: "#f59e0b20" }} className="w-20 h-20 rounded-full items-center justify-center mb-4">
              <FontAwesomeIcon icon={faTrophy} size={38} color="#f59e0b" />
            </View>

            <Text style={{ color: colors.text }} className="text-xl font-redditsans-black text-center mb-2">
              {t("home.checklist_success_title")}
            </Text>

            <Text style={{ color: colors.textSecondary }} className="text-sm font-redditsans-regular text-center mb-6 px-4">
              {t("home.checklist_success_desc")}
            </Text>

            {/* XP Award Badge */}
            <View style={{ backgroundColor: colors.primary + "15" }} className="px-6 py-3 rounded-2xl items-center justify-center mb-6">
              <Text style={{ color: colors.primary }} className="text-2xl font-redditsans-bold">
                +50 XP
              </Text>
              <Text style={{ color: colors.textSecondary }} className="text-xs font-redditsans-regular mt-0.5">
                {t("home.checklist_bonus_awarded", "Checklist Completion Bonus")}
              </Text>
            </View>

            <TouchableOpacity
              style={{ backgroundColor: colors.primary }}
              className="w-full py-4 rounded-2xl items-center justify-center"
              onPress={handleCelebrationDismiss}
              activeOpacity={0.8}
            >
              <Text className="text-white text-base font-redditsans-bold">
                {t("home.checklist_success_btn")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default GettingStartedChecklist;
