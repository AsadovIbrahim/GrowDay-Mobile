import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, Animated, Alert } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import LinearGradient from "react-native-linear-gradient";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faBrain, faLock, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { storage, getAiMentorRemainingMessagesKey, getAiMentorLastActiveDateKey } from "../utils/MMKVStore";
import { useMMKVString } from "react-native-mmkv";
import { aiMentorRemainingFetch } from "../utils/fetch";

const AIMentorCard = ({ totalExperiencePoints }) => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { theme, isDark } = useTheme();
  const { colors } = theme;
  const [token] = useMMKVString("accessToken");

  // Level hesablama
  const userLevel = Math.floor(Math.sqrt((totalExperiencePoints || 0) / 50)) + 1;
  const isLocked = false;

  const [remainingMessages, setRemainingMessages] = useState(5);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Gündəlik limit yoxlanması və sinxronizasiyası
  const syncRemainingMessages = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const activeDateKey = getAiMentorLastActiveDateKey(token);
      const remainingKey = getAiMentorRemainingMessagesKey(token);
      const lastDate = storage.getString(activeDateKey);
      let remaining = storage.getNumber(remainingKey);

      if (lastDate !== today) {
        remaining = 5;
        storage.set(remainingKey, 5);
        storage.set(activeDateKey, today);
      } else if (remaining === undefined || isNaN(remaining)) {
        remaining = 5;
        storage.set(remainingKey, 5);
      }
      setRemainingMessages(remaining);

      if (token) {
        const res = await aiMentorRemainingFetch(token);
        if (res && res.success && typeof res.data === 'number') {
          storage.set(remainingKey, res.data);
          storage.set(activeDateKey, today);
          setRemainingMessages(res.data);
        }
      }
    } catch (e) {
      console.log("Error syncing remaining messages:", e);
      setRemainingMessages(5);
    }
  };

  useEffect(() => {
    syncRemainingMessages();
  }, [token]);

  useFocusEffect(
    React.useCallback(() => {
      syncRemainingMessages();
    }, [token])
  );

  // AI Icon üçün pulsating animasiyası
  useEffect(() => {
    if (!isLocked) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.12,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isLocked]);

  const handlePress = () => {
    if (isLocked) {
      Alert.alert(
        t("levelup.ai_locked_title", "AI Coach Locked"),
        t("levelup.ai_locked_desc", { userLevel: 3 })
      );
    } else {
      navigation.navigate("AIMentorChat");
    }
  };

  // Play Store / App Store səviyyəsində ultra premium rənglər
  const gradientColors = isLocked
    ? isDark
      ? ["#1e293b", "#0f172a"] // Sleek metallik tünd boz
      : ["#f3f4f6", "#e5e7eb"] // Minimalist açıq boz
    : isDark
      ? ["#161329", "#0b0c16"] // Obsidian Cosmic: Dərin sirli tünd bənövşəyi-göy rəng (AI hissi verir)
      : ["#ffffff", "#f5f3ff"]; // Pristine: Təmiz ağdan çox zərif lavanda/bənövşəyi çalara keçid

  const cardBorderColor = isLocked
    ? colors.border
    : isDark
      ? "rgba(139, 92, 246, 0.22)" // Zərif neon-bənövşəyi kənar xətt (tünd rejim)
      : "rgba(139, 92, 246, 0.12)"; // Zərif bənövşəyi kənar xətt (açıq rejim)

  const renderCardBody = () => {
    return (
      <View
        style={{
          borderRadius: 16,
          borderWidth: 1,
          borderColor: cardBorderColor,
          overflow: "hidden",
        }}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View className="p-3.5 flex-row items-center justify-between">
            <View className="flex-row items-center flex-1 pr-2">
              {/* Animated AI Icon container */}
              <Animated.View
                style={{
                  transform: [{ scale: pulseAnim }],
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isLocked ? (
                  <View
                    style={{
                      backgroundColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.04)",
                      padding: 8,
                      borderRadius: 50,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <FontAwesomeIcon
                      icon={faLock}
                      size={14}
                      color={colors.textMuted}
                    />
                  </View>
                ) : (
                  <LinearGradient
                    colors={["#8b5cf6", "#ec4899"]} // AI orbunun daxilində canlı gradient
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      padding: 8,
                      borderRadius: 50,
                      shadowColor: "#8b5cf6",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.3,
                      shadowRadius: 4,
                      elevation: 2,
                    }}
                  >
                    <FontAwesomeIcon
                      icon={faBrain}
                      size={14}
                      color="#ffffff"
                    />
                  </LinearGradient>
                )}
              </Animated.View>

              {/* Title & Subtitle */}
              <View className="ml-3 flex-1">
                <View className="flex-row items-center">
                  <Text
                    className="font-redditsans-bold text-[15px] tracking-wide"
                    style={{ color: colors.text }}
                  >
                    {t("ai_mentor.card_title", "AI Mentor")}
                  </Text>
                  {!isLocked && (
                    <View className="bg-indigo-500/10 px-1.5 py-0.5 rounded-md ml-2">
                      <Text className="text-[8px] font-redditsans-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400">
                        Beta
                      </Text>
                    </View>
                  )}
                </View>
                <Text
                  style={{ color: colors.textSecondary }}
                  className="text-[11px] font-redditsans-medium mt-0.5"
                  numberOfLines={1}
                >
                  {isLocked
                    ? t("ai_mentor.card_locked", "Unlock at Level 3")
                    : t("ai_mentor.compact_desc", "Get personalized recommendations tailored to your goals.")}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center">
              {!isLocked && (
                <View className="mr-3 items-end">
                  <View className="bg-green-500/10 px-2 py-0.5 rounded-full">
                    <Text className="text-[10px] font-redditsans-bold text-green-600 dark:text-green-400">
                      {t("ai_mentor.remaining_badge", { remaining: remainingMessages })}
                    </Text>
                  </View>
                </View>
              )}
              <FontAwesomeIcon
                icon={faChevronRight}
                size={12}
                color={colors.textMuted}
              />
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handlePress}
      className="mx-4"
      style={{
        shadowColor: isLocked ? "#000" : "#8b5cf6",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isLocked ? 0.05 : 0.1,
        shadowRadius: 6,
        elevation: 2,
      }}
    >
      {renderCardBody()}
    </TouchableOpacity>
  );
};

export default AIMentorCard;
