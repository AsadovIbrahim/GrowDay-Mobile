import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Modal, ActivityIndicator, Alert, Animated } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faArrowLeft, faRedo, faTrophy, faBrain, faTimes, faVolumeHigh, faVolumeMute } from "@fortawesome/free-solid-svg-icons";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { useMMKVString, useMMKVBoolean } from "react-native-mmkv";
import { submitGameScoreFetch } from "../../utils/fetch";
import Reanimated, { useSharedValue, useAnimatedStyle, withSpring, withSequence } from 'react-native-reanimated';
import Sound from "react-native-sound";
import GameDifficultyModal from "../../components/GameDifficultyModal";
Sound.setCategory("Playback");

const SequenceTile = ({ index, isActive, onPress, disabled, colors, widthClass = "w-[30%]" }) => {
  const scale = useSharedValue(1);

  // Scaling animation removed to keep block size fixed when active
  useEffect(() => {
    // scale.value is kept at 1
  }, [isActive, scale]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: 1 }]
    };
  });

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      disabled={disabled}
      className={`${widthClass} aspect-square mb-[5%]`}
    >
      <Reanimated.View
        className="flex-1 rounded-[24px] items-center justify-center shadow-md"
        style={[
          animatedStyle,
          {
            backgroundColor: isActive ? colors.primary : colors.card,
            borderWidth: isActive ? 2 : 1.5,
            borderColor: isActive ? colors.primary : colors.textSecondary + "15",
            elevation: isActive ? 8 : 2,
            shadowColor: isActive ? colors.primary : "#000",
            shadowOffset: { width: 0, height: isActive ? 4 : 2 },
            shadowOpacity: isActive ? 0.6 : 0.05,
            shadowRadius: isActive ? 10 : 4,
          }
        ]}
      >
        {/* Completely Blank Premium Tile */}
      </Reanimated.View>
    </TouchableOpacity>
  );
};

export default function SequenceGameScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { colors } = theme;
  const { t } = useTranslation();
  const [token] = useMMKVString("accessToken");
  const [soundEnabled, setSoundEnabled] = useMMKVBoolean("settings.soundEnabled");
  const isSoundEnabled = soundEnabled ?? true;

  // Game States
  const [level, setLevel] = useState(1);
  const [sequence, setSequence] = useState([]);
  const [userIndex, setUserIndex] = useState(0);
  const [activeTile, setActiveTile] = useState(null);
  const [gameState, setGameState] = useState("idle"); // idle, playingPattern, userTurn, gameOver
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  
  const [difficultyModalVisible, setDifficultyModalVisible] = useState(false);
  const [activeDifficulty, setActiveDifficulty] = useState({ id: 'medium', mult: 1 });
  const [gridSize, setGridSize] = useState(9); // Default 3x3

  const [toastMsg, setToastMsg] = useState("");
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;

  const triggerMotivation = (message) => {
    setToastMsg(message);
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.5);

    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(1200),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 250,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  const activeTimeoutRef = useRef(null);
  const activeSoundsRef = useRef([]);
  const isMountedRef = useRef(true);

  const playSound = (file) => {
    if (!isSoundEnabled) return;
    const sfx = new Sound(file, Sound.MAIN_BUNDLE, (error) => {
      if (!error && isMountedRef.current) {
        sfx.play(() => {
          sfx.release();
          activeSoundsRef.current = activeSoundsRef.current.filter(s => s !== sfx);
        });
      } else {
        try { sfx.release(); } catch (_) {}
        activeSoundsRef.current = activeSoundsRef.current.filter(s => s !== sfx);
      }
    });
    activeSoundsRef.current.push(sfx); // Push immediately before async callback
  };

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      activeSoundsRef.current.forEach(s => {
        try { s.stop(); s.release(); } catch (_) {}
      });
      activeSoundsRef.current = [];
      if (activeTimeoutRef.current) clearTimeout(activeTimeoutRef.current);
    };
  }, []);

  const startGame = (diff) => {
    setActiveDifficulty(diff);
    let newGridSize = 9;
    if (diff.id === 'hard' || diff.id === 'expert') {
      newGridSize = 16;
    }
    setGridSize(newGridSize);
    
    setLevel(1);
    setScore(0);
    setSubmitted(false);
    nextLevel([Math.floor(Math.random() * newGridSize)], 1, diff);
  };

  const nextLevel = (currentSequence, nextLvl, diffConfig = activeDifficulty) => {
    setSequence(currentSequence);
    setLevel(nextLvl);
    setGameState("playingPattern");
    setUserIndex(0);

    // Play pattern after a short delay
    setTimeout(() => {
      playPattern(currentSequence, diffConfig);
    }, 800);
  };

  const playPattern = async (currSeq, diffConfig) => {
    let speed = 400; // delay gap
    let duration = 500; // flash duration
    if (diffConfig.id === 'easy') { speed = 600; duration = 700; }
    else if (diffConfig.id === 'medium') { speed = 400; duration = 500; }
    else if (diffConfig.id === 'hard') { speed = 250; duration = 350; }
    else if (diffConfig.id === 'expert') { speed = 150; duration = 250; }

    for (let i = 0; i < currSeq.length; i++) {
      await flashTile(currSeq[i], duration);
      await delay(speed);
    }
    setGameState("userTurn");
  };

  const flashTile = (tileIndex, duration = 500) => {
    return new Promise((resolve) => {
      setActiveTile(tileIndex);
      playSound('click.mp3');
      activeTimeoutRef.current = setTimeout(() => {
        setActiveTile(null);
        resolve();
      }, duration);
    });
  };

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const handleTilePress = async (index) => {
    if (gameState !== "userTurn") return;

    // Flash pressed tile briefly
    setActiveTile(index);
    setTimeout(() => {
      setActiveTile(null);
    }, 150);

    const isCorrect = index === sequence[userIndex];

    if (isCorrect) {
      playSound('click.mp3');
      const nextIdx = userIndex + 1;
      setUserIndex(nextIdx);

      if (nextIdx === sequence.length) {
        setGameState("playingPattern");
        
        setScore(prev => prev + Math.floor((level * 10) * activeDifficulty.mult));
        
        if (level === 3) triggerMotivation("🔥 " + t("games.toast_start", "Yaxşı başlanğıc! 🎯"));
        if (level === 5) triggerMotivation("⚡ " + t("games.toast_doing_great", "Əla gedirsən! 🔥"));
        if (level === 10) triggerMotivation("🧠 " + t("games.toast_genius", "Sən dahisən! 🏆"));

        // Wait a bit, then start next level
        setTimeout(() => {
          const nextItem = Math.floor(Math.random() * gridSize);
          nextLevel([...sequence, nextItem], level + 1);
        }, 1000);
      }
    } else {
      // Wrong! Game Over
      playSound('wrong.mp3');
      setGameState("gameOver");
      submitScoreAutomatically(score);
    }
  };

  const submitScoreAutomatically = async (finalScore) => {
    if (!token || finalScore <= 0) return;

    try {
      setSubmitting(true);
      setSubmitted(false);
      const res = await submitGameScoreFetch(token, {
        gameType: "SequenceMemory",
        score: finalScore,
        timeTakenSeconds: 0,
        difficulty: activeDifficulty?.id || null,
        moveCount: 0,
      });

      if (res && res.success) {
        setSubmitted(true);
      }
    } catch (err) {
      console.log("Error submitting score automatically:", err);
    } finally {
      setSubmitting(false);
    }
  };

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
            {t("games.sequence_memory")}
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
              onPress={() => setDifficultyModalVisible(true)}
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.cardSecondary }}
            >
              <FontAwesomeIcon icon={faRedo} size={16} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Level & Status Card */}
        <View className="py-5 px-6 rounded-2xl mb-8 items-center justify-center" style={{ backgroundColor: colors.cardSecondary }}>
          {gameState === "idle" ? (
            <TouchableOpacity 
              onPress={() => setDifficultyModalVisible(true)}
              className="py-3 px-8 rounded-full"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="font-redditsans-bold text-white text-lg">{t("games.play_now")}</Text>
            </TouchableOpacity>
          ) : (
            <>
              <Text className="text-sm font-redditsans-medium mb-1" style={{ color: colors.textSecondary }}>
                {t("games.level")} {level}
              </Text>
              <Text className="text-lg font-redditsans-bold" style={{ color: colors.primary }}>
                {gameState === "playingPattern" ? t("games.watch_pattern") : t("games.repeat_pattern")}
              </Text>
            </>
          )}
        </View>

        {/* Grid */}
        <View className="flex-1 items-center justify-center pt-8">
          <View className="flex-row flex-wrap justify-center" style={{ width: '100%', maxWidth: 400, gap: gridSize === 16 ? 0 : 0 }}>
            {Array.from({ length: gridSize }).map((_, idx) => (
              <SequenceTile
                key={idx}
                index={idx}
                colors={colors}
                isActive={activeTile === idx}
                onPress={() => handleTilePress(idx)}
                disabled={gameState !== "userTurn"}
                widthClass={gridSize === 16 ? "w-[22%] mx-[1.5%]" : "w-[30%] mx-[1.6%]"}
              />
            ))}
          </View>
        </View>

        {/* Game Over Modal */}
        <Modal
          visible={gameState === "gameOver"}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setGameState("idle")}
        >
          <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <View className="w-full max-w-sm rounded-3xl p-6 items-center shadow-lg relative" style={{ backgroundColor: colors.card }}>
              <TouchableOpacity 
                onPress={() => {
                  setGameState("idle");
                  navigation.goBack();
                }}
                className="absolute top-4 right-4 w-8 h-8 rounded-full items-center justify-center z-10"
                style={{ backgroundColor: colors.cardSecondary }}
              >
                <FontAwesomeIcon icon={faTimes} size={14} color={colors.textSecondary} />
              </TouchableOpacity>
              <FontAwesomeIcon icon={faBrain} size={50} color={colors.primary} style={{ marginBottom: 16 }} />
              <Text className="text-2xl font-redditsans-bold mb-2" style={{ color: colors.text }}>
                {t("games.game_over")}
              </Text>
              <Text className="text-base text-center font-redditsans-regular mb-6" style={{ color: colors.textSecondary }}>
                {t("games.congrats")}
              </Text>

              {/* Score Breakdown */}
              <View className="w-full py-4 px-6 rounded-2xl mb-4" style={{ backgroundColor: colors.cardSecondary }}>
                <View className="flex-row justify-between mb-2">
                  <Text style={{ color: colors.textSecondary }} className="font-redditsans-medium">{t("games.level")}</Text>
                  <Text style={{ color: colors.text }} className="font-redditsans-bold">{level}</Text>
                </View>
                <View className="border-t my-2" style={{ borderColor: colors.textSecondary + "20" }} />
                <View className="flex-row justify-between">
                  <Text style={{ color: colors.textSecondary }} className="font-redditsans-bold">{t("games.score")}</Text>
                  <Text style={{ color: colors.primary }} className="font-redditsans-bold text-xl">{score}</Text>
                </View>
              </View>

              {/* Auto submit status indicators */}
              {submitting && (
                <View className="flex-row items-center justify-center mb-4 gap-2">
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text className="font-redditsans-semibold text-xs" style={{ color: colors.textSecondary }}>
                    {t("games.saving_score")}
                  </Text>
                </View>
              )}

              {submitted && (
                <Text className="text-center font-redditsans-bold text-xs mb-4 text-green-600">
                  {t("games.score_saved")}
                </Text>
              )}

              {/* Action Buttons */}
              <View className="w-full flex-row gap-3">
                <TouchableOpacity
                  onPress={() => startGame(activeDifficulty)}
                  className="flex-1 py-3 rounded-2xl items-center justify-center border"
                  style={{ borderColor: colors.textSecondary + "40" }}
                >
                  <Text className="font-redditsans-bold" style={{ color: colors.text }}>
                    {t("games.restart")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setGameState("idle");
                    navigation.navigate("GameLeaderboard", { gameType: "SequenceMemory" });
                  }}
                  className="flex-1 py-3 rounded-2xl items-center justify-center"
                  style={{ backgroundColor: colors.primary }}
                >
                  <Text className="font-redditsans-bold text-white">
                    {t("games.leaderboard")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {toastMsg ? (
          <Animated.View 
            className="absolute top-1/3 left-[10%] right-[10%] bg-black/85 py-3 px-6 rounded-full items-center justify-center border shadow-xl z-50 pointer-events-none"
            style={{ 
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
              borderColor: colors.primary + "40",
            }}
          >
            <Text className="text-white text-base font-redditsans-bold text-center">
              {toastMsg}
            </Text>
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
