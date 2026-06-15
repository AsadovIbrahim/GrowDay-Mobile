import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Modal, ActivityIndicator, Animated } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faArrowLeft, faTrophy, faTimes, faBrain, faVolumeHigh, faVolumeMute } from "@fortawesome/free-solid-svg-icons";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { useMMKVString, useMMKVBoolean } from "react-native-mmkv";
import { submitGameScoreFetch } from "../../utils/fetch";
import Reanimated, { useSharedValue, useAnimatedStyle, withSpring, withSequence, withTiming } from 'react-native-reanimated';
import Sound from "react-native-sound";
import GameDifficultyModal from "../../components/GameDifficultyModal";
Sound.setCategory("Playback");

// Colors used in the game
const STROOP_COLORS = [
  { key: "color_red", hex: "#EF4444" },
  { key: "color_blue", hex: "#3B82F6" },
  { key: "color_green", hex: "#10B981" },
  { key: "color_yellow", hex: "#FBBF24" },
  { key: "color_purple", hex: "#8B5CF6" },
  { key: "color_orange", hex: "#F97316" },
];

const GAME_DURATION = 30; // seconds

function generateRound(t, difficultyId = "medium") {
  // Pick a random word and a random ink color that are DIFFERENT
  const wordIdx = Math.floor(Math.random() * STROOP_COLORS.length);
  let inkIdx = Math.floor(Math.random() * STROOP_COLORS.length);
  while (inkIdx === wordIdx) {
    inkIdx = Math.floor(Math.random() * STROOP_COLORS.length);
  }

  const STROOP_LANG_COLORS = STROOP_COLORS.map(c => ({
    name: t(`games.${c.key}`),
    hex: c.hex
  }));

  const numChoices = (difficultyId === "hard" || difficultyId === "expert") ? 6 : 4;

  // Build answer choices: correct ink + distractors
  const correct = STROOP_LANG_COLORS[inkIdx];
  const choices = [correct];
  while (choices.length < numChoices) {
    const c = STROOP_LANG_COLORS[Math.floor(Math.random() * STROOP_LANG_COLORS.length)];
    if (!choices.find(ch => ch.name === c.name)) choices.push(c);
  }
  // Shuffle
  choices.sort(() => Math.random() - 0.5);

  let transform = [];
  if (difficultyId === "expert") {
    // Random rotation for expert mode to confuse the brain
    const rotations = ['180deg', '-90deg', '90deg'];
    transform = [{ rotate: rotations[Math.floor(Math.random() * rotations.length)] }];
  }

  return {
    word: STROOP_LANG_COLORS[wordIdx].name,
    inkColor: correct.hex,
    correctName: correct.name,
    choices,
    transform,
  };
}

const PulseButton = ({ color, label, onPress, disabled }) => {
  const scale = useSharedValue(1);

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(0.93, { damping: 15, stiffness: 200 }),
      withSpring(1)
    );
    onPress();
  };

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <TouchableOpacity activeOpacity={1} onPress={handlePress} disabled={disabled} className="w-[46%] mb-4">
      <Reanimated.View
        className="py-4 rounded-2xl items-center justify-center"
        style={[style, { backgroundColor: color + "20", borderWidth: 2, borderColor: color + "60" }]}
      >
        <View className="w-5 h-5 rounded-full mb-2" style={{ backgroundColor: color }} />
        <Text className="font-redditsans-bold text-base" style={{ color }}>
          {label}
        </Text>
      </Reanimated.View>
    </TouchableOpacity>
  );
};

export default function StroopGameScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { colors } = theme;
  const { t } = useTranslation();
  const [token] = useMMKVString("accessToken");
  const [soundEnabled, setSoundEnabled] = useMMKVBoolean("settings.soundEnabled");
  const isSoundEnabled = soundEnabled ?? true;

  const [round, setRound] = useState(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxTime, setMaxTime] = useState(30);
  const [timeLeft, setTimeLeft] = useState(30);
  const [lives, setLives] = useState(3);
  const [gameState, setGameState] = useState("idle"); // idle | playing | feedback | gameOver
  const [lastCorrect, setLastCorrect] = useState(null); // true | false
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [difficultyModalVisible, setDifficultyModalVisible] = useState(false);
  const [activeDifficulty, setActiveDifficulty] = useState({ id: 'medium', mult: 1 });

  const timerRef = useRef(null);
  const feedbackAnim = useSharedValue(1);

  const [toastMsg, setToastMsg] = useState("");
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;

  const triggerToast = (message) => {
    setToastMsg(message);
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.5);
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
      ]),
      Animated.delay(900),
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0.8, duration: 200, useNativeDriver: true }),
      ]),
    ]).start();
  };

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    if (gameState === "playing") {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            endGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [gameState]);

  const startGame = (diff) => {
    setActiveDifficulty(diff);

    let startLives = 3;
    let startTime = 30;

    if (diff.id === 'easy') { startTime = 45; startLives = 5; }
    else if (diff.id === 'medium') { startTime = 30; startLives = 3; }
    else if (diff.id === 'hard') { startTime = 20; startLives = 1; }
    else if (diff.id === 'expert') { startTime = 15; startLives = 1; }

    setMaxTime(startTime);
    setTimeLeft(startTime);
    setLives(startLives);
    setScore(0);
    setStreak(0);
    setLastCorrect(null);
    setSubmitted(false);
    setRound(generateRound(t, diff.id));
    setGameState("playing");
  };

  const endGame = () => {
    setGameState("gameOver");
    if (isSoundEnabled) {
      const sfx = new Sound('congrats.mp3', Sound.MAIN_BUNDLE, (error) => {
        if (!error) {
          sfx.play(() => sfx.release());
        }
      });
    }
  };

  const handleAnswer = (choiceName) => {
    if (gameState !== "playing" || !round) return;

    const correct = choiceName === round.correctName;
    setLastCorrect(correct);

    if (isSoundEnabled) {
      const sfxFile = correct ? 'success.mp3' : 'wrong.mp3';
      const sfx = new Sound(sfxFile, Sound.MAIN_BUNDLE, (error) => {
        if (!error) {
          sfx.play(() => sfx.release());
        }
      });
    }

    if (correct) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      const bonus = newStreak >= 5 ? 20 : newStreak >= 3 ? 15 : 10;
      setScore(prev => prev + Math.floor(bonus * activeDifficulty.mult));
      if (newStreak === 3) triggerToast("🔥 " + t("games.toast_start", "Yaxşı başlanğıc! 🎯"));
      if (newStreak === 5) triggerToast("⚡ " + t("games.toast_doing_great", "Əla gedirsən! 🔥"));
      if (newStreak === 10) triggerToast("🧠 " + t("games.toast_genius", "Sən dahisən! 🏆"));

      setGameState("feedback");
      setTimeout(() => {
        setLastCorrect(null);
        setRound(generateRound(t, activeDifficulty.id));
        setGameState("playing");
      }, 380);
    } else {
      setStreak(0);
      const remainingLives = lives - 1;
      setLives(remainingLives);

      setGameState("feedback");
      setTimeout(() => {
        setLastCorrect(null);
        if (remainingLives <= 0) {
          endGame();
        } else {
          setRound(generateRound(t, activeDifficulty.id));
          setGameState("playing");
        }
      }, 380);
    }
  };

  const submitScore = async (finalScore) => {
    if (!token || finalScore <= 0) return;
    try {
      setSubmitting(true);
      const res = await submitGameScoreFetch(token, {
        gameType: "StroopTest",
        score: finalScore,
        timeTakenSeconds: maxTime,
        difficulty: activeDifficulty?.id || null,
        moveCount: 0,
      });
      if (res?.success) setSubmitted(true);
    } catch (err) {
      console.log("Stroop submit error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (gameState === "gameOver" && score > 0) {
      submitScore(score);
    }
  }, [gameState]);

  // Progress bar color: green → yellow → red
  const timerPercent = timeLeft / maxTime;
  const timerColor = timerPercent > 0.5 ? "#10B981" : timerPercent > 0.25 ? "#F59E0B" : "#EF4444";

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
            🎨 {t("games.stroop_test", "Stroop Sınağı")}
          </Text>
          <TouchableOpacity
            onPress={() => setSoundEnabled(!isSoundEnabled)}
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.cardSecondary }}
          >
            <FontAwesomeIcon
              icon={isSoundEnabled ? faVolumeHigh : faVolumeMute}
              size={18}
              color={isSoundEnabled ? colors.primary : colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Stats Bar */}
        <View className="flex-row justify-between mb-5 px-1">
          <View className="flex-1 py-3 rounded-2xl mr-2 items-center"
            style={{ backgroundColor: colors.cardSecondary }}>
            <Text className="text-[10px] font-redditsans-medium mb-0.5" style={{ color: colors.textSecondary }}>{t("games.score", "Xal")}</Text>
            <Text className="text-base font-redditsans-bold" style={{ color: colors.primary }}>{score}</Text>
          </View>
          <View className="flex-1 py-3 rounded-2xl mr-2 items-center"
            style={{ backgroundColor: colors.cardSecondary }}>
            <Text className="text-[10px] font-redditsans-medium mb-0.5" style={{ color: colors.textSecondary }}>{t("games.streak", "Sıra")}</Text>
            <Text className="text-base font-redditsans-bold" style={{ color: streak >= 3 ? "#F59E0B" : colors.text }}>
              {streak} 🔥
            </Text>
          </View>
          <View className="flex-1 py-3 rounded-2xl mr-2 items-center"
            style={{ backgroundColor: colors.cardSecondary }}>
            <Text className="text-[10px] font-redditsans-medium mb-0.5" style={{ color: colors.textSecondary }}>{t("games.lives", "Can")}</Text>
            <Text className="text-base font-redditsans-bold" style={{ color: lives <= 1 ? "#EF4444" : colors.text }}>
              {lives} ❤️
            </Text>
          </View>
          <View className="flex-1 py-3 rounded-2xl items-center"
            style={{ backgroundColor: colors.cardSecondary }}>
            <Text className="text-[10px] font-redditsans-medium mb-0.5" style={{ color: colors.textSecondary }}>{t("games.time", "Vaxt")}</Text>
            <Text className={`font-redditsans-bold text-base ${timeLeft <= 10 ? 'text-red-500' : 'text-emerald-500'}`}>
              {timeLeft}s
            </Text>
          </View>
        </View>

        {/* Timer Bar */}
        <View className="h-2 rounded-full mb-6 overflow-hidden" style={{ backgroundColor: colors.cardSecondary }}>
          <Animated.View
            className="h-full rounded-full"
            style={{ width: `${timerPercent * 100}%`, backgroundColor: timerColor }}
          />
        </View>

        {/* Main Content */}
        <View className="flex-1 items-center justify-center">
          {gameState === "idle" ? (
            <View className="w-full items-center px-6">
              <Text className="text-5xl mb-6">🎨</Text>
              <Text className="text-2xl font-redditsans-bold text-center mb-3" style={{ color: colors.text }}>
                {t("games.stroop_test", "Stroop Sınağı")}
              </Text>
              <Text className="text-sm font-redditsans-regular text-center mb-2" style={{ color: colors.textSecondary }}>
                {t("games.stroop_instruction")}
              </Text>
              <Text className="text-xs font-redditsans-regular text-center mb-8" style={{ color: colors.textSecondary + "80" }}>
                {t("games.stroop_tip")}
              </Text>
              <TouchableOpacity
                onPress={() => setDifficultyModalVisible(true)}
                className="w-full py-4 rounded-full items-center justify-center shadow-lg"
                style={{ backgroundColor: colors.primary, shadowColor: colors.primary }}
              >
                <Text className="text-white font-redditsans-bold text-lg">
                  {t("games.start", "Başla")}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (gameState === "playing" || gameState === "feedback") && round ? (
            <View className="w-full items-center">
              {/* Instruction */}
              <Text className="text-xs font-redditsans-medium mb-3" style={{ color: colors.textSecondary }}>
                {t("games.stroop_play_instruction", "Bu sözün yazı rəngini tap 👇")}
              </Text>

              {/* The Word Card */}
              {(() => {
                const isRotated = round.transform && round.transform.some(t => t.rotate === "90deg" || t.rotate === "-90deg");
                const fontSize = isRotated
                  ? (round.word.length > 8 ? 28 : 34)
                  : (round.word.length > 8 ? 36 : 44);
                const cardHeight = activeDifficulty?.id === "expert" ? 220 : 180;

                return (
                  <View
                    className="w-full rounded-3xl mb-8 items-center justify-center"
                    style={{
                      height: cardHeight,
                      backgroundColor: gameState === "feedback"
                        ? (lastCorrect ? "#10B981" + "20" : "#EF4444" + "20")
                        : colors.cardSecondary,
                      borderWidth: 2,
                      borderColor: gameState === "feedback"
                        ? (lastCorrect ? "#10B981" : "#EF4444")
                        : colors.border,
                    }}
                  >
                    <Text
                      className="font-redditsans-bold"
                      style={{ fontSize, color: round.inkColor, letterSpacing: 2, transform: round.transform || [] }}
                    >
                      {round.word}
                    </Text>
                    {gameState === "feedback" && (
                      <Text className="mt-3 font-redditsans-bold text-lg"
                        style={{ color: lastCorrect ? "#10B981" : "#EF4444" }}>
                        {lastCorrect ? "✓ " + t("games.stroop_correct", "Düzgün!") : "✗ " + t("games.stroop_wrong", "Yanlış!")}
                      </Text>
                    )}
                  </View>
                );
              })()}

              {/* Answer Choices */}
              <View className="flex-row flex-wrap justify-between w-full">
                {round.choices.map((c) => (
                  <PulseButton
                    key={c.name}
                    color={c.hex}
                    label={c.name}
                    onPress={() => handleAnswer(c.name)}
                    disabled={gameState !== "playing"}
                  />
                ))}
              </View>
            </View>
          ) : null}
        </View>

        {/* Game Over Modal */}
        <Modal visible={gameState === "gameOver"} transparent animationType="fade">
          <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: "rgba(0,0,0,0.55)" }}>
            <View className="w-full max-w-sm rounded-3xl p-6 items-center shadow-lg relative"
              style={{ backgroundColor: colors.card }}>
              <TouchableOpacity
                onPress={() => { setGameState("idle"); navigation.goBack(); }}
                className="absolute top-4 right-4 w-8 h-8 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.cardSecondary }}
              >
                <FontAwesomeIcon icon={faTimes} size={14} color={colors.textSecondary} />
              </TouchableOpacity>

              <Text className="text-4xl mb-4">🧠</Text>
              <Text className="text-2xl font-redditsans-bold mb-1" style={{ color: colors.text }}>
                {t("games.game_over", "Bitdi!")}
              </Text>
              <Text className="text-sm font-redditsans-regular text-center mb-5"
                style={{ color: colors.textSecondary }}>
                {t("games.stroop_game_over", "45 saniyə ərzindəki nəticən:")}
              </Text>

              <View className="w-full py-4 px-6 rounded-2xl mb-4"
                style={{ backgroundColor: colors.cardSecondary }}>
                <View className="flex-row justify-between mb-2">
                  <Text style={{ color: colors.textSecondary }} className="font-redditsans-medium">{t("games.score", "Yekun xal")}</Text>
                  <Text style={{ color: colors.primary }} className="font-redditsans-bold text-xl">{score}</Text>
                </View>
                <View className="border-t my-2" style={{ borderColor: colors.textSecondary + "20" }} />
                <View className="flex-row justify-between">
                  <Text style={{ color: colors.textSecondary }} className="font-redditsans-medium">{t("games.stroop_streak", "Ən uzun sıra")}</Text>
                  <Text style={{ color: "#F59E0B" }} className="font-redditsans-bold">{streak} 🔥</Text>
                </View>
              </View>

              {submitting && (
                <View className="flex-row items-center mb-3 gap-2">
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text className="text-xs font-redditsans-medium" style={{ color: colors.textSecondary }}>
                    {t("games.submitting_score", "Xal saxlanılır...")}
                  </Text>
                </View>
              )}
              {submitted && (
                <Text className="text-xs font-redditsans-bold mb-3 text-green-600">
                  {t("games.score_submitted", "✓ Xal uğurla saxlandı!")}
                </Text>
              )}

              <View className="w-full flex-row gap-3">
                <TouchableOpacity
                  onPress={() => startGame(activeDifficulty)}
                  className="flex-1 py-3 rounded-2xl items-center border"
                  style={{ borderColor: colors.textSecondary + "40" }}
                >
                  <Text className="font-redditsans-bold" style={{ color: colors.text }}>{t("games.restart", "Yenidən")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { setGameState("idle"); navigation.navigate("GameLeaderboard", { gameType: "StroopTest" }); }}
                  className="flex-1 py-3 rounded-2xl items-center"
                  style={{ backgroundColor: colors.primary }}
                >
                  <Text className="font-redditsans-bold text-white">{t("games.leaderboard", "Liderler")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Toast */}
        {toastMsg ? (
          <Animated.View
            className="absolute top-1/3 left-[10%] right-[10%] bg-black/85 py-3 px-6 rounded-full items-center justify-center border shadow-xl z-50 pointer-events-none"
            style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }], borderColor: colors.primary + "40" }}
          >
            <Text className="text-white text-base font-redditsans-bold text-center">{toastMsg}</Text>
          </Animated.View>
        ) : null}
      </SafeAreaView>
      <GameDifficultyModal
        visible={difficultyModalVisible}
        onClose={() => setDifficultyModalVisible(false)}
        onSelect={startGame}
      />
    </LinearGradient>
  );
}
