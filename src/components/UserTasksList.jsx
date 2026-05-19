import React, { useState, useCallback } from "react";
import { View, Text, ActivityIndicator, TouchableOpacity, Vibration } from "react-native";
import { useMMKVString } from "react-native-mmkv";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faTasks, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { getUserTasksFetch, completeUserTaskFetch, updateUserTaskFetch } from "../utils/fetch";
import { theme } from "../constants/theme";
import UserTaskCard from "./UserTaskCard";
import CelebrationModal from "./CelebrationModal";
import { useTranslation } from "react-i18next";

import { useTheme } from "../context/ThemeContext";

const UserTasksList = ({ maxItems = 3, searchQuery = "", t }) => {
    const { t: localT } = useTranslation();
    const translate = t || localT;
    const { theme } = useTheme();
    const { colors } = theme;
    const [userTasks, setUserTasks] = useState([]);
    const [token] = useMMKVString('accessToken');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [celebrationVisible, setCelebrationVisible] = useState(false);
    const [completedTaskData, setCompletedTaskData] = useState(null);
    const navigation = useNavigation();

    useFocusEffect(
        useCallback(() => {
            if (token) getUserTasks();
        }, [token])
    );

    const filteredTasks = userTasks.filter(task => {
        // Search query matching
        if (searchQuery && !task.title?.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false;
        }

        // Hide Cancelled or Expired tasks completely from the UI
        if (task.status === "Cancelled" || task.status === "Expired") {
            return false;
        }

        // Filter out tasks from past days (deadline passed)
        if (task.dueDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const taskDate = new Date(task.dueDate);
            taskDate.setHours(0, 0, 0, 0);

            if (taskDate < today) {
                return false;
            }
        }

        return true;
    }).slice(0, maxItems);

    const getUserTasks = async () => {
        try {
            setLoading(true);
            setError(false);
            // Fetch 50 tasks so we have enough items for client-side filtering
            const response = await getUserTasksFetch(token, 0, 50);
            if (response?.success && response?.data) {
                setUserTasks(response.data);
            } else if (response?.success === false) {
                // If the fetch call failed but didn't throw (e.g. 404, 500 managed by handleResponse)
                setError(true);
            }
        } catch (error) {
            // Silently log or handle network errors without triggering developer-visible overlays
            console.log("Tasks list fetch error managed:", error.message);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (taskId) => {
        try {
            const task = userTasks.find(t => t.id === taskId);
            if (!task) return;

            const isCurrentlyCompleted = task.status === "Completed";
            
            if (!isCurrentlyCompleted) {
                // Mark as completed
                const res = await completeUserTaskFetch(token, taskId);
                if (res?.success) {
                    Vibration.vibrate(100);
                    setCompletedTaskData(task);
                    setCelebrationVisible(true);
                    setUserTasks(prev =>
                        prev.map(t => t.id === taskId ? { ...t, status: "Completed" } : t)
                    );
                }
            } else {
                // Mark as pending (Uncheck)
                const res = await updateUserTaskFetch(token, taskId, { status: "Pending" });
                if (res?.success) {
                    setUserTasks(prev =>
                        prev.map(t => t.id === taskId ? { ...t, status: "Pending" } : t)
                    );
                }
            }
        } catch (err) {
            console.error("Error toggling task status:", err);
        }
    };

    if (loading) {
        return (
            <View className="py-8 items-center justify-center">
                <ActivityIndicator color={theme.colors.primary} />
            </View>
        );
    }

    if (error) {
        return (
            <View className="rounded-xl p-6 items-center justify-center border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
                <FontAwesomeIcon icon={faTasks} color="#ef4444" size={24} />
                <Text className="text-red-500 font-redditsans-medium mt-2">{translate("tasks.failed_to_load", { defaultValue: "Failed to load tasks" })}</Text>
                <TouchableOpacity onPress={getUserTasks} className="mt-2">
                    <Text className="text-green-600 font-redditsans-bold text-xs underline">{translate("tasks.try_again", { defaultValue: "Try Again" })}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (filteredTasks.length === 0) {
        if (searchQuery) {
            return (
                <View className="rounded-xl p-6 items-center justify-center border border-dashed" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
                    <Text className="font-redditsans-medium italic" style={{ color: colors.textSecondary }}>{t("my_habits.no_habits_search", { defaultValue: `No tasks matching "${searchQuery}"` })}</Text>
                </View>
            );
        }
        return (
            <View className="rounded-xl p-8 items-center justify-center border border-dashed" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
                <FontAwesomeIcon icon={faTasks} color={colors.textSecondary} size={24} />
                <Text className="font-redditsans-medium mt-2" style={{ color: colors.textSecondary }}>{t("tasks.empty", { defaultValue: "No tasks assigned" })}</Text>
            </View>
        );
    }

    return (
        <View>
            {filteredTasks.map((task) => (
                <UserTaskCard
                    key={task.id}
                    task={task}
                    onComplete={handleToggleStatus}
                />
            ))}
            
            <CelebrationModal 
                visible={celebrationVisible}
                taskData={completedTaskData}
                onClose={() => setCelebrationVisible(false)}
            />
        </View>
    );
};

export default UserTasksList;


