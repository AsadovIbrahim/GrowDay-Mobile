import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Vibration,
} from "react-native";
import { useMMKVString } from "react-native-mmkv";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faArrowLeft,
  faTasks,
  faCheckDouble,
  faBolt,
  faChartBar,
  faStar,
} from "@fortawesome/free-solid-svg-icons";
import LinearGradient from "react-native-linear-gradient";
import CelebrationModal from "../../components/CelebrationModal";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  getUserTasksFetch,
  getUserTaskStatsFetch,
  completeUserTaskFetch,
  updateUserTaskFetch,
  deleteUserTaskFetch,
} from "../../utils/fetch";
import UserTaskCard from "../../components/UserTaskCard";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { getTranslatedTask } from "../../utils/taskTranslations";

const STATUS_FILTERS = ["All", "Pending", "InProgress", "Completed", "Missed"];

const StatBox = ({ value, label, color = "#16a34a", colors }) => (
  <View className="flex-1 rounded-2xl p-4 items-center mx-1" style={{ backgroundColor: colors.card }}>
    <Text className="text-2xl font-redditsans-bold" style={{ color }}>
      {value}
    </Text>
    <Text
      className="text-[11px] font-redditsans-regular mt-1 text-center"
      style={{ color: colors.textSecondary }}
      numberOfLines={1}
    >
      {label}
    </Text>
  </View>
);

const UserTasks = () => {
  const [token] = useMMKVString("accessToken");
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { colors } = theme;
  const { t } = useTranslation();

  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("All");
  const [error, setError] = useState(null);
  const [celebrationVisible, setCelebrationVisible] = useState(false);
  const [completedTaskData, setCompletedTaskData] = useState(null);

  const fetchData = async () => {
    try {
      setError(null);
      const [tasksRes, statsRes] = await Promise.all([
        getUserTasksFetch(token, 0, 50),
        getUserTaskStatsFetch(token),
      ]);

      if (tasksRes?.success && tasksRes?.data) {
        setTasks(tasksRes.data);
      } else if (tasksRes?.success === false) {
        setError(tasksRes.error || "tasks.failed_to_load");
        setTasks([]);
      } else {
        setTasks([]);
      }

      if (statsRes?.success && statsRes?.data) {
        setStats(statsRes.data);
      }
    } catch (err) {
      setError("tasks.failed_to_load");
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

  const handleToggleStatus = async (taskId) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const isCurrentlyCompleted = task.status === "Completed";

      if (!isCurrentlyCompleted) {
        // Mark as completed
        const res = await completeUserTaskFetch(token, taskId);
        if (res?.success) {
          // Play haptic feedback for success
          Vibration.vibrate(100);
          
          setCompletedTaskData(task);
          setCelebrationVisible(true);
          
          setTasks((prev) =>
            prev.map((t) =>
              t.id === taskId ? { ...t, status: "Completed", isOverdue: false } : t
            )
          );
        } else {
          Alert.alert(t("common.error"), res?.message || t("tasks.could_not_complete"));
        }
      } else {
        const res = await updateUserTaskFetch(token, taskId, { status: "Pending" });
        if (res?.success) {
          setTasks((prev) =>
            prev.map((t) =>
              t.id === taskId ? { ...t, status: "Pending" } : t
            )
          );
        } else {
          Alert.alert(t("common.error"), res?.message || t("tasks.could_not_uncheck"));
        }
      }
      
      // Always refresh stats
      getUserTaskStatsFetch(token).then((r) => {
        if (r?.success && r?.data) setStats(r.data);
      });
    } catch {
      Alert.alert(t("common.error"), t("tasks.failed_to_update"));
    }
  };

  const handleDelete = (taskId) => {
    Alert.alert(
      t("tasks.delete_title"),
      t("tasks.delete_confirm"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("tasks.delete_action"),
          style: "destructive",
          onPress: async () => {
            try {
              const res = await deleteUserTaskFetch(token, taskId);
              if (res?.success) {
                setTasks((prev) => prev.filter((t) => t.id !== taskId));
                getUserTaskStatsFetch(token).then((r) => {
                  if (r?.success && r?.data) setStats(r.data);
                });
              } else {
                Alert.alert(t("common.error"), res?.message || t("tasks.could_not_delete"));
              }
            } catch {
              Alert.alert(t("common.error"), t("tasks.failed_to_delete"));
            }
          },
        },
      ]
    );
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === "Missed") {
      // Show expired tasks
      if (t.status === "Expired") {
        return true;
      }
      
      // Cancelled or Completed are not missed
      if (t.status === "Cancelled" || t.status === "Completed") {
        return false;
      }
      
      // Pending/InProgress with past due date are missed
      if (t.dueDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const taskDate = new Date(t.dueDate);
        taskDate.setHours(0, 0, 0, 0);

        if (taskDate < today) {
          return true;
        }
      }
      
      return false;
    }

    // For other tabs:
    // Hide Cancelled or Expired tasks completely from the UI
    if (t.status === "Cancelled" || t.status === "Expired") {
      return false;
    }

    if (filter !== "All" && t.status !== filter) return false;

    // Filter out tasks from past days (deadline passed)
    if (t.dueDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const taskDate = new Date(t.dueDate);
      taskDate.setHours(0, 0, 0, 0);

      if (taskDate < today) {
        // If the task's deadline passed and it wasn't completed, hide it completely
        if (t.status !== "Completed") {
          return false;
        }
        // If it was completed, hide it only from the "All" tab (keep in "Completed" history)
        if (filter === "All") {
          return false;
        }
      }
    }

    return true;
  });

  const filterLabel = (f) => {
    if (f === "InProgress") return "In Progress";
    return f;
  };

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
              {t("tasks.header")}
            </Text>
          </View>
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
            {/* Stats */}
            {stats && (
              <>
                <View className="flex-row mb-3">
                  <StatBox
                    value={stats.totalTasks}
                    label={t("tasks.stats.total")}
                    color={colors.text}
                    colors={colors}
                  />
                  <StatBox
                    value={stats.completedTasks}
                    label={t("tasks.stats.completed")}
                    color="#16a34a"
                    colors={colors}
                  />
                  <StatBox
                    value={stats.pendingTasks}
                    label={t("tasks.stats.pending")}
                    color="#f59e0b"
                    colors={colors}
                  />
                </View>

                {/* Completion rate + streak row */}
                <View className="flex-row mb-5">
                  <View className="flex-1 rounded-2xl p-4 mr-1 items-center" style={{ backgroundColor: colors.card }}>
                    <Text className="text-2xl font-redditsans-bold text-blue-500">
                      {Math.round(stats.completionRate)}%
                    </Text>
                    <Text className="text-[11px] font-redditsans-regular mt-1" style={{ color: colors.textSecondary }}>
                      {t("tasks.stats.rate")}
                    </Text>
                  </View>
                  <View className="flex-1 rounded-2xl p-4 ml-1 items-center" style={{ backgroundColor: colors.card }}>
                    <Text className="text-2xl font-redditsans-bold text-orange-500">
                      🔥 {stats.currentTaskStreak}
                    </Text>
                    <Text className="text-[11px] font-redditsans-regular mt-1" style={{ color: colors.textSecondary }}>
                      {t("tasks.stats.streak")}
                    </Text>
                  </View>
                </View>
              </>
            )}

            {/* Filter Tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-5"
              contentContainerStyle={{ paddingRight: 8 }}
            >
              {STATUS_FILTERS.map((f) => (
                <TouchableOpacity
                  key={f}
                  onPress={() => setFilter(f)}
                  className="mr-2 px-4 py-2 rounded-full"
                  style={{
                    backgroundColor: filter === f ? colors.card : colors.cardSecondary,
                  }}
                >
                  <Text
                    className="font-redditsans-bold text-[13px]"
                    style={{ color: filter === f ? colors.primary : colors.textSecondary }}
                  >
                    {f === "InProgress"
                      ? t("tasks.filters.in_progress", { defaultValue: "In Progress" })
                      : f === "Missed"
                      ? t("common.missed", { defaultValue: "Missed" })
                      : t(`tasks.filters.${f.toLowerCase()}`, { defaultValue: f })}
                    {f !== "All" && stats
                      ? ` (${
                          f === "Pending"
                            ? stats.pendingTasks
                            : f === "InProgress"
                            ? stats.inProgressTasks
                            : f === "Completed"
                            ? stats.completedTasks
                            : f === "Missed"
                            ? stats.overdueTasks
                            : ""
                        })`
                      : ""}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Error */}
            {error && (
              <View className="bg-red-100 rounded-2xl p-4 mb-4">
                <Text className="text-red-600 font-redditsans-medium text-center">
                  {error.includes("tasks.failed_to_load") || error === "Failed to load tasks." 
                    ? t("tasks.failed_to_load", { defaultValue: "Failed to load tasks" }) 
                    : error}
                </Text>
              </View>
            )}

            {/* Task list */}
            {filteredTasks.length === 0 ? (
              <View className="rounded-3xl p-10 items-center mt-2" style={{ backgroundColor: colors.card }}>
                <FontAwesomeIcon icon={faTasks} size={40} color={colors.textSecondary} />
                <Text className="font-redditsans-bold text-base mt-4 text-center" style={{ color: colors.textSecondary }}>
                  {filter === "Completed"
                    ? t("explore.status.completed")
                    : filter === "Pending"
                    ? t("explore.status.pending")
                    : filter === "Missed"
                    ? t("common.missed")
                    : t("tasks.empty")}
                </Text>
                <Text className="font-redditsans-regular text-sm mt-1 text-center" style={{ color: colors.textSecondary }}>
                  {t("tasks.assigned_by_admins")}
                </Text>
              </View>
            ) : (
              filteredTasks.map((task) => (
                <UserTaskCard
                  key={task.id}
                  task={task}
                  onComplete={handleToggleStatus}
                  onDelete={handleDelete}
                />
              ))
            )}
          </ScrollView>
        )}
      </SafeAreaView>

      {/* Celebration Modal */}
      <CelebrationModal 
        visible={celebrationVisible}
        taskData={completedTaskData}
        onClose={() => setCelebrationVisible(false)}
      />
    </LinearGradient>
  );
};

export default UserTasks;
