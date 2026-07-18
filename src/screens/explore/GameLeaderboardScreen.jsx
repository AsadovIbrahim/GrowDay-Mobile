import React, { useState, useCallback, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faArrowLeft, faTrophy, faInfoCircle, faClock, faGift } from "@fortawesome/free-solid-svg-icons";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { useMMKVString } from "react-native-mmkv";
import {
  getGameLeaderboardFetch,
  getGamePersonalBestFetch,
  getAccountDataFetch,
  getUserGameScoreHistoryFetch,
  getTournamentStatusFetch,
} from "../../utils/fetch";
import AvatarWithBorder from "../../components/AvatarWithBorder";
import TournamentRewardsModal from "../../components/TournamentRewardsModal";

const MEDAL_COLORS = {
  1: { bg: "#FBBF24", shadow: "#F59E0B", text: "#92400E", bar: ["#FBBF24", "#F59E0B"] },
  2: { bg: "#94A3B8", shadow: "#64748B", text: "#1E293B", bar: ["#CBD5E1", "#94A3B8"] },
  3: { bg: "#CD7F32", shadow: "#A0522D", text: "#431407", bar: ["#D97706", "#CD7F32"] },
};

const formatDuration = (seconds) => {
  const total = Math.max(0, Math.round(seconds || 0));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
};

const PodiumPlayer = ({ player, rank, colors, gameType, currentUsername }) => {
  const { t } = useTranslation();
  const medal = MEDAL_COLORS[rank];
  const heightMap = { 1: 88, 2: 64, 3: 48 };
  const avatarSize = rank === 1 ? 62 : 52;
  const name = player
    ? (`${player.firstName || ""} ${player.lastName || ""}`).trim() || player.userName
    : null;
  const isCurrentUser = player && currentUsername && player.userName === currentUsername;

  const displayScore = () => {
    if (!player || player.highScore === undefined || player.highScore === null) return "";
    if (gameType === "ReactionTime") {
      const ms = Math.max(0, 1000 - Math.round(player.highScore / 10));
      return `${ms} ms`;
    }
    return player.highScore;
  };

  

  return (
    <View className="items-center" style={{ width: rank === 1 ? 110 : 90 }}>
      {rank === 1 && (
        <FontAwesomeIcon icon={faTrophy} size={22} color="#FBBF24" style={{ marginBottom: 6 }} />
      )}
      {rank === 2 && (
        <FontAwesomeIcon icon={faTrophy} size={20} color="#94A3B8" style={{ marginBottom: 6 }} />
      )}
      {rank === 3 && (
        <FontAwesomeIcon icon={faTrophy} size={18} color="#CD7F32" style={{ marginBottom: 6 }} />
      )}

      {name ? (
        <AvatarWithBorder
          avatarUrl={player?.profilePicture}
          level={player?.hasPremiumBorder ? 999 : (Math.floor(Math.sqrt((player?.experiencePoints || 0) / 50)) + 1)}
          size={avatarSize}
          style={{ marginBottom: 6 }}
        />
      ) : (
        <View
          className="rounded-full mb-2"
          style={{
            width: avatarSize,
            height: avatarSize,
            backgroundColor: colors.cardSecondary,
            borderWidth: 1.5,
            borderColor: colors.textSecondary + "20",
            borderStyle: "dashed",
          }}
        />
      )}

      <Text
        numberOfLines={1}
        className="text-xs font-redditsans-bold text-center w-full mb-0.5"
        style={{ color: colors.text }}
      >
        {name ? `${name}${isCurrentUser ? ` ${t("games.you", "(You)")}` : ""}` : "—"}
      </Text>
      <Text className="text-xs font-redditsans-medium mb-2" style={{ color: medal.bg }}>
        {displayScore()}
      </Text>

      <LinearGradient
        colors={medal.bar}
        className="rounded-t-2xl items-center justify-center"
        style={{ width: rank === 1 ? 90 : 76, height: heightMap[rank] }}
      >
        <Text className="font-redditsans-bold text-white" style={{ fontSize: rank === 1 ? 22 : 17 }}>
          {rank}
        </Text>
      </LinearGradient>
    </View>
  );
};

const RankBadge = ({ rank, colors, isTournament = false }) => {
  if (rank <= 3) {
    const medal = MEDAL_COLORS[rank];
    return (
      <View
        className="w-8 h-8 rounded-full items-center justify-center"
        style={{ backgroundColor: medal.bg + "20" }}
      >
        <Text className="font-redditsans-bold text-sm" style={{ color: medal.bg }}>
          {rank}
        </Text>
      </View>
    );
  }

  let indicator = null;
  if (isTournament) {
    if (rank <= 10) {
      indicator = <Text style={{ color: "#22c55e", fontSize: 8, fontFamily: "RedditSans-Bold", marginTop: -1 }}>▲</Text>;
    } else if (rank >= 26) {
      indicator = <Text style={{ color: "#ef4444", fontSize: 8, fontFamily: "RedditSans-Bold", marginTop: -1 }}>▼</Text>;
    }
  }

  return (
    <View className="w-8 items-center justify-center">
      <Text className="font-redditsans-bold text-sm" style={{ color: colors.textSecondary }}>
        {rank}
      </Text>
      {indicator}
    </View>
  );
};

const TabButton = ({ active, label, onPress, colors }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.8}
    className="flex-1 py-2.5 rounded-xl items-center justify-center"
    style={{
      backgroundColor: active ? colors.primary : "transparent",
    }}
  >
    <Text
      className="text-xs font-redditsans-bold"
      style={{ color: active ? "#fff" : colors.textSecondary }}
      numberOfLines={1}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

export default function GameLeaderboardScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
  const { colors } = theme;
  const { t, i18n } = useTranslation();
  const [token] = useMMKVString("accessToken");

  const gameType = route.params?.gameType || "MemoryMatch";
  const [activeTab, setActiveTab] = useState("tournament");

  const [leaderboard, setLeaderboard] = useState([]);
  const [scoreHistory, setScoreHistory] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [tournamentData, setTournamentData] = useState(null);
  const [tournamentLoading, setTournamentLoading] = useState(true);
  const [showRewardsModal, setShowRewardsModal] = useState(false);
  const [remainingTime, setRemainingTime] = useState("");

  const gameLabel =
    gameType === "SequenceMemory"
      ? t("games.sequence_memory")
      : gameType === "StroopTest"
        ? t("games.stroop_test")
        : gameType === "ReactionTime"
          ? t("games.reaction_game")
          : t("games.memory_match");

  const loadLeaderboard = useCallback(async () => {
    if (!token) return;
    const [lbRes, accountRes] = await Promise.all([
      getGameLeaderboardFetch(token, gameType),
      getAccountDataFetch(token).catch(() => null),
    ]);
    if (lbRes?.success) setLeaderboard(lbRes.data || []);
    if (accountRes?.success) setCurrentUser(accountRes.data);
  }, [token, gameType]);

  const loadTournament = useCallback(async () => {
    if (!token) return;
    setTournamentLoading(true);
    try {
      const [tourneyRes, accountRes] = await Promise.all([
        getTournamentStatusFetch(token, gameType),
        getAccountDataFetch(token).catch(() => null),
      ]);
      if (tourneyRes?.success) setTournamentData(tourneyRes.data);
      if (accountRes?.success) setCurrentUser(accountRes.data);
    } catch (err) {
      console.log("Error loading tournament status:", err);
    } finally {
      setTournamentLoading(false);
    }
  }, [token, gameType]);

  const loadHistory = useCallback(async () => {
    if (!token) return;
    setHistoryLoading(true);
    try {
      const res = await getUserGameScoreHistoryFetch(token, gameType);
      if (res?.success) setScoreHistory(res.data || []);
      else setScoreHistory([]);
    } catch (err) {
      console.log("Error loading score history:", err);
      setScoreHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [token, gameType]);

  const loadData = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      if (activeTab === "tournament") {
        await loadTournament();
      } else if (activeTab === "global") {
        await loadLeaderboard();
      } else if (activeTab === "history") {
        await loadHistory();
      }
    } catch (err) {
      console.log("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  }, [token, activeTab, loadTournament, loadLeaderboard, loadHistory]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  useEffect(() => {
    if (!tournamentData || !tournamentData.remainingSeconds) {
      setRemainingTime("");
      return;
    }
    let secondsLeft = tournamentData.remainingSeconds;
    const updateTimer = () => {
      if (secondsLeft <= 0) {
        setRemainingTime(t("games.tournament_ended", "Bitdi"));
        return;
      }
      const days = Math.floor(secondsLeft / (3600 * 24));
      const hours = Math.floor((secondsLeft % (3600 * 24)) / 3600);
      const minutes = Math.floor((secondsLeft % 3600) / 60);

      const lang = i18n.language || "az";
      if (lang === "az") {
        setRemainingTime(`${days}gün ${hours}saat ${minutes}dəq`);
      } else if (lang === "tr") {
        setRemainingTime(`${days}gün ${hours}saat ${minutes}dk`);
      } else {
        setRemainingTime(`${days}d ${hours}h ${minutes}m`);
      }
      secondsLeft--;
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [tournamentData, i18n.language, t]);

  const switchTab = async (tab) => {
    setActiveTab(tab);
    if (tab === "tournament") {
      await loadTournament();
    } else if (tab === "global") {
      await loadLeaderboard();
    } else if (tab === "history") {
      await loadHistory();
    }
  };

  const currentUsername = currentUser?.username;

  const top1 = leaderboard.find((i) => i.rank === 1);
  const top2 = leaderboard.find((i) => i.rank === 2);
  const top3 = leaderboard.find((i) => i.rank === 3);
  const hasPodium = top1 || top2 || top3;

  const formatHistoryDate = (iso) => {
    if (!iso) return "—";
    const dateStr = String(iso);
    const normalized =
      (dateStr.includes("T") || dateStr.includes(" ")) &&
      !dateStr.endsWith("Z") &&
      !dateStr.includes("+")
        ? dateStr.replace(" ", "T") + "Z"
        : dateStr;
    const localeMap = {
      az: "az-AZ",
      ru: "ru-RU",
      tr: "tr-TR",
      en: "en-US",
      de: "de-DE",
      fr: "fr-FR",
      es: "es-ES",
      it: "it-IT",
      ar: "ar-AE",
      zh: "zh-CN",
    };
    const locale = localeMap[i18n.language] || i18n.language || "en-US";
    try {
      return new Date(normalized).toLocaleString(locale, {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch {
      return new Date(normalized).toLocaleString();
    }
  };

  const formatDifficultyLabel = (difficulty) => {
    if (!difficulty) return "—";
    const key = `games.diff_${difficulty.toLowerCase()}`;
    const translated = t(key, { defaultValue: "" });
    if (translated && translated !== key) return translated;
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  };

  const formatScoreValue = (score) => {
    if (gameType === "ReactionTime") {
      const ms = Math.max(0, 1000 - Math.round(score / 10));
      return `${ms} ms`;
    }
    return `${score} ${t("games.points_unit")}`;
  };

  const renderTournamentContent = () => {
    if (tournamentLoading) {
      return (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-4 font-redditsans-medium" style={{ color: colors.textSecondary }}>
            {t("games.loading_tournament")}
          </Text>
        </View>
      );
    }

    if (!tournamentData || !tournamentData.leaderboard || tournamentData.leaderboard.length === 0) {
      return (
        <View className="flex-1 items-center justify-center px-8">
          <FontAwesomeIcon icon={faTrophy} size={48} color={colors.textSecondary + "50"} />
          <Text
            className="mt-4 font-redditsans-bold text-lg text-center"
            style={{ color: colors.textSecondary }}
          >
            {t("games.no_tournament_scores")}
          </Text>
        </View>
      );
    }

    const normalizedLB = (tournamentData.leaderboard || []).map((p) => ({
      ...p,
      highScore: p.weeklyScore,
    }));

    const t1 = normalizedLB.find((i) => i.rank === 1);
    const t2 = normalizedLB.find((i) => i.rank === 2);
    const t3 = normalizedLB.find((i) => i.rank === 3);
    const hasPodium = t1 || t2 || t3;

    return (
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        {/* Tournament Info Card */}
        <TouchableOpacity
          onPress={() => setShowRewardsModal(true)}
          className="mx-4 p-4 rounded-3xl mb-4 flex-row items-center justify-between shadow-sm border"
          style={{
            backgroundColor: colors.cardSecondary,
            borderColor: colors.border + "40",
          }}
          activeOpacity={0.7}
        >
          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <FontAwesomeIcon icon={faTrophy} size={16} color="#FBBF24" />
              <Text className="text-sm font-redditsans-bold" style={{ color: colors.text }}>
                {t(`games.league_${tournamentData.currentLeague}`, { defaultValue: t("games.league_1") })}
              </Text>
            </View>
            {remainingTime ? (
              <View className="flex-row items-center gap-1.5 mt-1.5">
                <FontAwesomeIcon icon={faClock} size={11} color={colors.textSecondary} />
                <Text className="text-xs font-redditsans-regular" style={{ color: colors.textSecondary }}>
                  {t("games.ends_in")} {remainingTime}
                </Text>
              </View>
            ) : null}
          </View>

          <View
            className="p-2.5 rounded-full"
            style={{ backgroundColor: colors.card }}
          >
            <FontAwesomeIcon icon={faGift} size={18} color={colors.primary} />
          </View>
        </TouchableOpacity>

        {hasPodium && (
          <View
            className="mx-4 rounded-3xl mb-4 overflow-hidden"
            style={{ backgroundColor: colors.cardSecondary }}
          >
            <View className="flex-row items-end justify-center pt-6 pb-0 px-4">
              <PodiumPlayer
                player={t2}
                rank={2}
                colors={colors}
                gameType={gameType}
                currentUsername={currentUsername}
              />
              <View style={{ width: 12 }} />
              <PodiumPlayer
                player={t1}
                rank={1}
                colors={colors}
                gameType={gameType}
                currentUsername={currentUsername}
              />
              <View style={{ width: 12 }} />
              <PodiumPlayer
                player={t3}
                rank={3}
                colors={colors}
                gameType={gameType}
                currentUsername={currentUsername}
              />
            </View>
          </View>
        )}

        <View
          className="mx-4 rounded-3xl overflow-hidden"
          style={{ backgroundColor: colors.cardSecondary }}
        >
          <View className="px-5 pt-5 pb-2 flex-row justify-between items-center">
            <Text className="text-sm font-redditsans-bold" style={{ color: colors.text }}>
              {t("games.group_rankings")}
            </Text>
          </View>

          {normalizedLB.map((item, index) => {
            const name =
              (`${item.firstName || ""} ${item.lastName || ""}`).trim() || item.userName;
            const level = item.level || 1;
            const isLast = index === normalizedLB.length - 1;
            const isCurrentUser = currentUsername && item.userName === currentUsername;

            let rowBg = "transparent";
            if (isCurrentUser) {
              rowBg = colors.primary + "15";
            } else if (item.rank <= 10) {
              rowBg = "#22c55e" + "08"; // subtle green promotion hint
            } else if (item.rank >= 26) {
              rowBg = "#ef4444" + "08"; // subtle red demotion hint
            }

            return (
              <View
                key={item.userId}
                className="flex-row items-center px-5 py-3"
                style={{
                  borderBottomWidth: isLast ? 0 : 1,
                  borderColor: colors.textSecondary + "10",
                  backgroundColor: rowBg,
                }}
              >
                <RankBadge rank={item.rank} colors={colors} isTournament={true} />
                <View className="ml-3">
                  <AvatarWithBorder avatarUrl={item.profilePicture} level={level} size={36} />
                </View>
                <View className="flex-1 ml-3">
                  <Text
                    numberOfLines={1}
                    className="text-sm font-redditsans-semibold"
                    style={{ color: colors.text }}
                  >
                    {name}
                    {isCurrentUser ? ` ${t("games.you", "(You)")}` : ""}
                  </Text>
                  <Text
                    style={{ fontSize: 11, color: colors.textSecondary }}
                    className="font-redditsans-regular"
                  >
                    {t("common.level_short", { level })}
                  </Text>
                </View>
                <View className="items-end">
                  <Text
                    className="text-sm font-redditsans-bold"
                    style={{
                      color: item.rank <= 3 ? MEDAL_COLORS[item.rank].bg : colors.primary,
                    }}
                  >
                    {gameType === "ReactionTime"
                      ? `${Math.max(0, 1000 - Math.round(item.highScore / 10))} ms`
                      : item.highScore}
                  </Text>
                  {gameType !== "ReactionTime" && (
                    <Text
                      style={{ fontSize: 10, color: colors.textSecondary }}
                      className="font-redditsans-regular"
                    >
                      {t("games.points_unit")}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}

          <View style={{ height: 8 }} />
        </View>
      </ScrollView>
    );
  };

  const renderGlobalContent = () => {
    if (loading) {
      return (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-4 font-redditsans-medium" style={{ color: colors.textSecondary }}>
            {t("games.loading_leaderboard", "Yüklənir...")}
          </Text>
        </View>
      );
    }

    if (leaderboard.length === 0) {
      return (
        <View className="flex-1 items-center justify-center px-8">
          <FontAwesomeIcon icon={faTrophy} size={48} color={colors.textSecondary + "50"} />
          <Text
            className="mt-4 font-redditsans-bold text-lg text-center"
            style={{ color: colors.textSecondary }}
          >
            {t("games.no_scores_yet", "Hələ heç bir nəticə yoxdur")}
          </Text>
        </View>
      );
    }

    return (
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        {hasPodium && (
          <View
            className="mx-4 rounded-3xl mb-4 overflow-hidden"
            style={{ backgroundColor: colors.cardSecondary }}
          >
            <View className="flex-row items-end justify-center pt-6 pb-0 px-4">
              <PodiumPlayer
                player={top2}
                rank={2}
                colors={colors}
                gameType={gameType}
                currentUsername={currentUsername}
              />
              <View style={{ width: 12 }} />
              <PodiumPlayer
                player={top1}
                rank={1}
                colors={colors}
                gameType={gameType}
                currentUsername={currentUsername}
              />
              <View style={{ width: 12 }} />
              <PodiumPlayer
                player={top3}
                rank={3}
                colors={colors}
                gameType={gameType}
                currentUsername={currentUsername}
              />
            </View>
          </View>
        )}

        <View
          className="mx-4 rounded-3xl overflow-hidden"
          style={{ backgroundColor: colors.cardSecondary }}
        >
          <View className="px-5 pt-5 pb-2">
            <Text className="text-sm font-redditsans-bold" style={{ color: colors.text }}>
              {t("games.rankings", "Sıralama")}
            </Text>
          </View>

          {leaderboard.map((item, index) => {
            const name =
              (`${item.firstName || ""} ${item.lastName || ""}`).trim() || item.userName;
            const level = Math.floor(Math.sqrt((item.experiencePoints || 0) / 50)) + 1;
            const isLast = index === leaderboard.length - 1;
            const isCurrentUser = currentUsername && item.userName === currentUsername;

            return (
              <View
                key={item.userId}
                className="flex-row items-center px-5 py-3"
                style={{
                  borderBottomWidth: isLast ? 0 : 1,
                  borderColor: colors.textSecondary + "10",
                  backgroundColor: isCurrentUser ? colors.primary + "15" : "transparent",
                }}
              >
                <RankBadge rank={item.rank} colors={colors} />
                <View className="ml-3">
                  <AvatarWithBorder avatarUrl={item.profilePicture} level={item.hasPremiumBorder ? 999 : level} size={36} />
                </View>
                <View className="flex-1 ml-3">
                  <Text
                    numberOfLines={1}
                    className="text-sm font-redditsans-semibold"
                    style={{ color: colors.text }}
                  >
                    {name}
                    {isCurrentUser ? ` ${t("games.you", "(You)")}` : ""}
                  </Text>
                  <Text
                    style={{ fontSize: 11, color: colors.textSecondary }}
                    className="font-redditsans-regular"
                  >
                    {t("common.level_short", { level })}
                  </Text>
                </View>
                <View className="items-end">
                  <Text
                    className="text-sm font-redditsans-bold"
                    style={{
                      color: item.rank <= 3 ? MEDAL_COLORS[item.rank].bg : colors.primary,
                    }}
                  >
                    {gameType === "ReactionTime"
                      ? `${Math.max(0, 1000 - Math.round(item.highScore / 10))} ms`
                      : item.highScore}
                  </Text>
                  {gameType !== "ReactionTime" && (
                    <Text
                      style={{ fontSize: 10, color: colors.textSecondary }}
                      className="font-redditsans-regular"
                    >
                      {t("games.points_unit")}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}

          <View style={{ height: 8 }} />
        </View>
      </ScrollView>
    );
  };

  const renderHistoryContent = () => {
    if (historyLoading && scoreHistory.length === 0) {
      return (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-4 font-redditsans-medium" style={{ color: colors.textSecondary }}>
            {t("games.loading_history", "Tarixçə yüklənir...")}
          </Text>
        </View>
      );
    }

    if (scoreHistory.length === 0) {
      return (
        <View className="flex-1 items-center justify-center px-8">
          <Text style={{ fontSize: 40 }}>📊</Text>
          <Text
            className="mt-4 font-redditsans-bold text-lg text-center"
            style={{ color: colors.textSecondary }}
          >
            {t("games.history_empty", "Hələ oyun tarixçəniz yoxdur")}
          </Text>
        </View>
      );
    }

    return (
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
       <View
  className="mx-4 rounded-3xl overflow-hidden"
  style={{ backgroundColor: colors.cardSecondary }}
>
  {scoreHistory.map((item, index) => {
    const isLast = index === scoreHistory.length - 1;
    const diffLabel = item.difficulty ? formatDifficultyLabel(item.difficulty) : null;
    const movesPart = item.moveCount > 0
      ? t("games.history_moves", "{{count}} moves", { count: item.moveCount })
      : null;
    const timePart = item.timeTakenSeconds > 0
      ? t("games.history_time", "{{time}}", { time: formatDuration(item.timeTakenSeconds) })
      : null;
    const meta = [movesPart, timePart].filter(Boolean).join(" · ");

    return (
      <View
        key={item.id || `${item.completedAtUtc}-${index}`}
        className="px-5 py-4"
        style={{
          borderBottomWidth: isLast ? 0 : 1,
          borderColor: colors.textSecondary + "10",
        }}
      >
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-sm font-redditsans-bold" style={{ color: colors.text }}>
              {formatHistoryDate(item.completedAtUtc)}
            </Text>
            {diffLabel && (
              <Text className="text-xs font-redditsans-medium mt-1" style={{ color: colors.textSecondary }}>
                {diffLabel}
              </Text>
            )}
            {meta ? (
              <Text className="text-xs font-redditsans-regular mt-2" style={{ color: colors.textSecondary }}>
                {meta}
              </Text>
            ) : null}
          </View>
          <Text className="text-base font-redditsans-bold" style={{ color: colors.primary }}>
            {formatScoreValue(item.score)}
          </Text>
        </View>
      </View>
    );
  })}
</View>
      </ScrollView>
    );
  };

  return (
    <LinearGradient colors={colors.backgroundGradient} className="flex-1">
      <SafeAreaView className="flex-1">
        <View className="flex-row items-center px-4 py-3">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-10 h-10 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: colors.cardSecondary }}
          >
            <FontAwesomeIcon icon={faArrowLeft} size={18} color={colors.text} />
          </TouchableOpacity>
          <View className="flex-1 mr-3">
            <Text className="text-xl font-redditsans-bold" style={{ color: colors.text }}>
              {t("games.leaderboard", "Liderlər")}
            </Text>
            <Text className="text-xs font-redditsans-medium" style={{ color: colors.textSecondary }}>
              {gameLabel}
            </Text>
          </View>
        </View>

        <View className="mx-4 mb-3 flex-row p-1 rounded-2xl" style={{ backgroundColor: colors.cardSecondary }}>
          <TabButton
            active={activeTab === "tournament"}
            label={t("games.tab_tournament")}
            onPress={() => switchTab("tournament")}
            colors={colors}
          />
          <TabButton
            active={activeTab === "global"}
            label={t("games.tab_global")}
            onPress={() => switchTab("global")}
            colors={colors}
          />
          <TabButton
            active={activeTab === "history"}
            label={t("games.tab_my_history")}
            onPress={() => switchTab("history")}
            colors={colors}
          />
        </View>

        {activeTab === "tournament"
          ? renderTournamentContent()
          : activeTab === "global"
            ? renderGlobalContent()
            : renderHistoryContent()}

        <TournamentRewardsModal
          visible={showRewardsModal}
          onClose={() => setShowRewardsModal(false)}
          currentLeague={tournamentData?.currentLeague || 1}
          colors={colors}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}
