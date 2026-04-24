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

const StatBox = ({ value, label, color = "#16a34a" }) => (
  <View className="flex-1 bg-white rounded-2xl p-4 items-center mx-1">
    <Text className="text-2xl font-redditsans-bold" style={{ color }}>
      {value}
    </Text>
    <Text className="text-[11px] font-redditsans-regular text-gray-500 mt-1 text-center">
      {label}
    </Text>
  </View>
);

const Achievements = () => {
  const [token] = useMMKVString("accessToken");
  const navigation = useNavigation();

  const [achievements, setAchievements] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("All"); // "All" | "Unlocked" | "Locked"
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
      setError("Failed to load achievements.");
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
    if (filter === "Unlocked") return !!a.earnedAt;
    if (filter === "Locked") return !a.earnedAt;
    return true;
  });

  const FILTERS = ["All", "Unlocked", "Locked"];

  return (
    <LinearGradient colors={["#e7f0df", "#2f6f3f"]} className="flex-1">
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-4 mb-5">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="mr-4 w-9 h-9 bg-white/70 rounded-full items-center justify-center"
            >
              <FontAwesomeIcon icon={faArrowLeft} size={18} color="#111827" />
            </TouchableOpacity>
            <Text className="text-[26px] font-redditsans-bold text-gray-900 tracking-tight">
              Achievements
            </Text>
          </View>
          {stats?.newAchievements > 0 && (
            <View className="bg-green-500 rounded-full px-3 py-1 flex-row items-center">
              <FontAwesomeIcon icon={faBolt} size={12} color="#fff" />
              <Text className="text-white text-[12px] font-redditsans-bold ml-1">
                {stats.newAchievements} new
              </Text>
            </View>
          )}
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#fff" />
            <Text className="mt-3 text-white font-redditsans-regular text-base">
              Loading…
            </Text>
          </View>
        ) : (
          <ScrollView
            className="flex-1 px-5"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 32 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#fff"
              />
            }
          >
            {/* Stats Row */}
            {stats && (
              <View className="flex-row mb-5">
                <StatBox
                  value={stats.totalAchievements}
                  label="Unlocked"
                  color="#16a34a"
                />
                <StatBox
                  value={stats.newAchievements}
                  label="New"
                  color="#f59e0b"
                />
                <StatBox
                  value={achievements.length - stats.totalAchievements > 0
                    ? achievements.length - stats.totalAchievements
                    : 0}
                  label="Remaining"
                  color="#6b7280"
                />
              </View>
            )}

            {/* Filter Tabs */}
            <View className="flex-row mb-5 bg-white/30 rounded-2xl p-1">
              {FILTERS.map((f) => (
                <TouchableOpacity
                  key={f}
                  onPress={() => setFilter(f)}
                  className="flex-1 items-center py-2 rounded-xl"
                  style={{
                    backgroundColor: filter === f ? "#fff" : "transparent",
                  }}
                >
                  <Text
                    className="font-redditsans-bold text-[13px]"
                    style={{ color: filter === f ? "#16a34a" : "#4b5563" }}
                  >
                    {f}
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
              <View className="bg-white rounded-3xl p-10 items-center mt-4">
                <FontAwesomeIcon icon={faTrophy} size={40} color="#d1d5db" />
                <Text className="text-gray-400 font-redditsans-bold text-base mt-4">
                  {filter === "Unlocked"
                    ? "No achievements unlocked yet"
                    : filter === "Locked"
                    ? "All achievements unlocked!"
                    : "No achievements found"}
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
