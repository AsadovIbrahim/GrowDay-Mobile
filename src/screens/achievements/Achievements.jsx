import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useMMKVString } from "react-native-mmkv";
import { useFocusEffect } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faArrowLeft,
  faTrophy,
  faCheckCircle,
  faLock,
  faBolt,
} from "@fortawesome/free-solid-svg-icons";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  getUserAchievementsFetch,
  getAchievementStatsFetch,
  markAchievementsAsSeenFetch,
} from "../../utils/fetch";
import AchievementCard from "../../components/AchievementCard";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";

const StatBox = ({ value, label, color = "#16a34a", colors }) => (
  <View className="flex-1 rounded-2xl p-4 items-center mx-1" style={{ backgroundColor: colors.card }}>
    <Text className="text-2xl font-redditsans-bold" style={{ color }}>
      {value}
    </Text>
    <Text className="text-[11px] font-redditsans-regular mt-1 text-center" style={{ color: colors.textSecondary }}>
      {label}
    </Text>
  </View>
);

const Achievements = () => {
  const [token] = useMMKVString("accessToken");
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { colors } = theme;
  const { t } = useTranslation();

  const [achievements, setAchievements] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all"); // "all" | "unlocked" | "locked"
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setError(null);
      const [achievementsRes, statsRes] = await Promise.all([
        getUserAchievementsFetch(token),
        getAchievementStatsFetch(token),
      ]);

      if (achievementsRes?.success && achievementsRes?.data) {
        setAchievements(achievementsRes.data);
      } else {
        setAchievements([]);
      }

      if (statsRes?.success && statsRes?.data) {
        setStats(statsRes.data);
        // Mark new ones as seen after viewing
        if (statsRes.data.newAchievements > 0) {
          markAchievementsAsSeenFetch(token).catch(() => {});
        }
      }
    } catch (err) {
      setError(t("common.failed_load"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (token) {
        setLoading(true);
        fetchData();
      }
    }, [token])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const filteredAchievements = achievements.filter((a) => {
    if (filter === "unlocked") return !!a.earnedAt;
    if (filter === "locked") return !a.earnedAt;
    return true;
  });

  const FILTERS = ["all", "unlocked", "locked"];

  return (
    <LinearGradient colors={colors.backgroundGradient} className="flex-1">
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-4 mb-5">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="mr-4 w-9 h-9 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.cardSecondary }}
            >
              <FontAwesomeIcon icon={faArrowLeft} size={18} color={colors.text} />
            </TouchableOpacity>
            <Text className="text-[26px] font-redditsans-bold tracking-tight" style={{ color: colors.text }}>
              {t("achievements.header")}
            </Text>
          </View>
          {stats?.newAchievements > 0 && (
            <View className="bg-green-500 rounded-full px-3 py-1 flex-row items-center">
              <FontAwesomeIcon icon={faBolt} size={12} color="#fff" />
              <Text className="text-white text-[12px] font-redditsans-bold ml-1">
                {t("achievements.stats.new_count", { count: stats.newAchievements })}
              </Text>
            </View>
          )}
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="mt-3 font-redditsans-regular text-base" style={{ color: colors.text }}>
              {t("common.loading")}
            </Text>
          </View>
        ) : (
          <ScrollView
            className="flex-1 px-5"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
              />
            }
          >
            {/* Stats Row */}
            {stats && (
              <View className="flex-row mb-5">
                <StatBox
                  value={stats.totalAchievements}
                  label={t("achievements.stats.unlocked")}
                  color={colors.primary}
                  colors={colors}
                />
                <StatBox
                  value={stats.newAchievements}
                  label={t("achievements.stats.new")}
                  color="#f59e0b"
                  colors={colors}
                />
                <StatBox
                  value={achievements.length - stats.totalAchievements > 0
                    ? achievements.length - stats.totalAchievements
                    : 0}
                  label={t("achievements.stats.remaining")}
                  color={colors.textSecondary}
                  colors={colors}
                />
              </View>
            )}

            {/* Filter Tabs */}
            <View className="flex-row mb-5 rounded-2xl p-1" style={{ backgroundColor: colors.cardSecondary }}>
              {FILTERS.map((f) => (
                <TouchableOpacity
                  key={f}
                  onPress={() => setFilter(f)}
                  className="flex-1 items-center py-2 rounded-xl"
                  style={{
                    backgroundColor: filter === f ? colors.card : "transparent",
                  }}
                >
                  <Text
                    className="font-redditsans-bold text-[13px]"
                    style={{ color: filter === f ? colors.primary : colors.textSecondary }}
                  >
                    {t(`achievements.filters.${f}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Error */}
            {error && (
              <View className="bg-red-100 rounded-2xl p-4 mb-4">
                <Text className="text-red-600 font-redditsans-medium text-center">
                  {error}
                </Text>
              </View>
            )}

            {/* Achievement list */}
            {filteredAchievements.length === 0 ? (
              <View className="rounded-3xl p-10 items-center mt-4" style={{ backgroundColor: colors.card }}>
                <FontAwesomeIcon icon={faTrophy} size={40} color={colors.textSecondary} />
                <Text className="font-redditsans-bold text-base mt-4" style={{ color: colors.textSecondary }}>
                  {filter === "unlocked"
                    ? t("achievements.empty.unlocked")
                    : filter === "locked"
                    ? t("achievements.empty.locked")
                    : t("achievements.empty.none")}
                </Text>
              </View>
            ) : (
              filteredAchievements.map((item) => (
                <AchievementCard
                  key={item.id}
                  title={item.title}
                  description={item.description}
                  icon={item.icon}
                  earnedAt={item.earnedAt}
                  isNew={item.isNew}
                />
              ))
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
};

export default Achievements;
