import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Animated } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faArrowLeft, faRedo, faTrophy, faTimes, faVolumeHigh, faVolumeMute, faHourglassHalf } from "@fortawesome/free-solid-svg-icons";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { useMMKVString, useMMKVBoolean } from "react-native-mmkv";
import { submitGameScoreFetch } from "../../utils/fetch";
import Sound from "react-native-sound";
Sound.setCategory("Playback");

export default function ReactionGameScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { colors } = theme;
  const { t } = useTranslation();
  const [token] = useMMKVString("accessToken");
  const [soundEnabled, setSoundEnabled] = useMMKVBoolean("settings.soundEnabled");
  const isSoundEnabled = soundEnabled ?? true;

  // Game States: 'idle', 'waiting', 'ready', 'too_early', 'result', 'gameOver'
  const [gameState, setGameState] = useState("idle");
  const [round, setRound] = useState(1);
  const [times, setTimes] = useState([]);
  const [currentResult, setCurrentResult] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const timeoutRef = useRef(null);
  const startTimeRef = useRef(0);
  const flashAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const playSound = (fileName) => {
    if (!isSoundEnabled) return;
    const sfx = new Sound(fileName, Sound.MAIN_BUNDLE, (error) => {
      if (!error) {
        sfx.play(() => sfx.release());
      }
    });
  };

  const startGame = () => {
    setRound(1);
    setTimes([]);
    setCurrentResult(0);
    setSubmitted(false);
    startRound();
  };

  const startRound = () => {
    setGameState("waiting");
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    // Random delay between 1.5 and 4 seconds
    const randomDelay = Math.random() * 2500 + 1500;

    timeoutRef.current = setTimeout(() => {
      setGameState("ready");
      startTimeRef.current = Date.now();
      playSound("success.mp3");
      // Trigger subtle pulse animation on entry
      Animated.sequence([
        Animated.timing(flashAnim, { toValue: 1, duration: 100, useNativeDriver: false }),
        Animated.timing(flashAnim, { toValue: 0, duration: 200, useNativeDriver: false })
      ]).start();
    }, randomDelay);
  };

  const handleScreenPress = () => {
    if (gameState === "waiting") {
      // Too early!
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setGameState("too_early");
      playSound("wrong.mp3");
    } else if (gameState === "ready") {
      // Success click!
      const clickTime = Date.now() - startTimeRef.current;
      setCurrentResult(clickTime);
      playSound("click.mp3");

      const newTimes = [...times, clickTime];
      setTimes(newTimes);
      
      if (round < 5) {
        setGameState("result");
      } else {
        // Round 5 is done! Transition immediately to gameOver and submit the score.
        setGameState("gameOver");
        playSound("congrats.mp3");
        const average = calculateAverage(newTimes);
        const finalScore = calculateScore(average);
        submitScoreAutomatically(finalScore);
      }
    }
  };

  const nextStep = () => {
    if (round < 5) {
      setRound(round + 1);
      startRound();
    } else {
      setGameState("gameOver");
      playSound("congrats.mp3");
      const average = calculateAverage(times);
      const finalScore = calculateScore(average);
      submitScoreAutomatically(finalScore);
    }
  };

  const calculateAverage = (list) => {
    if (list.length === 0) return 0;
    const sum = list.reduce((a, b) => a + b, 0);
    return Math.round(sum / list.length);
  };

  const calculateScore = (averageTime) => {
    if (averageTime <= 0) return 0;
    // Faster reaction time -> higher score. E.g. 250ms -> (1000 - 250) * 10 = 7500 points.
    return Math.max(0, 1000 - averageTime) * 10;
  };

  const submitScoreAutomatically = async (finalScore) => {
    if (!token || finalScore <= 0) return;

    try {
      setSubmitting(true);
      setSubmitted(false);
      const res = await submitGameScoreFetch(token, {
        gameType: "ReactionTime",
        score: finalScore,
        timeTakenSeconds: 0,
        difficulty: null,
        moveCount: 0,
      });

      if (res && res.success) {
        setSubmitted(true);
      }
    } catch (err) {
      console.log("Error submitting reaction score:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Color mapping based on state
  const getBackgroundColor = () => {
    switch (gameState) {
      case "waiting":
        return "#EF4444"; // Red for wait
      case "ready":
        return "#10B981"; // Green for tap now
      case "too_early":
        return "#F59E0B"; // Orange for warning
      default:
        return colors.cardSecondary;
    }
  };

  const getOverlayOpacity = flashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.4]
  });

  const averageTime = calculateAverage(times);

  return (
    <LinearGradient colors={colors.backgroundGradient} className="flex-1">
      <SafeAreaView className="flex-1 px-4">
        {/* Header */}
        <View className="flex-row items-center justify-between py-4">
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.cardSecondary }}
          >
            <FontAwesomeIcon icon={faArrowLeft} size={18} color={colors.text} />
          </TouchableOpacity>
          <Text 
            className="flex-1 text-center mx-2 text-lg font-redditsans-bold" 
            style={{ color: colors.text }}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            ⏱️ {t("games.reaction_game")}
          </Text>
          <View className="flex-row gap-2">
            <TouchableOpacity 
              onPress={() => setSoundEnabled(!isSoundEnabled)}
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.cardSecondary }}
            >
              <FontAwesomeIcon 
                icon={isSoundEnabled ? faVolumeHigh : faVolumeMute} 
                size={16} 
                color={isSoundEnabled ? colors.primary : colors.textSecondary} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={startGame}
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.cardSecondary }}
            >
              <FontAwesomeIcon icon={faRedo} size={16} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Interface Area */}
        {gameState === "idle" && (
          <View className="flex-1 justify-center py-6">
            <View className="py-8 px-6 rounded-3xl items-center justify-center mb-6" style={{ backgroundColor: colors.cardSecondary }}>
              <View className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 items-center justify-center mb-6">
                <FontAwesomeIcon icon={faHourglassHalf} size={36} color="#3B82F6" />
              </View>
              <Text className="text-xl font-redditsans-bold mb-3 text-center" style={{ color: colors.text }}>
                {t("games.reaction_game")}
              </Text>
              <Text className="text-sm font-redditsans-regular text-center mb-6 px-4" style={{ color: colors.textSecondary }}>
                {t("games.reaction_instructions")}
              </Text>
              <TouchableOpacity
                onPress={startGame}
                className="py-4 px-12 rounded-full shadow-lg"
                style={{ backgroundColor: colors.primary }}
              >
                <Text className="text-white font-redditsans-bold text-base">
                  {t("games.play_now")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Active Game Screens (Waiting, Ready, Too Early, Result) */}
        {(gameState === "waiting" || gameState === "ready" || gameState === "too_early" || gameState === "result") && (
          <TouchableOpacity
            activeOpacity={1}
            onPress={handleScreenPress}
            className="flex-1 rounded-3xl overflow-hidden my-4 justify-center items-center relative"
            style={{ backgroundColor: getBackgroundColor() }}
          >
            <Animated.View 
              style={{ 
                position: 'absolute', 
                top: 0, left: 0, right: 0, bottom: 0, 
                backgroundColor: '#ffffff', 
                opacity: getOverlayOpacity 
              }} 
            />

            {gameState === "waiting" && (
              <View className="items-center">
                <Text className="text-white font-redditsans-bold text-3xl mb-4 text-center px-4 animate-pulse">
                  {t("games.reaction_wait")}
                </Text>
                <Text className="text-white/80 font-redditsans-medium text-sm">
                  {t("games.reaction_round", { round })}
                </Text>
              </View>
            )}

            {gameState === "ready" && (
              <View className="items-center">
                <Text className="text-white font-redditsans-bold text-5xl mb-4 text-center">
                  {t("games.reaction_tap")}
                </Text>
              </View>
            )}

            {gameState === "too_early" && (
              <View className="items-center px-6">
                <Text className="text-white font-redditsans-bold text-3xl mb-3 text-center">
                  ⚠️ {t("games.reaction_too_early")}
                </Text>
                <TouchableOpacity
                  onPress={startRound}
                  className="mt-6 py-3 px-8 rounded-full bg-white/20 border border-white/40"
                >
                  <Text className="text-white font-redditsans-bold text-base">
                    {t("games.restart")}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {gameState === "result" && (
              <View className="items-center px-6">
                <Text className="text-white/80 font-redditsans-bold text-xl mb-2 text-center uppercase">
                  {t("games.reaction_round", { round })}
                </Text>
                <Text className="text-white font-redditsans-bold text-6xl mb-6">
                  {currentResult} <Text className="text-3xl">{t("games.reaction_ms")}</Text>
                </Text>
                <TouchableOpacity
                  onPress={nextStep}
                  className="py-3 px-10 rounded-full bg-white text-center"
                  style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}
                >
                  <Text className="font-redditsans-bold text-base" style={{ color: colors.primary }}>
                    {t("explore.next", "Növbəti")}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* Game Over Screen */}
        {gameState === "gameOver" && (
          <View className="flex-1 justify-center py-6">
            <View className="py-6 px-6 rounded-3xl items-center justify-center mb-6" style={{ backgroundColor: colors.cardSecondary }}>
              <View className="w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-950/20 items-center justify-center mb-4">
                <FontAwesomeIcon icon={faTrophy} size={28} color="#F59E0B" />
              </View>
              <Text className="text-2xl font-redditsans-bold mb-1 text-center" style={{ color: colors.text }}>
                {t("games.game_over")}
              </Text>
              <Text className="text-sm font-redditsans-medium text-center mb-6" style={{ color: colors.textSecondary }}>
                {t("games.congrats")}
              </Text>

              {/* Rounds breakdown */}
              <View className="w-full bg-black/5 dark:bg-white/5 rounded-2xl p-4 mb-6">
                {times.map((tVal, idx) => (
                  <View key={idx} className="flex-row justify-between py-1.5 border-b border-black/5 dark:border-white/5">
                    <Text className="font-redditsans-medium text-sm" style={{ color: colors.textSecondary }}>
                      {t("games.reaction_round", { round: idx + 1 })}
                    </Text>
                    <Text className="font-redditsans-bold text-sm" style={{ color: colors.text }}>
                      {tVal} {t("games.reaction_ms")}
                    </Text>
                  </View>
                ))}
                <View className="flex-row justify-between pt-3 mt-1.5 border-t border-black/10 dark:border-white/10">
                  <Text className="font-redditsans-bold text-base" style={{ color: colors.text }}>
                    {t("games.reaction_average")}
                  </Text>
                  <Text className="font-redditsans-bold text-base" style={{ color: colors.primary }}>
                    {averageTime} {t("games.reaction_ms")}
                  </Text>
                </View>
              </View>

              {submitting ? (
                <View className="flex-row items-center gap-2 mb-2">
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text className="font-redditsans-medium text-sm" style={{ color: colors.textSecondary }}>
                    {t("games.submitting_score")}
                  </Text>
                </View>
              ) : submitted ? (
                <Text className="text-sm font-redditsans-bold text-green-500 mb-4">
                  {t("games.score_submitted")}
                </Text>
              ) : null}

              <TouchableOpacity
                onPress={startGame}
                className="py-4 px-12 rounded-full shadow-lg w-full items-center"
                style={{ backgroundColor: colors.primary }}
              >
                <Text className="text-white font-redditsans-bold text-base">
                  {t("games.restart")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}
