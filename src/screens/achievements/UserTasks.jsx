import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
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
} from "@fortawesome/free-solid-svg-icons";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  getUserTasksFetch,
  getUserTaskStatsFetch,
  completeUserTaskFetch,
  updateUserTaskFetch,
  deleteUserTaskFetch,
} from "../../utils/fetch";
import UserTaskCard from "../../components/UserTaskCard";

const STATUS_FILTERS = ["All", "Pending", "InProgress", "Completed"];

const StatBox = ({ value, label, color = "#16a34a" }) => (
  <View className="flex-1 bg-white rounded-2xl p-4 items-center mx-1">
    <Text className="text-2xl font-redditsans-bold" style={{ color }}>
      {value}
    </Text>
    <Text
      className="text-[11px] font-redditsans-regular text-gray-500 mt-1 text-center"
      numberOfLines={1}
    >
      {label}
    </Text>
  </View>
);

const UserTasks = () => {
  const [token] = useMMKVString("accessToken");
  const navigation = useNavigation();

  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("All");
  const [error, setError] = useState(null);

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
        setError(tasksRes.error || "Failed to load tasks.");
        setTasks([]);
      } else {
        setTasks([]);
      }

      if (statsRes?.success && statsRes?.data) {
        setStats(statsRes.data);
      }
    } catch (err) {
      setError("Failed to load tasks.");
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
          setTasks((prev) =>
            prev.map((t) =>
              t.id === taskId ? { ...t, status: "Completed", isOverdue: false } : t
            )
          );
        } else {
          Alert.alert("Error", res?.message || "Could not complete task.");
        }
      } else {
        // Mark as pending (Uncheck)
        const res = await updateUserTaskFetch(token, taskId, { status: "Pending" });
        if (res?.success) {
          setTasks((prev) =>
            prev.map((t) =>
              t.id === taskId ? { ...t, status: "Pending" } : t
            )
          );
        } else {
          Alert.alert("Error", res?.message || "Could not uncheck task.");
        }
      }
      
      // Always refresh stats
      getUserTaskStatsFetch(token).then((r) => {
        if (r?.success && r?.data) setStats(r.data);
      });
    } catch {
      Alert.alert("Error", "Failed to update task.");
    }
  };

  const handleDelete = (taskId) => {
    Alert.alert(
      "Delete Task",
      "Are you sure you want to delete this task?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
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
                Alert.alert("Error", res?.message || "Could not delete task.");
              }
            } catch {
              Alert.alert("Error", "Failed to delete task.");
            }
          },
        },
      ]
    );
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === "All") return true;
    return t.status === filter;
  });

  const filterLabel = (f) => {
    if (f === "InProgress") return "In Progress";
    return f;
  };

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
              My Tasks
            </Text>
          </View>
          {stats?.overdueTasks > 0 && (
            <View className="bg-red-500 rounded-full px-3 py-1 flex-row items-center">
              <FontAwesomeIcon icon={faBolt} size={12} color="#fff" />
              <Text className="text-white text-[12px] font-redditsans-bold ml-1">
                {stats.overdueTasks} overdue
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
            {/* Stats */}
            {stats && (
              <>
                <View className="flex-row mb-3">
                  <StatBox
                    value={stats.totalTasks}
                    label="Total"
                    color="#374151"
                  />
                  <StatBox
                    value={stats.completedTasks}
                    label="Completed"
                    color="#16a34a"
                  />
                  <StatBox
                    value={stats.pendingTasks}
                    label="Pending"
                    color="#f59e0b"
                  />
                </View>

                {/* Completion rate + streak row */}
                <View className="flex-row mb-5">
                  <View className="flex-1 bg-white rounded-2xl p-4 mr-1 items-center">
                    <Text className="text-2xl font-redditsans-bold text-blue-500">
                      {Math.round(stats.completionRate)}%
                    </Text>
                    <Text className="text-[11px] font-redditsans-regular text-gray-500 mt-1">
                      Completion Rate
                    </Text>
                  </View>
                  <View className="flex-1 bg-white rounded-2xl p-4 ml-1 items-center">
                    <Text className="text-2xl font-redditsans-bold text-orange-500">
                      🔥 {stats.currentTaskStreak}
                    </Text>
                    <Text className="text-[11px] font-redditsans-regular text-gray-500 mt-1">
                      Day Streak
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
                    backgroundColor: filter === f ? "#fff" : "rgba(255,255,255,0.3)",
                  }}
                >
                  <Text
                    className="font-redditsans-bold text-[13px]"
                    style={{ color: filter === f ? "#16a34a" : "#374151" }}
                  >
                    {filterLabel(f)}
                    {f !== "All" && stats
                      ? ` (${
                          f === "Pending"
                            ? stats.pendingTasks
                            : f === "InProgress"
                            ? stats.inProgressTasks
                            : f === "Completed"
                            ? stats.completedTasks
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
                  {error}
                </Text>
              </View>
            )}

            {/* Task list */}
            {filteredTasks.length === 0 ? (
              <View className="bg-white rounded-3xl p-10 items-center mt-2">
                <FontAwesomeIcon icon={faTasks} size={40} color="#d1d5db" />
                <Text className="text-gray-400 font-redditsans-bold text-base mt-4 text-center">
                  {filter === "Completed"
                    ? "No completed tasks yet"
                    : filter === "Pending"
                    ? "No pending tasks"
                    : "No tasks found"}
                </Text>
                <Text className="text-gray-400 font-redditsans-regular text-sm mt-1 text-center">
                  Tasks are assigned by admins
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
    </LinearGradient>
  );
};

export default UserTasks;
