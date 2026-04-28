import React, { useState, useCallback } from "react";
import { View, Text, ActivityIndicator, TouchableOpacity } from "react-native";
import { useMMKVString } from "react-native-mmkv";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faTasks, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { getUserTasksFetch, completeUserTaskFetch, updateUserTaskFetch } from "../utils/fetch";
import { theme } from "../constants/theme";
import UserTaskCard from "./UserTaskCard";

const UserTasksList = ({ maxItems = 3 }) => {
    const [userTasks, setUserTasks] = useState([]);
    const [token] = useMMKVString('accessToken');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const navigation = useNavigation();

    useFocusEffect(
        useCallback(() => {
            if (token) getUserTasks();
        }, [token])
    );

    const getUserTasks = async () => {
        try {
            setLoading(true);
            setError(false);
            const response = await getUserTasksFetch(token, 0, maxItems);
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
            <View className="bg-white rounded-xl p-6 items-center justify-center border border-red-100">
                <FontAwesomeIcon icon={faTasks} color="#ef4444" size={24} />
                <Text className="text-red-500 font-redditsans-medium mt-2">Failed to load tasks</Text>
                <TouchableOpacity onPress={getUserTasks} className="mt-2">
                    <Text className="text-green-600 font-redditsans-bold text-xs underline">Try Again</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (userTasks.length === 0) {
        return (
            <View className="bg-white rounded-xl p-8 items-center justify-center border border-dashed border-gray-200">
                <FontAwesomeIcon icon={faTasks} color="#9ca3af" size={24} />
                <Text className="text-gray-500 font-redditsans-medium mt-2">No tasks assigned</Text>
            </View>
        );
    }

    return (
        <View>
            {userTasks.map((task) => (
                <UserTaskCard
                    key={task.id}
                    task={task}
                    onComplete={handleToggleStatus}
                />
            ))}
            
        </View>
    );
};

export default UserTasksList;


