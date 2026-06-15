import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, ScrollView, Modal, ActivityIndicator, Alert, Animated, useWindowDimensions } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faArrowLeft, faRedo, faClock, faTrophy, faExchangeAlt, faTimes, faVolumeHigh, faVolumeMute } from "@fortawesome/free-solid-svg-icons";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { useMMKVString, useMMKVBoolean } from "react-native-mmkv";
import { submitGameScoreFetch } from "../../utils/fetch";
import Reanimated, { useSharedValue, useAnimatedStyle, interpolate, withSpring } from 'react-native-reanimated';
import Sound from "react-native-sound";
Sound.setCategory("Playback");

const ALL_EMOJIS = ["🧠", "🌱", "🎯", "🔥", "🚀", "💧", "🏆", "🍏", "💡", "🌟", "⚡", "💎", "🎨", "🧩", "🎲"];

const DIFFICULTIES = [
  { id: 'easy', pairs: 8, grid: '4x4', color: '#10B981' },
  { id: 'medium', pairs: 10, grid: '4x5', color: '#F59E0B' },
  { id: 'hard', pairs: 12, grid: '4x6', color: '#EF4444' },
];

const MemoryCard = ({ index, emoji, isFlipped, isMatched, onPress, colors, cardSize }) => {
  const flipValue = useSharedValue(isFlipped ? 1 : 0);
  
  useEffect(() => {
    flipValue.value = withSpring(isFlipped ? 1 : 0, {
      damping: 12,
      stiffness: 100,
    });
  }, [isFlipped, flipValue]);

  const frontStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipValue.value, [0, 1], [0, 180]);
    return {
      transform: [{ perspective: 1000 }, { rotateY: `${rotateY}deg` }],
      backfaceVisibility: 'hidden',
    };
  });

  const backStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipValue.value, [0, 1], [180, 360]);
    return {
      transform: [{ perspective: 1000 }, { rotateY: `${rotateY}deg` }],
      backfaceVisibility: 'hidden',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    };
  });

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPress}
      style={{ width: cardSize, height: cardSize, marginBottom: cardSize * 0.15 }}
    >
      <View style={{ flex: 1 }}>
        {/* FRONT SIDE (Face Down) */}
        <Reanimated.View
          className="flex-1 rounded-2xl items-center justify-center border shadow-sm"
          style={[
            frontStyle,
            {
              backgroundColor: colors.card,
              borderColor: colors.textSecondary + '20',
              elevation: 2,
            },
          ]}
        >
           {/* Completely Blank Premium Card Front */}
        </Reanimated.View>

        {/* BACK SIDE (Face Up / Revealed) */}
        <Reanimated.View
          className="flex-1 rounded-2xl items-center justify-center border shadow-md"
          style={[
            backStyle,
            {
              backgroundColor: isMatched ? colors.primary + '15' : colors.cardSecondary,
              borderColor: isMatched ? colors.primary : colors.border,
            },
          ]}
        >
          <Text className="text-4xl">{emoji}</Text>
          {isMatched && (
            <View className="absolute inset-0 rounded-2xl border-2" style={{ borderColor: colors.primary, opacity: 0.5 }} />
          )}
        </Reanimated.View>
      </View>
    </TouchableOpacity>
  );
};

export default function MemoryGameScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { colors } = theme;
  const { t } = useTranslation();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [token] = useMMKVString("accessToken");
  const [soundEnabled, setSoundEnabled] = useMMKVBoolean("settings.soundEnabled");
  const isSoundEnabled = soundEnabled ?? true;

  // Game state
  const [selectedDifficulty, setSelectedDifficulty] = useState(null);
  const [cards, setCards] = useState([]);
  const [selectedCards, setSelectedCards] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

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

  const timerRef = useRef(null);
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

  // Initialize board - stop all sounds and timers on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      activeSoundsRef.current.forEach(s => {
        try { s.stop(); s.release(); } catch (_) {}
      });
      activeSoundsRef.current = [];
      clearInterval(timerRef.current);
    };
  }, []);

  // Timer logic
  useEffect(() => {
    if (gameStarted && !gameOver) {
      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [gameStarted, gameOver]);

  // Card check logic
  useEffect(() => {
    if (selectedCards.length === 2) {
      const [firstIdx, secondIdx] = selectedCards;
      if (cards[firstIdx] === cards[secondIdx]) {
        // Match!
        const newMatched = [...matchedPairs, cards[firstIdx]];
        setMatchedPairs(newMatched);
        setSelectedCards([]);

        const isLastPair = newMatched.length === (cards.length / 2);
        playSound(isLastPair ? 'congrats.mp3' : 'success.mp3');
        
        if (newMatched.length === 2) {
          triggerMotivation(t("games.toast_start", "Yaxşı başlanğıc! 🎯"));
        } else if (newMatched.length === 4) {
          triggerMotivation(t("games.toast_doing_great", "Əla gedirsən! 🔥"));
        } else if (newMatched.length === 6) {
          triggerMotivation(t("games.toast_focus", "Super fokus! 🧠"));
        } else if (isLastPair) {
          // Game Over!
          setGameOver(true);
          const finalScore = calculateScore(moves + 1, seconds);
          setScore(finalScore);
          submitScoreAutomatically(finalScore);
          triggerMotivation(t("games.toast_genius", "Sən dahisən! 🏆"));
        }
      } else {
        // No match, turn back after delay
        playSound('wrong.mp3');

        const timer = setTimeout(() => {
          setSelectedCards([]);
        }, 350);
        return () => clearTimeout(timer);
      }
    }
  }, [selectedCards, cards, matchedPairs, moves, seconds, t]);

  const startGame = (difficulty) => {
    clearInterval(timerRef.current);
    setSelectedDifficulty(difficulty);
    
    // Select required number of pairs from ALL_EMOJIS
    const emojisToUse = ALL_EMOJIS.slice(0, difficulty.pairs);
    
    // Double and shuffle emojis
    const doubleEmojis = [...emojisToUse, ...emojisToUse];
    const shuffled = doubleEmojis.sort(() => Math.random() - 0.5);
    
    setCards(shuffled);
    setSelectedCards([]);
    setMatchedPairs([]);
    setMoves(0);
    setSeconds(0);
    setGameStarted(false);
    setGameOver(false);
    setSubmitted(false);
  };

  const resetGame = () => {
    if (selectedDifficulty) {
      startGame(selectedDifficulty);
    }
  };

  const handleCardPress = (index) => {
    if (gameOver || selectedCards.length >= 2 || selectedCards.includes(index) || matchedPairs.includes(cards[index])) {
      return;
    }

    playSound('card.mp3');

    if (!gameStarted) {
      setGameStarted(true);
    }

    const newSelected = [...selectedCards, index];
    setSelectedCards(newSelected);

    if (newSelected.length === 2) {
      setMoves((prev) => prev + 1);
    }
  };

  const calculateScore = (finalMoves, finalSeconds) => {
    // Premium score calculation with difficulty multiplier
    // Base 1000 points. Penalize for moves and time.
    let multiplier = 1.0;
    if (selectedDifficulty?.id === 'medium') {
      multiplier = 1.5;
    } else if (selectedDifficulty?.id === 'hard') {
      multiplier = 2.0;
    }

    const penalty = (finalMoves * 12) + (finalSeconds * 4);
    const baseScore = Math.max(100, 1000 - penalty);
    return Math.round(baseScore * multiplier);
  };

  const submitScoreAutomatically = async (finalScore) => {
    if (!token || finalScore <= 0) return;

    try {
      setSubmitting(true);
      setSubmitted(false);
      const res = await submitGameScoreFetch(token, {
        gameType: "MemoryMatch",
        score: finalScore,
        timeTakenSeconds: seconds,
        difficulty: selectedDifficulty?.id || null,
        moveCount: moves,
      });

      if (res && res.success) {
        setSubmitted(true);
      }
    } catch (err) {
      console.log("Error submitting score automatically:", err);
    } finally {
      setSubmitting(false);
      setSubmitting(false);
    }
  };

  const cols = 4;
  const rows = cards.length > 0 ? cards.length / cols : 4;
  
  const availableWidth = Math.min(windowWidth - 32, 360); 
  const availableHeight = windowHeight - 250; 
  
  const gapW = 16; 
  const gapH = 16; 
  
  const cardWidth = (availableWidth - (cols - 1) * gapW) / cols;
  const cardHeight = (availableHeight - (rows - 1) * gapH) / rows;
  
  const cardSize = Math.max(40, Math.min(cardWidth, cardHeight));

  return (
    <LinearGradient colors={colors.backgroundGradient} className="flex-1">
      <SafeAreaView className="flex-1 px-4">
        {/* Difficulty Selection Modal */}
        <Modal
          visible={!selectedDifficulty}
          transparent={true}
          animationType="fade"
        >
          <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
            <View className="w-full max-w-sm rounded-3xl p-6 shadow-lg relative" style={{ backgroundColor: colors.card }}>
              <TouchableOpacity 
                onPress={() => navigation.goBack()}
                className="absolute top-4 right-4 w-8 h-8 rounded-full items-center justify-center z-10"
                style={{ backgroundColor: colors.cardSecondary }}
              >
                <FontAwesomeIcon icon={faTimes} size={14} color={colors.textSecondary} />
              </TouchableOpacity>
              
              <Text className="text-2xl font-redditsans-bold mb-2 text-center" style={{ color: colors.text }}>
                {t("games.memory_match", "Yaddaş Kartları")}
              </Text>
              <Text className="text-sm font-redditsans-regular mb-4 text-center px-4" style={{ color: colors.textSecondary }}>
                {t("games.select_difficulty", "Oyuna başlamaq üçün çətinlik səviyyəsini və ölçünü seçin.")}
              </Text>
              
              <View className="w-full mt-2">
                {DIFFICULTIES.map((diff) => (
                  <TouchableOpacity
                    key={diff.id}
                    onPress={() => startGame(diff)}
                    className="w-full py-4 rounded-2xl flex-row items-center px-5 mb-3"
                    style={{ backgroundColor: diff.color + "15", borderWidth: 1, borderColor: diff.color + "30" }}
                  >
                    <View className="w-12 h-12 rounded-2xl items-center justify-center mr-4" style={{ backgroundColor: diff.color + "20" }}>
                      <Text className="font-redditsans-bold text-xl" style={{ color: diff.color }}>
                        {diff.pairs}
                      </Text>
                    </View>
                    <View>
                      <Text className="font-redditsans-bold text-lg" style={{ color: colors.text }}>
                        {`${diff.grid} (${t(`games.${diff.id}`, diff.id === 'easy' ? 'Asan' : diff.id === 'medium' ? 'Orta' : 'Çətin')})`}
                      </Text>
                      <Text className="font-redditsans-medium text-xs mt-0.5" style={{ color: colors.textSecondary }}>
                        {t("games.total_cards", { count: diff.pairs * 2, defaultValue: `Cəmi ${diff.pairs * 2} kart tapılacaq` })}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Modal>

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
            {t("games.memory_match")}
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
              onPress={resetGame}
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.cardSecondary }}
            >
              <FontAwesomeIcon icon={faRedo} size={16} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Row */}
        <View className="flex-row justify-around py-4 rounded-2xl mb-6" style={{ backgroundColor: colors.cardSecondary }}>
          <View className="items-center">
            <View className="flex-row items-center gap-1 mb-1">
              <FontAwesomeIcon icon={faClock} size={14} color={colors.textSecondary} />
              <Text className="text-xs font-redditsans-medium" style={{ color: colors.textSecondary }}>
                {t("games.time")}
              </Text>
            </View>
            <Text className="text-lg font-redditsans-bold" style={{ color: colors.text }}>
              {seconds} {t("games.sec")}
            </Text>
          </View>
          <View className="items-center">
            <View className="flex-row items-center gap-1 mb-1">
              <FontAwesomeIcon icon={faExchangeAlt} size={14} color={colors.textSecondary} />
              <Text className="text-xs font-redditsans-medium" style={{ color: colors.textSecondary }}>
                {t("games.moves")}
              </Text>
            </View>
            <Text className="text-lg font-redditsans-bold" style={{ color: colors.text }}>
              {moves}
            </Text>
          </View>
        </View>

        {/* Grid Board */}
        <ScrollView 
          contentContainerStyle={{ alignItems: 'center', justifyContent: 'center', flexGrow: 1, paddingBottom: 20 }} 
          className="flex-1 mb-4" 
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-row flex-wrap justify-between w-full" style={{ maxWidth: 360 }}>
            {cards.map((emoji, index) => {
              const isFlipped = selectedCards.includes(index) || matchedPairs.includes(emoji);
              const isMatched = matchedPairs.includes(emoji);

              return (
                <MemoryCard
                  key={index}
                  index={index}
                  emoji={emoji}
                  isFlipped={isFlipped}
                  isMatched={isMatched}
                  onPress={() => handleCardPress(index)}
                  colors={colors}
                  cardSize={cardSize}
                />
              );
            })}
          </View>
        </ScrollView>

        {/* Game Over Modal */}
        <Modal
          visible={gameOver}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setGameOver(false)}
        >
          <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <View className="w-full max-w-sm rounded-3xl p-6 items-center shadow-lg relative" style={{ backgroundColor: colors.card }}>
              <TouchableOpacity 
                onPress={() => {
                  setGameOver(false);
                  navigation.goBack();
                }}
                className="absolute top-4 right-4 w-8 h-8 rounded-full items-center justify-center z-10"
                style={{ backgroundColor: colors.cardSecondary }}
              >
                <FontAwesomeIcon icon={faTimes} size={14} color={colors.textSecondary} />
              </TouchableOpacity>
              <FontAwesomeIcon icon={faTrophy} size={50} color="#FBBF24" style={{ marginBottom: 16 }} />
              <Text className="text-2xl font-redditsans-bold mb-2" style={{ color: colors.text }}>
                {t("games.congrats")}
              </Text>
              <Text className="text-base text-center font-redditsans-regular mb-6" style={{ color: colors.textSecondary }}>
                {t("games.game_over")}
              </Text>

              {/* Score breakdown */}
              <View className="w-full py-4 px-6 rounded-2xl mb-4" style={{ backgroundColor: colors.cardSecondary }}>
                <View className="flex-row justify-between mb-2">
                  <Text style={{ color: colors.textSecondary }} className="font-redditsans-medium">{t("games.time")}</Text>
                  <Text style={{ color: colors.text }} className="font-redditsans-bold">{seconds}s</Text>
                </View>
                <View className="flex-row justify-between mb-2">
                  <Text style={{ color: colors.textSecondary }} className="font-redditsans-medium">{t("games.moves")}</Text>
                  <Text style={{ color: colors.text }} className="font-redditsans-bold">{moves}</Text>
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
                  onPress={resetGame}
                  className="flex-1 py-3 rounded-2xl items-center justify-center border"
                  style={{ borderColor: colors.textSecondary + "40" }}
                >
                  <Text className="font-redditsans-bold" style={{ color: colors.text }}>
                    {t("games.restart")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setGameOver(false);
                    navigation.navigate("GameLeaderboard", { gameType: "MemoryMatch" });
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
    </LinearGradient>
  );
}
